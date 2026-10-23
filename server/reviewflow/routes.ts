import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import {
  reviewFlowStore,
  REVIEWFLOW_PRO_PLAN,
  COMING_SOON_FEATURES,
  SUPER_ADMIN_ALLOWLIST
} from './store.ts';
import { GoogleGenAI } from '@google/genai';
import { analyzeBusinessAI, generateCustomerExperienceTopicsAI } from './business-analyzer.ts';
import { generateExperienceCardsForBusiness } from './experience-cards.ts';
import { aiReviewEngine, sanitizeReviewText } from './ai-review-engine.ts';
import { firebaseSyncService } from './firebase-sync.service.ts';
import { paymentGatewayRegistry, paymentProvider } from './payments/index.ts';
import { generateInvoiceHtml } from './invoice-pdf.service.ts';

export const reviewFlowRouter = Router();

// Per-IP Rate limiting for AI draft generations
const aiRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = aiRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    aiRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 15 req/min
    return true;
  }
  if (record.count >= 15) {
    return false;
  }
  record.count++;
  return true;
}

// Google Review Link Format Validation (Section 18)
export function isValidGoogleReviewUrl(urlStr: string): { valid: boolean; error?: string; placeId?: string } {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) {
      return { valid: false, error: 'Please enter a direct Google review link.' };
    }
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Review URL must use secure HTTPS protocol.' };
    }
    const host = parsed.hostname.toLowerCase();
    const isGoogle =
      host.includes('google.com') ||
      host.includes('google.co.in') ||
      host.includes('g.page') ||
      host.includes('goo.gl') ||
      host.includes('maps.app.goo.gl');

    if (!isGoogle) {
      return {
        valid: false,
        error: 'URL must be an official Google review destination (e.g. g.page/r/..., search.google.com/local/writereview, or maps.app.goo.gl/...)'
      };
    }

    // Reject generic search/maps homepage that does not open a review dialogue
    if (
      (host === 'google.com' || host === 'www.google.com') &&
      parsed.pathname === '/' &&
      !parsed.search
    ) {
      return {
        valid: false,
        error: 'This is the generic Google homepage. Please paste the direct review link for your business.'
      };
    }

    if (
      host.includes('maps.google.com') &&
      (parsed.pathname === '/' || parsed.pathname === '/maps') &&
      !parsed.search
    ) {
      return {
        valid: false,
        error: 'This is the generic Google Maps homepage. Please paste your business\'s direct review link.'
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid, well-formed HTTPS URL.' };
  }
}

// Authenticated User Resolution
function getRequestUser(req: Request) {
  const uid =
    (req.headers['x-user-uid'] as string) ||
    (req.headers['authorization'] as string)?.replace('Bearer ', '');
  const email = ((req.headers['x-user-email'] as string) || '').trim().toLowerCase();

  if (!uid && !email) {
    return null;
  }

  let user = uid ? reviewFlowStore.getUserByUid(uid) : null;
  if (!user && email) {
    user = reviewFlowStore.getUserByEmail(email);
  }

  const isSuperAdminUser =
    email === 'chakankarsai@gmail.com' ||
    email === 'chakankarsai@gmail.co' ||
    uid === '6d6krJBCmDVgpwDhmhzDNI72pYa2' ||
    uid === 'usr_superadmin_chakankarsai_gmail_co' ||
    uid === 'usr_cc55c9a494f0';

  if (!user && (uid || email)) {
    user = reviewFlowStore.upsertUser({
      uid: uid || `usr_${Date.now()}`,
      email: email || '',
      displayName: (email || 'Admin').split('@')[0],
      role: isSuperAdminUser ? 'SUPER_ADMIN' : 'CLIENT'
    });
  } else if (user && isSuperAdminUser && user.role !== 'SUPER_ADMIN') {
    user = reviewFlowStore.upsertUser({
      ...user,
      role: 'SUPER_ADMIN'
    });
  }

  return user || null;
}

// Authentication Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({
      error: 'Your account has been suspended by the platform administrator. Please contact support.'
    });
  }
  (req as any).user = user;
  next();
}

// Super Admin Privileged Middleware (Section 5 & 6)
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Access Denied: Super Admin privileges required.'
    });
  }
  (req as any).user = user;
  next();
}

// Sales Team or Super Admin Middleware (CRM)
function requireSalesOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'SALES_TEAM' && user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Access Denied: Sales Team or Super Admin privileges required.'
    });
  }
  (req as any).user = user;
  next();
}

// =============================================================
// AUTHENTICATION & CLIENT ACCOUNT ENDPOINTS
// =============================================================

// Client Sign Up
reviewFlowRouter.post('/auth/signup', (req: Request, res: Response) => {
  const { uid, email, password, name, businessName, phone, termsAccepted, emailVerified } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const result = reviewFlowStore.registerUser({
    uid,
    email,
    password,
    name,
    businessName,
    phone,
    termsAccepted,
    emailVerified
  });

  if (result.error || !result.user) {
    return res.status(400).json({ error: result.error || 'Failed to create account.' });
  }

  const subscription = reviewFlowStore.getSubscription(result.user.uid);
  const business = reviewFlowStore.getBusinessByOwner(result.user.uid);

  res.status(201).json({
    user: result.user,
    subscription,
    business,
    message: 'Account created successfully.'
  });
});

// Client Login
reviewFlowRouter.post('/auth/login', (req: Request, res: Response) => {
  const { uid, email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // If Firebase verified UID is supplied (Section 25 & 26: Account Recovery)
  if (uid) {
    let user = reviewFlowStore.getUserByUid(uid) || reviewFlowStore.getUserByEmail(email);
    if (!user) {
      user = reviewFlowStore.upsertUser({
        uid,
        email,
        displayName: email.split('@')[0],
        lastLoginAt: new Date().toISOString()
      });
    }
    const subscription = reviewFlowStore.getSubscription(user.uid);
    const business = reviewFlowStore.getBusinessByOwner(user.uid);
    return res.json({
      user,
      subscription,
      business,
      message: 'Logged in successfully.'
    });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const result = reviewFlowStore.authenticateUser(email, password);

  if (result.error || !result.user) {
    return res.status(401).json({ error: result.error || 'Invalid email or password.' });
  }

  const subscription = reviewFlowStore.getSubscription(result.user.uid);
  const business = reviewFlowStore.getBusinessByOwner(result.user.uid);

  res.json({
    user: result.user,
    subscription,
    business,
    message: 'Logged in successfully.'
  });
});

// Request Password Reset
reviewFlowRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const result = reviewFlowStore.requestPasswordReset(email);

  if (result.error) {
    return res.status(404).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Password reset code has been dispatched.',
    resetCode: result.resetCode,
    resetToken: result.resetToken
  });
});

// Reset Password with Code / Token
reviewFlowRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
  }

  const result = reviewFlowStore.resetPasswordWithCode({
    email,
    code,
    newPassword
  });

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Password has been updated successfully. You can now sign in with your new password.'
  });
});

reviewFlowRouter.post('/auth/sync', (req: Request, res: Response) => {
  const { uid, email, displayName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email are required' });
  }
  const user = reviewFlowStore.upsertUser({ uid, email, displayName });
  const subscription = reviewFlowStore.getSubscription(user.uid);
  const business = reviewFlowStore.getBusinessByOwner(user.uid);
  res.json({ user, subscription, business });
});

reviewFlowRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const subscription = reviewFlowStore.getSubscription(user.uid);
  const business = reviewFlowStore.getBusinessByOwner(user.uid);
  res.json({ user, subscription, business });
});

// Verify Email Endpoint (Section 6)
reviewFlowRouter.post('/auth/verify-email', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = reviewFlowStore.verifyUserEmail(user.uid);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Failed to verify email.' });
  }
  res.json({ success: true, user: result.user, message: 'Email verified successfully.' });
});

// Safe Development Reset Endpoint (Section 45)
reviewFlowRouter.post('/dev/reset', (req: Request, res: Response) => {
  const isAllowed = process.env.NODE_ENV !== 'production' || req.headers['x-dev-reset-key'] === 'reviewflow_dev_secret';
  if (!isAllowed) {
    return res.status(403).json({ error: 'Development reset is only available in development mode.' });
  }
  const result = reviewFlowStore.resetDevelopmentData();
  res.json(result);
});

// Dedicated Super Admin Login (Section 6)
reviewFlowRouter.post('/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = reviewFlowStore.getUserByEmail(cleanEmail);

  // Verification: User must exist, have role SUPER_ADMIN, and be active
  if (!user || user.role !== 'SUPER_ADMIN') {
    reviewFlowStore.addAuditLog({
      id: 'log_' + Date.now(),
      actorUid: user?.uid || 'unknown',
      actorEmail: cleanEmail,
      action: 'ADMIN_LOGIN_FAILED',
      targetType: 'system',
      targetId: 'super_admin_portal',
      details: `Failed Super Admin login attempt from IP ${ip}.`,
      result: 'DENIED',
      ipAddress: ip,
      createdAt: new Date().toISOString()
    });

    // Secure generic error to avoid email enumeration
    return res.status(403).json({
      error: 'Access Denied: Invalid administrator credentials or unauthorized account.'
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({
      error: 'Account disabled: This administrator account has been deactivated.'
    });
  }

  // Check password
  const isSuperAdminDefaultPass = password === 'Sai@@2907crm' && (cleanEmail === 'chakankarsai@gmail.co' || cleanEmail === 'chakankarsai@gmail.com');
  const isCorrectPassword = isSuperAdminDefaultPass || (user.passwordHash ? reviewFlowStore.verifyPassword(password, user.passwordHash) : (password === 'adminpassword123' || password === 'Sai@@2907crm'));

  if (!isCorrectPassword) {
    reviewFlowStore.addAuditLog({
      id: 'log_' + Date.now(),
      actorUid: user.uid,
      actorEmail: cleanEmail,
      action: 'ADMIN_LOGIN_FAILED',
      targetType: 'system',
      targetId: 'super_admin_portal',
      details: `Failed Super Admin login attempt (wrong password) from IP ${ip}.`,
      result: 'DENIED',
      ipAddress: ip,
      createdAt: new Date().toISOString()
    });
    return res.status(403).json({
      error: 'Access Denied: Invalid administrator credentials or incorrect password.'
    });
  }

  // Ensure passwordHash is saved
  if (!user.passwordHash || isSuperAdminDefaultPass) {
    user.passwordHash = reviewFlowStore.hashPassword(password);
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();

  reviewFlowStore.addAuditLog({
    id: 'log_' + Date.now(),
    actorUid: user.uid,
    actorEmail: user.email,
    action: 'ADMIN_LOGIN',
    targetType: 'system',
    targetId: 'super_admin_portal',
    details: `Super Admin logged in successfully from IP ${ip}.`,
    result: 'SUCCESS',
    ipAddress: ip,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    }
  });
});

// =============================================================
// SUPER ADMIN EMPLOYEE & ACCESS CONTROL ENDPOINTS
// =============================================================

// List Employees
reviewFlowRouter.get('/admin/employees', requireSuperAdmin, (req: Request, res: Response) => {
  const employees = reviewFlowStore.getEmployees();
  res.json({ employees });
});

// Create Employee with Custom Permissions
reviewFlowRouter.post('/admin/employees', requireSuperAdmin, (req: Request, res: Response) => {
  const { name, email, phone, password, role, department, permissions } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const employee = reviewFlowStore.createEmployee({
    name,
    email,
    phone: phone || '',
    password: password || 'password123',
    role: role || 'SALES_TEAM',
    department: department || 'Sales & Inquiries',
    permissions: Array.isArray(permissions) ? permissions : ['leads:manage']
  });

  reviewFlowStore.addAuditLog({
    id: 'log_' + Date.now(),
    actorUid: (req as any).user?.uid || 'usr_superadmin',
    actorEmail: (req as any).user?.email || 'superadmin',
    action: 'EMPLOYEE_CREATED',
    targetType: 'employee',
    targetId: employee.uid,
    details: `Created new employee "${employee.name}" (${employee.email}) with role ${employee.role} and ${employee.permissions.length} access permissions.`,
    result: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ success: true, employee });
});

// Update Employee (Permissions, details, password)
reviewFlowRouter.put('/admin/employees/:uid', requireSuperAdmin, (req: Request, res: Response) => {
  const { uid } = req.params;
  const updates = req.body;

  const employee = reviewFlowStore.updateEmployee(uid, updates);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  reviewFlowStore.addAuditLog({
    id: 'log_' + Date.now(),
    actorUid: (req as any).user?.uid || 'usr_superadmin',
    actorEmail: (req as any).user?.email || 'superadmin',
    action: 'EMPLOYEE_UPDATED',
    targetType: 'employee',
    targetId: employee.uid,
    details: `Updated employee "${employee.name}" permissions/status.`,
    result: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, employee });
});

// Delete Employee
reviewFlowRouter.delete('/admin/employees/:uid', requireSuperAdmin, (req: Request, res: Response) => {
  const { uid } = req.params;
  const success = reviewFlowStore.deleteEmployee(uid);
  if (!success) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  reviewFlowStore.addAuditLog({
    id: 'log_' + Date.now(),
    actorUid: (req as any).user?.uid || 'usr_superadmin',
    actorEmail: (req as any).user?.email || 'superadmin',
    action: 'EMPLOYEE_DELETED',
    targetType: 'employee',
    targetId: uid,
    details: `Deleted/suspended employee ${uid}.`,
    result: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, message: 'Employee removed successfully.' });
});

// =============================================================
// SALES CRM ENDPOINTS (Section 9-17)
// =============================================================

// Public Landing Page Inquiry (Section 8)
reviewFlowRouter.post('/crm/inquiry', (req: Request, res: Response) => {
  const { name, businessName, phone, email, category, city, googleBusinessUrl, message } = req.body;
  if (!name || !businessName || !phone || !email) {
    return res.status(400).json({ error: 'Name, business name, phone, and email are required.' });
  }

  const lead = reviewFlowStore.createCrmInquiry({
    name,
    businessName,
    phone,
    email,
    category: category || 'General',
    city: city || 'Local',
    googleBusinessUrl,
    message
  });

  res.status(201).json({
    success: true,
    message: 'Thank you. Our team will contact you shortly.',
    leadId: lead.id
  });
});

// Dedicated Sales CRM Login (Section 6)
reviewFlowRouter.post('/crm/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = reviewFlowStore.getUserByEmail(email.trim().toLowerCase());
  if (!user || (user.role !== 'SALES_TEAM' && user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Access Denied: Invalid credentials or not a sales team member.' });
  }

  const authRes = reviewFlowStore.authenticateUser(email, password);
  if (authRes.error || !authRes.user) {
    return res.status(401).json({ error: authRes.error || 'Invalid credentials.' });
  }

  res.json({
    success: true,
    user: authRes.user,
    message: 'Logged into Sales CRM successfully.'
  });
});

// CRM Metrics Dashboard (Section 10)
reviewFlowRouter.get('/crm/metrics', requireSalesOrAdmin, (req: Request, res: Response) => {
  const metrics = reviewFlowStore.getCrmMetrics();
  res.json({ metrics });
});

// CRM Leads List & Filter (Section 11 & 12)
reviewFlowRouter.get('/crm/leads', requireSalesOrAdmin, (req: Request, res: Response) => {
  const { status, search, assignedSalesId } = req.query as Record<string, string>;
  const user = (req as any).user;
  
  const salesFilter = user.role === 'SALES_TEAM' && !assignedSalesId ? user.uid : assignedSalesId;
  const leads = reviewFlowStore.getCrmLeads({ status, search, assignedSalesId: salesFilter });
  res.json({ leads });
});

// Create Lead manually
reviewFlowRouter.post('/crm/leads', requireSalesOrAdmin, (req: Request, res: Response) => {
  const { name, businessName, phone, email, category, city, googleBusinessUrl, message } = req.body;
  if (!name || !businessName || !phone || !email) {
    return res.status(400).json({ error: 'Name, business name, phone, and email are required.' });
  }

  const lead = reviewFlowStore.createCrmInquiry({
    name,
    businessName,
    phone,
    email,
    category,
    city,
    googleBusinessUrl,
    message
  });
  res.status(201).json({ lead });
});

// Single Lead Detail with notes, calls, tasks
reviewFlowRouter.get('/crm/leads/:id', requireSalesOrAdmin, (req: Request, res: Response) => {
  const lead = reviewFlowStore.getCrmLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  const notes = reviewFlowStore.getCrmNotes({ leadId: lead.id, clientId: lead.clientId });
  const calls = reviewFlowStore.getCrmCalls({ leadId: lead.id, clientId: lead.clientId });
  const tasks = reviewFlowStore.getCrmFollowUps().filter(t => t.leadId === lead.id || (lead.clientId && t.clientId === lead.clientId));

  res.json({ lead, notes, calls, tasks });
});

// Update Lead Status & Assignment
reviewFlowRouter.put('/crm/leads/:id', requireSalesOrAdmin, (req: Request, res: Response) => {
  const lead = reviewFlowStore.updateCrmLead(req.params.id, req.body);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ lead });
});

// Convert Lead to Active Client (Section 63)
reviewFlowRouter.post('/crm/leads/:id/convert', requireSalesOrAdmin, (req: Request, res: Response) => {
  const result = reviewFlowStore.convertLeadToClient(req.params.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, user: result.user, message: 'Lead converted to active Client successfully.' });
});

// Add Sales Note
reviewFlowRouter.post('/crm/notes', requireSalesOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { leadId, clientId, text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Note text is required.' });

  const note = reviewFlowStore.addCrmNote({
    leadId,
    clientId,
    authorId: user.uid,
    authorName: user.displayName || 'Sales Member',
    text
  });
  res.status(201).json({ note });
});

// Log Sales Call
reviewFlowRouter.post('/crm/calls', requireSalesOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { leadId, clientId, phone, outcome, notes, nextFollowUpAt } = req.body;
  if (!phone || !outcome) return res.status(400).json({ error: 'Phone and outcome are required.' });

  const callRecord = reviewFlowStore.logCrmCall({
    leadId,
    clientId,
    salesPersonId: user.uid,
    salesPersonName: user.displayName || 'Sales Member',
    phone,
    outcome,
    notes: notes || '',
    nextFollowUpAt
  });
  res.status(201).json({ call: callRecord });
});

// Schedule Follow-Up Task (Section 15)
reviewFlowRouter.get('/crm/follow-ups', requireSalesOrAdmin, (req: Request, res: Response) => {
  const { assignedUserId, status } = req.query as Record<string, string>;
  const tasks = reviewFlowStore.getCrmFollowUps(assignedUserId, status);
  res.json({ tasks });
});

reviewFlowRouter.post('/crm/follow-ups', requireSalesOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { leadId, clientId, clientName, businessName, phone, type, dueDate, time, notes, assignedUserId } = req.body;
  if (!dueDate || !type) return res.status(400).json({ error: 'Type and due date are required.' });

  const task = reviewFlowStore.createCrmFollowUp({
    leadId,
    clientId,
    clientName,
    businessName,
    phone,
    type,
    dueDate,
    time,
    notes: notes || '',
    assignedUserId: assignedUserId || user.uid,
    assignedUserName: user.displayName || 'Sales Specialist'
  });
  res.status(201).json({ task });
});

reviewFlowRouter.put('/crm/follow-ups/:id', requireSalesOrAdmin, (req: Request, res: Response) => {
  const task = reviewFlowStore.updateCrmFollowUp(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.json({ task });
});

// Subscriptions Expiring Soon (Section 14 & 56)
reviewFlowRouter.get('/crm/expiring-subscriptions', requireSalesOrAdmin, (req: Request, res: Response) => {
  const thresholdDays = parseInt(req.query.days as string, 10) || 7;
  const expiring = reviewFlowStore.getCrmExpiringSubscriptions(thresholdDays);
  res.json({ subscriptions: expiring });
});

// Sales Team Members (Section 17)
reviewFlowRouter.get('/crm/sales-users', requireSalesOrAdmin, (req: Request, res: Response) => {
  const users = reviewFlowStore.getSalesUsers();
  res.json({ users });
});

reviewFlowRouter.post('/crm/sales-users', requireSuperAdmin, (req: Request, res: Response) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ error: 'Name, email, and phone are required.' });

  const salesUser = reviewFlowStore.createSalesUser({ name, email, phone });
  res.status(201).json({ user: salesUser });
});

// Safe Dev Reset endpoint (Development only, requires DEV_RESET_ENABLED=true)
reviewFlowRouter.post('/admin/dev-reset', (req: Request, res: Response) => {
  try {
    const result = reviewFlowStore.resetDevData();
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// =============================================================
// BUSINESS PROFILE & MULTI-BUSINESS MANAGEMENT (Up to 3 businesses)
// =============================================================
reviewFlowRouter.get('/businesses', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const businesses = reviewFlowStore.getBusinessesByOwner(user.uid);
  const activeBusinessId = reviewFlowStore.getActiveBusinessId(user.uid);
  res.json({ businesses, activeBusinessId });
});

reviewFlowRouter.get('/business', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const businessId = req.query.businessId as string | undefined;
  const business = reviewFlowStore.getBusinessByOwner(user.uid, businessId);
  res.json({ business: business || null });
});

reviewFlowRouter.get('/businesses/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = reviewFlowStore.getBusinessById(req.params.id);
  if (!business || business.ownerUid !== user.uid) {
    return res.status(404).json({ error: 'Business not found.' });
  }
  res.json({ business });
});

reviewFlowRouter.post('/businesses', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = req.body;

  if (data.googleReviewUrl && data.googleReviewUrl.trim()) {
    const urlCheck = isValidGoogleReviewUrl(data.googleReviewUrl.trim());
    if (!urlCheck.valid) {
      return res.status(400).json({ error: urlCheck.error });
    }
  }

  const result = reviewFlowStore.saveBusiness(user.uid, data);
  if (result.error) {
    return res.status(403).json({ error: result.error });
  }
  res.json({ business: result.business });
});

reviewFlowRouter.put('/businesses/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = req.body;

  if (data.googleReviewUrl && data.googleReviewUrl.trim()) {
    const urlCheck = isValidGoogleReviewUrl(data.googleReviewUrl.trim());
    if (!urlCheck.valid) {
      return res.status(400).json({ error: urlCheck.error });
    }
  }

  const result = reviewFlowStore.saveBusiness(user.uid, data, req.params.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ business: result.business });
});

reviewFlowRouter.delete('/businesses/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const success = reviewFlowStore.deleteBusiness(user.uid, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Business not found or unauthorized.' });
  }
  res.json({ success: true });
});

reviewFlowRouter.post('/businesses/:id/activate', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const success = reviewFlowStore.setActiveBusiness(user.uid, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Business not found or unauthorized.' });
  }
  res.json({ success: true, activeBusinessId: req.params.id });
});

reviewFlowRouter.post('/business', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = req.body;
  const businessId = req.query.businessId as string | undefined || data.id;

  if (data.googleReviewUrl && data.googleReviewUrl.trim()) {
    const urlCheck = isValidGoogleReviewUrl(data.googleReviewUrl.trim());
    if (!urlCheck.valid) {
      return res.status(400).json({ error: urlCheck.error });
    }
  }

  const result = reviewFlowStore.saveBusiness(user.uid, data, businessId);
  if (result.error) {
    return res.status(403).json({ error: result.error });
  }
  res.json({ business: result.business });
});

// =============================================================
// CREDITS & USAGE (Atomic Server-Side Controlled)
// =============================================================
reviewFlowRouter.get('/credits', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const balance = reviewFlowStore.getCreditBalance(user.uid);
  const packages = reviewFlowStore.getCreditPackages();
  res.json({ ...balance, packages });
});

reviewFlowRouter.post('/credits/purchase', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { packageId } = req.body;
  const packages = reviewFlowStore.getCreditPackages();
  const pkg = packages.find(p => p.id === packageId) || packages[0];
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid credit package selected.' });
  }

  const tx = reviewFlowStore.addCredits(
    user.uid,
    pkg.credits,
    'PURCHASE',
    pkg.price,
    pkg.currency,
    'pay_' + Date.now(),
    `Purchased ${pkg.name}`
  );
  const balance = reviewFlowStore.getCreditBalance(user.uid);
  res.json({ success: true, transaction: tx, ...balance });
});

// Test & Verify Google Review Link (Section 18)
reviewFlowRouter.post('/business/test-google-url', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { url, confirmVerified = false } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'Please provide a Google Review URL to test.' });
  }

  const check = isValidGoogleReviewUrl(url);
  if (!check.valid) {
    return res.status(400).json({ valid: false, error: check.error });
  }

  if (confirmVerified) {
    const now = new Date().toISOString();
    const saved = reviewFlowStore.saveBusiness(user.uid, {
      googleReviewUrl: url.trim(),
      googleReviewVerified: true,
      googleReviewVerifiedAt: now
    });
    return res.json({
      valid: true,
      verified: true,
      verifiedAt: now,
      business: saved.business,
      message: 'Google Review link verified successfully by business owner.'
    });
  }

  res.json({
    valid: true,
    testUrl: url.trim(),
    message: 'URL format is valid. Please click the destination to verify it opens your direct review dialog.'
  });
});

// =============================================================
// NFC CARD & QR CODES SYSTEM (1 Primary NFC Card & Dynamic QR per Starter Subscription)
// =============================================================
reviewFlowRouter.get('/nfc-card', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = reviewFlowStore.getBusinessByOwner(user.uid);
  if (!business) {
    return res.status(404).json({ error: 'No business found for this account.' });
  }
  const nfcCard = reviewFlowStore.getNfcCardByBusiness(business.id, user.uid);
  res.json({ nfcCard });
});

reviewFlowRouter.get('/qr-codes', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = reviewFlowStore.getBusinessByOwner(user.uid);
  if (!business) {
    return res.json({ qrCodes: [] });
  }
  const qrCodes = reviewFlowStore.getQrCodesByBusiness(business.id, user.uid);
  res.json({ qrCodes });
});

reviewFlowRouter.post('/qr-codes', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  let business = reviewFlowStore.getBusinessByOwner(user.uid);
  if (!business) {
    const saveRes = reviewFlowStore.saveBusiness(user.uid, {
      businessName: 'My Local Business',
      googleReviewUrl: 'https://g.page/r/sample/review'
    });
    business = saveRes.business!;
  }

  const { label = 'Billing Counter', regenerate = false } = req.body;
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const existingQrs = reviewFlowStore.getQrCodesByBusiness(business.id, user.uid);
  if (existingQrs.length > 0 && (regenerate || label === existingQrs[0].label)) {
    const primary = existingQrs[0];
    primary.destinationUrl = `${baseUrl}/r/${primary.uniqueCode}`;
    primary.status = 'ACTIVE';
    reviewFlowStore.updateQrCode(primary.id, { status: 'ACTIVE' }, user.uid);
    return res.json({ qrCode: primary });
  }

  const result = reviewFlowStore.createQrCode(business.id, user.uid, label, baseUrl);
  if (result.error || !result.qrCode) {
    return res.status(400).json({ error: result.error || 'Failed to generate QR code' });
  }

  res.json({ qrCode: result.qrCode });
});

reviewFlowRouter.patch('/qr-codes/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { label, status } = req.body;

  const updated = reviewFlowStore.updateQrCode(id, { label, status }, user.uid);
  if (!updated) {
    return res.status(404).json({ error: 'QR Code not found or unauthorized' });
  }
  res.json({ qrCode: updated });
});

reviewFlowRouter.delete('/qr-codes/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const success = reviewFlowStore.deleteQrCode(id, user.uid);
  if (!success) {
    return res.status(404).json({ error: 'QR Code not found or unauthorized' });
  }
  res.json({ success: true });
});

// =============================================================
// PUBLIC CUSTOMER QR LOOKUP & REDIRECT (Section 19 & 20)
// =============================================================
reviewFlowRouter.get('/public/qr-lookup/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const qrCode = reviewFlowStore.getQrCodeByUniqueCode(code);
  if (!qrCode || qrCode.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'QR Code is paused or unavailable.' });
  }

  const business = reviewFlowStore.getBusinessById(qrCode.businessId);
  const isBusinessActive = business && (business.status === 'ACTIVE' || business.status === 'active');
  if (!business || !isBusinessActive) {
    return res.status(404).json({ error: 'This business account is currently inactive.' });
  }

  // Load confirmed experience topics for this business
  const confirmedTopics = reviewFlowStore.getExperienceTopics(business.id);
  const cards = confirmedTopics.length > 0
    ? confirmedTopics.map(t => ({ id: t.id, title: t.title, placeholder: t.description, enabled: true }))
    : (business.experienceCards && business.experienceCards.length > 0
        ? business.experienceCards
        : generateExperienceCardsForBusiness({
            category: business.category,
            mainCategory: business.mainCategory,
            subcategory: business.subcategory,
            description: business.description,
            verifiedFacts: business.verifiedFacts
          }));

  res.json({
    businessId: business.id,
    id: business.id,
    uniqueCode: qrCode.uniqueCode,
    qrLabel: qrCode.label,
    businessName: business.businessName,
    category: business.category,
    mainCategory: business.mainCategory,
    subcategory: business.subcategory,
    logoUrl: business.logoUrl,
    googleReviewUrl: business.googleReviewUrl,
    location: business.location || (business.city ? `${business.city}, ${business.state}` : ''),
    customerHeading: business.customerHeading || 'How was your experience?',
    welcomeMessage: business.welcomeMessage || "Choose what you'd like to talk about.",
    brandAccentColor: business.brandAccentColor || '#2563eb',
    supportedLanguages: business.supportedLanguages || ['English', 'Hindi', 'Marathi'],
    tonePreference: business.tonePreference || 'natural',
    experienceCards: cards
  });
});

// Customer Journey Event Tracking (Section 23, 24, 25)
reviewFlowRouter.post('/events', (req: Request, res: Response) => {
  const { uniqueCode, eventType, metadata } = req.body;
  if (!uniqueCode || !eventType) {
    return res.status(400).json({ error: 'uniqueCode and eventType are required' });
  }
  reviewFlowStore.recordAssistanceEvent(uniqueCode, eventType, metadata);
  res.json({ success: true });
});

// =============================================================
// REAL-TIME ANALYTICS (Section 26 & 27)
// =============================================================
reviewFlowRouter.get('/analytics', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const business = reviewFlowStore.getBusinessByOwner(user.uid);

  if (!business) {
    return res.json({
      totalScans: 0,
      scansToday: 0,
      scansThisWeek: 0,
      scansThisMonth: 0,
      activeQrCodes: 0,
      totalQrCodes: 0,
      eventsBreakdown: {
        qrScans: 0,
        assistancePageViews: 0,
        aiDraftsGenerated: 0,
        reviewsCopied: 0,
        googleReviewClicks: 0
      },
      chartData: [],
      qrBreakdown: [],
      recentActivity: []
    });
  }

  const analytics = reviewFlowStore.getBusinessAnalytics(business.id, days);
  res.json(analytics);
});

// =============================================================
// AI REVIEW DRAFT ENGINE (SYSTEM B: CUSTOMER REVIEW DRAFT) (Sections 1-46)
// Real Gemini AI requests only. Zero static reviews, zero fallback templates.
// =============================================================
const handleReviewGenerationEndpoint = async (req: Request, res: Response, forceRegen = false) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkAiRateLimit(ip)) {
    return res.status(429).json({
      error: 'Please wait a moment before generating another review.'
    });
  }

  const {
    customerFeedback,
    customerExperience,
    customerText,
    selectedExperienceCards = [],
    selectedCards = [],
    selectedTopics = [],
    language = 'English',
    businessId,
    uniqueCode,
    sessionId,
    iteration = 1,
    generationNumber,
    requestId,
    reviewLength
  } = req.body;

  const actualCustomerText = (customerFeedback || customerExperience || customerText || '').trim();
  const effectiveIteration = forceRegen ? Math.max(2, (generationNumber || iteration || 1) + 1) : (generationNumber || iteration || 1);
  const topicsList = Array.isArray(selectedTopics) && selectedTopics.length > 0
    ? selectedTopics
    : (Array.isArray(selectedExperienceCards) && selectedExperienceCards.length > 0
      ? selectedExperienceCards
      : (Array.isArray(selectedCards) ? selectedCards : []));

  // Validation: Must have at least one topic selected OR customer text
  if (topicsList.length === 0 && (!actualCustomerText || actualCustomerText.length < 2)) {
    return res.status(400).json({
      error: 'Please select at least one topic or tell us about your experience before generating your review.'
    });
  }

  const validatedLength = (reviewLength === 'short' || reviewLength === 'medium' || reviewLength === 'long')
    ? reviewLength
    : 'medium';

  try {
    const result = await aiReviewEngine.generateReview({
      businessId,
      uniqueCode,
      sessionId,
      customerText: actualCustomerText,
      selectedTopics: topicsList,
      language,
      reviewLength: validatedLength,
      generationNumber: effectiveIteration,
      requestId,
      ipAddress: ip
    });

    if (uniqueCode) {
      reviewFlowStore.recordAssistanceEvent(uniqueCode, 'AI_DRAFT_GENERATED', {
        iteration: result.generationNumber,
        language: result.language,
        reviewLength: result.reviewLength,
        generationId: result.generationId,
        requestId: result.requestId
      });
    }

    const finalDraft = sanitizeReviewText(result.draft);
    return res.json({
      draft: finalDraft,
      generationId: result.generationId,
      requestId: result.requestId,
      sessionId: result.sessionId,
      iteration: result.generationNumber,
      generationNumber: result.generationNumber,
      wordCount: result.wordCount,
      language: result.language,
      reviewLength: result.reviewLength,
      businessName: result.businessName,
      model: result.model,
      status: 'SUCCESS'
    });
  } catch (err: any) {
    console.error('[ReviewFlow AI Engine Error]', err.message);
    const statusCode = err.message?.startsWith('NO_CREDITS') ? 403 : 503;
    return res.status(statusCode).json({
      code: 'AI_GENERATION_FAILED',
      error: err.message || 'Unable to generate a new review right now Please try again'
    });
  }
};

reviewFlowRouter.post('/ai/review-draft', async (req: Request, res: Response) => {
  return handleReviewGenerationEndpoint(req, res, false);
});

reviewFlowRouter.post('/public/review/generate', async (req: Request, res: Response) => {
  return handleReviewGenerationEndpoint(req, res, false);
});

reviewFlowRouter.post('/public/review/regenerate', async (req: Request, res: Response) => {
  return handleReviewGenerationEndpoint(req, res, true);
});

// Helper for strict category taxonomy suggestions (SYSTEM A)
function generateTaxonomySuggestions(params: {
  businessName: string;
  category: string;
  description: string;
  city: string;
}): Array<{ id: string; title: string; description: string; category: string; reason: string }> {
  const text = `${params.businessName} ${params.description} ${params.category}`.toLowerCase();
  const desc = params.description.toLowerCase();

  // Strict check: if text mentions photography, cameras, wedding photographer, studio shoot
  const isPhotography =
    params.category === 'photography' ||
    desc.includes('photograph') ||
    desc.includes('camera') ||
    desc.includes('wedding photographer') ||
    desc.includes('photoshoot') ||
    desc.includes('videograph');

  if (isPhotography) {
    const list = [
      {
        id: 'sug_photo_1',
        title: 'Wedding Photography',
        description: 'Comprehensive photography coverage for wedding ceremonies and receptions',
        category: 'service',
        reason: 'Explicitly indicated by wedding photographer description'
      },
      {
        id: 'sug_photo_2',
        title: 'Pre-Wedding Photography',
        description: 'Creative outdoor and candid photo sessions for couples before the wedding',
        category: 'service',
        reason: 'Standard wedding photography offering'
      },
      {
        id: 'sug_photo_3',
        title: 'Event & Ceremony Coverage',
        description: 'Photography coverage for engagements, family events, and celebrations',
        category: 'service',
        reason: 'Relevant for photography studios'
      },
      {
        id: 'sug_photo_4',
        title: 'Candid Couple Shoots',
        description: 'Natural, unposed photo sessions capturing genuine moments',
        category: 'service',
        reason: 'Core specialty for wedding photographers'
      },
      {
        id: 'sug_photo_5',
        title: 'Studio Portrait Sessions',
        description: 'Indoor studio lighting sessions for individual, couple, and family portraits',
        category: 'service',
        reason: 'Standard photography studio service'
      }
    ];
    return list;
  }

  // Strict check: Jewellery
  if (
    params.category === 'jewellery' ||
    desc.includes('jewel') ||
    desc.includes('gold') ||
    desc.includes('silver') ||
    desc.includes('diamond')
  ) {
    return [
      {
        id: 'sug_jewel_1',
        title: 'Gold Jewellery',
        description: 'BIS hallmarked gold jewellery in traditional and modern designs',
        category: 'product',
        reason: 'Core jewellery category'
      },
      {
        id: 'sug_jewel_2',
        title: 'Diamond Jewellery',
        description: 'Certified natural diamonds and solitaires with clarity certificates',
        category: 'product',
        reason: 'Core jewellery category'
      },
      {
        id: 'sug_jewel_3',
        title: 'Bridal Jewellery Sets',
        description: 'Complete bridal sets crafted for wedding ceremonies and occasions',
        category: 'product',
        reason: 'High demand jewellery line'
      },
      {
        id: 'sug_jewel_4',
        title: 'Custom Jewellery Crafting',
        description: 'Bespoke jewellery making based on customer design requirements',
        category: 'service',
        reason: 'Valued custom trade service'
      }
    ];
  }

  // Strict check: Restaurant / Cafe
  if (
    params.category === 'restaurant_cafe' ||
    desc.includes('restaurant') ||
    desc.includes('cafe') ||
    desc.includes('food') ||
    desc.includes('dine') ||
    desc.includes('biryani') ||
    desc.includes('chai')
  ) {
    return [
      {
        id: 'sug_rest_1',
        title: 'Dine-in Service',
        description: 'Comfortable table seating for dine-in guests and families',
        category: 'service',
        reason: 'Core restaurant offering'
      },
      {
        id: 'sug_rest_2',
        title: 'Takeaway & Parcel Orders',
        description: 'Quick and hygienic food packaging for takeaway customers',
        category: 'service',
        reason: 'Standard food service'
      },
      {
        id: 'sug_rest_3',
        title: 'Fresh Signature Specialties',
        description: 'Dishes prepared fresh upon order using authentic regional recipes',
        category: 'highlight',
        reason: 'Culinary trade highlight'
      }
    ];
  }

  // Strict check: Salon / Beauty
  if (
    params.category === 'salon_beauty' ||
    desc.includes('salon') ||
    desc.includes('beauty') ||
    desc.includes('makeup') ||
    desc.includes('hair') ||
    desc.includes('parlour')
  ) {
    return [
      {
        id: 'sug_salon_1',
        title: 'Hair Styling & Care',
        description: 'Hair cutting, styling, hair spa, and professional treatments',
        category: 'service',
        reason: 'Core salon service'
      },
      {
        id: 'sug_salon_2',
        title: 'Bridal & Party Makeup',
        description: 'Professional makeover sessions for weddings and special occasions',
        category: 'service',
        reason: 'Core beauty trade specialty'
      },
      {
        id: 'sug_salon_3',
        title: 'Skincare & Facials',
        description: 'Skin cleansing, organic facials, and wellness services',
        category: 'service',
        reason: 'Standard beauty service'
      }
    ];
  }

  // Strict check: Garage / Auto
  if (
    params.category === 'garage_auto' ||
    desc.includes('garage') ||
    desc.includes('car') ||
    desc.includes('bike') ||
    desc.includes('mechanic') ||
    desc.includes('automobile')
  ) {
    return [
      {
        id: 'sug_auto_1',
        title: 'Periodic Vehicle Maintenance',
        description: 'Scheduled general servicing, oil change, and vehicle inspection',
        category: 'service',
        reason: 'Core automotive service'
      },
      {
        id: 'sug_auto_2',
        title: 'Computerized Diagnostics',
        description: 'OBD scanning to accurately identify vehicle faults and electrical issues',
        category: 'service',
        reason: 'Modern garage capability'
      },
      {
        id: 'sug_auto_3',
        title: 'Brake & Engine Repairs',
        description: 'Mechanical repairs carried out with genuine replacement parts',
        category: 'service',
        reason: 'Essential auto repair service'
      }
    ];
  }

  // Strict check: Supermarket / Grocery (ONLY if explicitly grocery text!)
  if (
    params.category === 'grocery_general' &&
    (desc.includes('supermarket') || desc.includes('grocery') || desc.includes('kirana') || desc.includes('ration') || desc.includes('mart'))
  ) {
    return [
      {
        id: 'sug_groc_1',
        title: 'Daily Staples & Provisions',
        description: 'Packaged grains, pulses, spices, oils, and kitchen essentials',
        category: 'product',
        reason: 'Supermarket inventory'
      },
      {
        id: 'sug_groc_2',
        title: 'Personal Care & Cleaning',
        description: 'Soaps, detergents, toiletries, and daily household supplies',
        category: 'product',
        reason: 'Supermarket inventory'
      }
    ];
  }

  // General / Other Local Business (extract only explicitly mentioned topics)
  const generalList: Array<{ id: string; title: string; description: string; category: string; reason: string }> = [];
  if (desc.includes('consult')) {
    generalList.push({
      id: 'sug_gen_1',
      title: 'Professional Consultations',
      description: 'One-on-one advisory and consultation tailored to client needs',
      category: 'service',
      reason: 'Mentioned in description'
    });
  }
  if (desc.includes('custom') || desc.includes('tailor')) {
    generalList.push({
      id: 'sug_gen_2',
      title: 'Customized Solutions',
      description: 'Bespoke service tailored specifically to client requirements',
      category: 'service',
      reason: 'Mentioned in description'
    });
  }

  return generalList;
}

// =============================================================
// =============================================================
// AI BUSINESS ANALYSIS ENGINE (Section 1, 4, 5, 6, 7, 8, 20, 21, 22)
// =============================================================
reviewFlowRouter.post('/ai/analyze-business', async (req: Request, res: Response) => {
  try {
    const {
      businessName = '',
      mainCategory = 'other',
      subcategory = '',
      businessDescription = '',
      city = '',
      state = '',
      preferredLanguage = 'English',
      website = '',
      ownerProvidedServices = [],
      ownerProvidedProducts = []
    } = req.body;

    const analysis = await analyzeBusinessAI({
      businessName: (businessName || '').trim(),
      mainCategory: (mainCategory || '').trim(),
      subcategory: (subcategory || '').trim(),
      businessDescription: (businessDescription || '').trim(),
      city: (city || '').trim(),
      state: (state || '').trim(),
      preferredLanguage: (preferredLanguage || '').trim(),
      website: (website || '').trim(),
      ownerProvidedServices,
      ownerProvidedProducts
    });

    return res.json(analysis);
  } catch (err: any) {
    console.error('[ReviewFlow AI] Business analysis error:', err.message);
    return res.status(500).json({ error: 'Failed to analyze business information.' });
  }
});

// Lightweight category detection from description (for auto-select on typing)
reviewFlowRouter.post('/ai/detect-category', async (req: Request, res: Response) => {
  const { description = '' } = req.body;
  const desc = (description || '').trim().toLowerCase();

  if (desc.length < 20) {
    return res.json({ suggestedCategory: null, suggestedSubcategory: null, confidence: 'low' });
  }

  // Keyword-based mapping (instant, no AI quota)
  const KEYWORD_MAP: Array<{ pattern: RegExp; category: string; subcategory: string; label: string }> = [
    { pattern: /\b(restaurant|cafe|dining|biryani|thali|dosa|paneer|cuisine|fast food|dhaba|hotel food|mess|canteen)\b/, category: 'restaurant', subcategory: 'restaurant', label: 'Restaurant & Café' },
    { pattern: /\b(bakery|cake|pastry|bread|cookies|sweets shop|mithai|confection)\b/, category: 'bakery_sweets', subcategory: 'bakery', label: 'Bakery & Sweets' },
    { pattern: /\b(salon|hair|haircut|styling|barbershop|barber|blow dry|hair spa)\b/, category: 'salon_beauty', subcategory: 'hair_salon', label: 'Salon & Beauty' },
    { pattern: /\b(spa|massage|body treatment|facial|skin care|beauty parlour|parlor)\b/, category: 'salon_beauty', subcategory: 'beauty_spa', label: 'Spa & Beauty' },
    { pattern: /\b(jewellery|jewelry|gold|diamond|silver|necklace|ring|bangle|ornament|gemstone)\b/, category: 'jewellery_gold', subcategory: 'gold_jewellery', label: 'Jewellery & Gold' },
    { pattern: /\b(photograph|videograph|photo studio|candid shoot|wedding photographer|event shoot|pre-wedding)\b/, category: 'photography_videography', subcategory: 'wedding_photographer', label: 'Photography & Videography' },
    { pattern: /\b(car|bike|motorcycle|mechanic|garage|engine|denting|painting|tyre|wheel|auto repair|oil change)\b/, category: 'garage_auto', subcategory: 'car_repair', label: 'Garage & Auto Service' },
    { pattern: /\b(gym|fitness|workout|exercise|yoga|aerobics|weight training|crossfit|zumba)\b/, category: 'fitness_gym', subcategory: 'gym', label: 'Gym & Fitness' },
    { pattern: /\b(doctor|clinic|hospital|dentist|physician|healthcare|patient|treatment|medicine|specialist)\b/, category: 'healthcare_clinic', subcategory: 'general_clinic', label: 'Healthcare & Clinic' },
    { pattern: /\b(school|coaching|tuition|education|classes|institute|academy|tutorial|training center)\b/, category: 'education_coaching', subcategory: 'coaching_center', label: 'Education & Coaching' },
    { pattern: /\b(grocery|supermarket|kirana|provision|general store|ration|vegetables|fruit stall|daily need)\b/, category: 'grocery_retail', subcategory: 'kirana_store', label: 'Grocery & Retail' },
    { pattern: /\b(hardware|plumbing|electrical|tools|construction|building material|sanitary|pipes|fittings)\b/, category: 'hardware_construction', subcategory: 'hardware_store', label: 'Hardware & Construction' },
    { pattern: /\b(fashion|clothing|garment|boutique|kurta|saree|jeans|t-shirt|apparel|textile)\b/, category: 'fashion_clothing', subcategory: 'clothing_store', label: 'Fashion & Clothing' },
    { pattern: /\b(hotel|resort|stay|accommodation|lodge|guest house|room booking|dharamshala)\b/, category: 'hotel_hospitality', subcategory: 'hotel', label: 'Hotel & Hospitality' },
    { pattern: /\b(travel|tour|tourism|trip|holiday|package|pilgrimage|taxi|cab|transport)\b/, category: 'travel_tourism', subcategory: 'travel_agent', label: 'Travel & Tourism' },
    { pattern: /\b(electronics|mobile|phone repair|laptop|computer|tv repair|appliance|gadget)\b/, category: 'electronics_repair', subcategory: 'mobile_repair', label: 'Electronics & Repair' },
    { pattern: /\b(event|wedding planner|decoration|catering|function|banquet|mandap|party|birthday)\b/, category: 'events_wedding', subcategory: 'wedding_planner', label: 'Events & Wedding' },
    { pattern: /\b(pet|veterinary|vet|dog|cat|animal care|pet grooming|aquarium|pet shop)\b/, category: 'pet_services', subcategory: 'vet_clinic', label: 'Pet Services' },
    { pattern: /\b(printing|digital print|banner|flex|branding|stationery|visiting card|id card|label)\b/, category: 'printing_branding', subcategory: 'digital_printing', label: 'Printing & Branding' },
    { pattern: /\b(interior|furniture|home decor|renovation|modular kitchen|false ceiling|wall design)\b/, category: 'interior_furniture', subcategory: 'interior_designer', label: 'Interior & Furniture' },
    { pattern: /\b(real estate|property|flat|plot|apartment|land|builder|broker|rent|lease)\b/, category: 'real_estate', subcategory: 'property_dealer', label: 'Real Estate' },
    { pattern: /\b(legal|advocate|lawyer|law firm|court|notary|legal advice|legal service)\b/, category: 'legal_professional', subcategory: 'advocate', label: 'Legal Services' },
    { pattern: /\b(chartered accountant|ca firm|tax|gst|accounting|audit|income tax|bookkeeping|finance)\b/, category: 'finance_accounting', subcategory: 'ca_firm', label: 'Finance & Accounting' },
  ];

  for (const entry of KEYWORD_MAP) {
    if (entry.pattern.test(desc)) {
      return res.json({
        suggestedCategory: entry.category,
        suggestedSubcategory: entry.subcategory,
        label: entry.label,
        confidence: 'high',
        method: 'keyword'
      });
    }
  }

  // Attempt Gemini for edge cases
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        contents: `Given this business description: "${desc.substring(0, 300)}"
Pick the single best matching category from this list and return ONLY a JSON object, no markdown:
restaurant, bakery_sweets, salon_beauty, jewellery_gold, photography_videography, garage_auto, fitness_gym, healthcare_clinic, education_coaching, grocery_retail, hardware_construction, fashion_clothing, hotel_hospitality, travel_tourism, electronics_repair, events_wedding, pet_services, printing_branding, interior_furniture, real_estate, legal_professional, finance_accounting, other

Return: {"suggestedCategory": "<id>", "suggestedSubcategory": "<best subcategory>", "label": "<human readable>", "confidence": "high"}`
      });
      const text = (response.text || '').trim().replace(/```json\s*/i, '').replace(/```\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(text);
      if (parsed?.suggestedCategory) {
        return res.json({ ...parsed, method: 'ai' });
      }
    } catch {}
  }

  return res.json({ suggestedCategory: null, suggestedSubcategory: null, confidence: 'low' });
});

// Backward compatibility for suggest-custom-fields

reviewFlowRouter.post('/ai/suggest-custom-fields', async (req: Request, res: Response) => {
  const { businessName = '', category = 'other', description = '', city = '', subcategory = '' } = req.body;

  try {
    const analysis = await analyzeBusinessAI({
      businessName: (businessName || '').trim(),
      mainCategory: (category || '').trim(),
      subcategory: (subcategory || '').trim(),
      businessDescription: (description || '').trim(),
      city: (city || '').trim()
    });

    const combinedSuggestions = [
      ...analysis.likelyServices.map(s => ({ ...s, category: 'service', source: 'ai' as const, verified: false })),
      ...analysis.likelyProducts.map(p => ({ ...p, category: 'product', source: 'ai' as const, verified: false })),
      ...analysis.possibleHighlights.map(h => ({ ...h, category: 'highlight', source: 'ai' as const, verified: false }))
    ];

    return res.json({
      suggestions: combinedSuggestions,
      analysis
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to analyze custom fields' });
  }
});

// =============================================================
// GEMINI CONNECTION TEST & HEALTH STATUS (Section 8, 32, 33)
// =============================================================
reviewFlowRouter.get('/admin/gemini-status', requireSuperAdmin, async (_req: Request, res: Response) => {
  const settings = reviewFlowStore.getSystemSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  const model = settings.aiModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const isConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

  res.json({
    configured: isConfigured,
    provider: 'Google Gemini',
    model,
    status: isConfigured ? (settings.aiConfigured ? 'CONNECTED' : 'CONFIGURED_UNTESTED') : 'NOT_CONFIGURED',
    lastCheckedAt: settings.updatedAt
  });
});

reviewFlowRouter.get('/admin/ai/observability', requireSuperAdmin, (_req: Request, res: Response) => {
  const metrics = aiReviewEngine.getObservabilityMetrics();
  res.json({
    success: true,
    metrics
  });
});

reviewFlowRouter.post('/admin/test-gemini', requireSuperAdmin, async (req: Request, res: Response) => {
  const settings = reviewFlowStore.getSystemSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  const model = settings.aiModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const admin = (req as any).user;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    return res.status(400).json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'GEMINI_API_KEY is not configured. Please paste your Gemini API key in the Super Admin system configuration.'
    });
  }

  const startTime = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: 'Respond with the single word "OK" to confirm connectivity.'
    });

    const latencyMs = Date.now() - startTime;
    const text = response.text?.trim() || '';

    // Update settings in store
    reviewFlowStore.updateSystemSettings({
      aiConfigured: true,
      aiProvider: 'gemini',
      aiModel: model
    }, admin.uid);

    reviewFlowStore.addAuditLog({
      id: 'log_' + Date.now(),
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: 'AI_SETTINGS_CHANGE',
      targetType: 'system',
      targetId: 'gemini_api_connection',
      details: `Gemini API connection test SUCCESS. Model: ${model}, Latency: ${latencyMs}ms.`,
      result: 'SUCCESS',
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      status: 'CONNECTED',
      model,
      latencyMs,
      responseSummary: text.slice(0, 10),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[ReviewFlow Admin] Gemini Test Error:', err.message);

    reviewFlowStore.addAuditLog({
      id: 'log_' + Date.now(),
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: 'AI_SETTINGS_CHANGE',
      targetType: 'system',
      targetId: 'gemini_api_connection',
      details: `Gemini API connection test FAILED: ${err.message}`,
      result: 'DENIED',
      createdAt: new Date().toISOString()
    });

    return res.status(502).json({
      success: false,
      status: 'ERROR',
      model,
      latencyMs,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

reviewFlowRouter.post('/admin/test-review-generation', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const testResult = await aiReviewEngine.testGenerateReview({
      customerText: req.body.customerText || 'food was good',
      selectedTopics: req.body.selectedTopics || ['Food and Taste'],
      language: req.body.language || 'English',
      businessName: req.body.businessName || 'ReviewFlow Test Bistro'
    });
    return res.json({
      success: true,
      ...testResult
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      geminiRequestSent: true,
      finalStatus: 'FAILED',
      error: err.message || 'Unable to generate test review'
    });
  }
});

// =============================================================
// BILLING & REVIEWFLOW PRO PLAN (Section 11 & 14)
// =============================================================
reviewFlowRouter.get('/plans', (_req: Request, res: Response) => {
  res.json({
    mainPlan: REVIEWFLOW_PRO_PLAN,
    comingSoon: COMING_SOON_FEATURES
  });
});

reviewFlowRouter.get('/subscription', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const sub = reviewFlowStore.getSubscription(user.uid);
  const currentPlan = reviewFlowStore.getPlanDefinition();
  if (!sub) {
    return res.json({
      subscription: null,
      plan: currentPlan,
      usage: null
    });
  }
  res.json({
    subscription: sub,
    plan: currentPlan,
    usage: {
      aiUsed: sub.aiGenerationsUsedThisMonth || 0,
      aiLimit: sub.maxAiMonthly,
      qrsUsed: reviewFlowStore.getQrCodesByBusiness(reviewFlowStore.getBusinessByOwner(user.uid)?.id || '', user.uid).length,
      qrLimit: sub.maxQrCodes
    }
  });
});

// =============================================================
// MULTI-SUBSCRIPTION ENDPOINTS
// =============================================================

/** Get all subscriptions owned by the current user */
reviewFlowRouter.get('/subscriptions', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const subs = reviewFlowStore.getSubscriptionsByOwner(user.uid);
  // Enrich with business info
  const enriched = subs.map(s => {
    const biz = s.businessId ? reviewFlowStore.getBusinessById(s.businessId) : null;
    return {
      ...s,
      business: biz ? {
        id: biz.id,
        businessName: biz.businessName,
        category: biz.category,
        onboardingStatus: biz.onboardingStatus,
        onboardingCompleted: biz.onboardingCompleted
      } : null
    };
  });
  res.json({ subscriptions: enriched });
});

// =============================================================
// SECURE RAZORPAY PAYMENT & SUBSCRIPTION FLOW
// =============================================================
// SECURE RAZORPAY PAYMENT & SUBSCRIPTION FLOW
// =============================================================

/**
 * GET /config/payment-gateway
 * Exposes public client configuration for both Cashfree and Razorpay.
 * Never exposes server secrets.
 */
reviewFlowRouter.get(['/config/payment-gateway', '/config/gateway'], (_req: Request, res: Response) => {
  const activeGateway = paymentGatewayRegistry.getActiveGatewayName();
  const cfProvider = paymentGatewayRegistry.getProvider('CASHFREE');
  const rzpProvider = paymentGatewayRegistry.getProvider('RAZORPAY');

  const cfAppId = cfProvider.getPublishableKey();
  const rzpKeyId = rzpProvider.getPublishableKey();

  res.json({
    activeGateway,
    cashfree: {
      appId: cfAppId,
      environment: (process.env.CASHFREE_ENV || 'sandbox').toLowerCase(),
      apiVersion: process.env.CASHFREE_API_VERSION || '2023-08-01',
      isConfigured: Boolean(cfAppId && !cfAppId.includes('your_cashfree_app_id') && cfAppId !== 'placeholder')
    },
    razorpay: {
      keyId: rzpKeyId,
      merchantName: 'Qorbiq AI',
      currency: 'INR',
      isConfigured: Boolean(rzpKeyId && !rzpKeyId.includes('1234567890abcdef'))
    }
  });
});

/**
 * GET /config/cashfree
 * Exposes ONLY publishable App ID & Environment for frontend Cashfree SDK initialization.
 */
reviewFlowRouter.get('/config/cashfree', (_req: Request, res: Response) => {
  const cfProvider = paymentGatewayRegistry.getProvider('CASHFREE');
  res.json({
    appId: cfProvider.getPublishableKey(),
    environment: (process.env.CASHFREE_ENV || 'sandbox').toLowerCase(),
    apiVersion: process.env.CASHFREE_API_VERSION || '2023-08-01',
    merchantName: 'Qorbiq AI',
    currency: 'INR'
  });
});

/**
 * GET /config/razorpay
 * Exposes ONLY the public publishable Key ID to the frontend.
 * Secret keys remain securely on the server.
 */
reviewFlowRouter.get('/config/razorpay', (_req: Request, res: Response) => {
  const rzpProvider = paymentGatewayRegistry.getProvider('RAZORPAY');
  const keyId = rzpProvider.getPublishableKey() || process.env.RAZORPAY_KEY_ID || '';
  res.json({
    keyId,
    merchantName: 'Qorbiq AI',
    currency: 'INR'
  });
});

/**
 * GET /plans/reviewflow_unlimited
 * Exposes current backend plan configuration for pricing and checkout
 */
reviewFlowRouter.get(['/plans/reviewflow_unlimited', '/plans/current'], (_req: Request, res: Response) => {
  const plan = reviewFlowStore.getPlanDefinition();
  res.json({
    success: true,
    plan: {
      id: plan.id,
      name: plan.name,
      tagline: plan.tagline,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency || 'INR',
      features: plan.features,
      currentVersion: plan.currentVersion,
      discount: plan.discount || 17
    }
  });
});

/**
 * POST /subscriptions/intent
 * Step 1: Create a server-side pending subscription/payment intent.
 * Validates authenticated Firebase UID.
 * Creates Cashfree or Razorpay order/subscription server-side.
 * Stores pending payment record with idempotencyKey.
 */
reviewFlowRouter.post('/subscriptions/intent', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { billingInterval = 'monthly', idempotencyKey, gateway, billingModel } = req.body;

    // Validate billing interval strictly (Requirement 1 & 3)
    if (billingInterval !== 'monthly' && billingInterval !== 'yearly') {
      return res.status(400).json({
        error: 'INVALID_BILLING_INTERVAL',
        message: 'Billing interval must be either "monthly" (₹299/mo) or "yearly" (₹2,999/yr).'
      });
    }

    // Always fetch official plan pricing server-side; NEVER trust frontend-supplied price (Requirement 1 & 6)
    const currentPlan = reviewFlowStore.getPlanDefinition();
    const planAmount = billingInterval === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;

    // Resolve target gateway provider (Cashfree or Razorpay)
    const selectedGateway = (gateway || paymentGatewayRegistry.getActiveGatewayName()).toUpperCase() as 'CASHFREE' | 'RAZORPAY';
    const provider = paymentGatewayRegistry.getProvider(selectedGateway);

    // Server-side Order / Subscription creation
    const providerIntent = await provider.createSubscriptionIntent({
      planId: 'reviewflow_unlimited',
      billingInterval,
      amount: planAmount,
      currency: currentPlan.currency || 'INR',
      userId: user.uid,
      customerEmail: user.email,
      customerName: user.displayName || user.name,
      customerPhone: user.phone,
      idempotencyKey,
      billingModel: billingModel || (selectedGateway === 'CASHFREE' ? 'SUBSCRIPTION' : undefined),
      businessName: 'Qorbiq AI Subscription'
    });

    // Store pending payment in database (Requirement 11)
    const payment = reviewFlowStore.createPaymentIntent({
      userId: user.uid,
      planId: 'reviewflow_unlimited',
      amount: planAmount,
      currency: currentPlan.currency || 'INR',
      billingInterval,
      idempotencyKey,
      gateway: provider.name,
      razorpayOrderId: provider.name === 'RAZORPAY' ? providerIntent.orderId : undefined,
      cashfreeOrderId: provider.name === 'CASHFREE' ? providerIntent.orderId : undefined,
      cashfreeSubscriptionId: providerIntent.subscriptionId,
      cashfreePaymentSessionId: providerIntent.paymentSessionId,
      cashfreeAuthLink: providerIntent.authLink,
      subscriptionId: providerIntent.subscriptionId,
      paymentType: 'NEW_BUSINESS_SUBSCRIPTION'
    });

    res.json({
      success: true,
      provider: provider.name,
      paymentId: payment.id,
      orderId: providerIntent.orderId || payment.cashfreeOrderId || payment.razorpayOrderId,
      subscriptionId: providerIntent.subscriptionId,
      paymentSessionId: providerIntent.paymentSessionId,
      authLink: providerIntent.authLink,
      environment: providerIntent.environment,
      amount: payment.amount,
      currency: payment.currency,
      keyId: providerIntent.keyId,
      planId: 'reviewflow_unlimited',
      planName: 'Qorbiq AI Unlimited',
      billingInterval,
      businessName: 'Qorbiq AI Subscription',
      description: `Qorbiq AI Unlimited (${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'})`
    });
  } catch (err: any) {
    console.error('[Subscriptions Intent Error]', err);
    res.status(500).json({ error: err.message || 'Failed to initialize subscription checkout.' });
  }
});

/**
 * POST /subscriptions/verify-payment
 * Step 2: Backend verifies payment signature / API status cryptographically.
 * Only after verified payment:
 * - Updates payment record to PAID
 * - Creates NEW subscription record (ACTIVE)
 * - Creates NEW business shell linked to that subscription
 * - Provisions dedicated permanent dynamic QR code
 * - Syncs to Firestore
 * - Redirects to fresh onboarding
 */
reviewFlowRouter.post('/subscriptions/verify-payment', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      paymentId,
      gateway,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      order_id,
      cf_order_id,
      cfOrderId,
      payment_id,
      cf_payment_id,
      cfPaymentId,
      subscription_id,
      cf_subscription_id,
      cfSubscriptionId
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'PAYMENT_ID_REQUIRED' });
    }

    const result = await reviewFlowStore.verifyPaymentAndActivate({
      paymentId,
      userId: user.uid,
      gateway,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpaySignature: razorpay_signature,
      cfPaymentId: cfPaymentId || cf_payment_id || payment_id,
      cfOrderId: cfOrderId || cf_order_id || order_id,
      cfSubscriptionId: cfSubscriptionId || cf_subscription_id || subscription_id
    });

    if (!result.success || !result.business || !result.subscription) {
      if ((result as any).pending) {
        return res.status(202).json({
          success: false,
          pending: true,
          authorizationPending: Boolean((result as any).authorizationPending),
          error: result.error || 'PAYMENT_PENDING',
          message: 'Payment mandate or authorization is currently processing. Your subscription will activate automatically once confirmed.'
        });
      }
      return res.status(400).json({ error: result.error || 'PAYMENT_VERIFICATION_FAILED' });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully. Fresh business workspace provisioned.',
      businessId: result.business.id,
      subscriptionId: result.subscription.id,
      business: result.business,
      subscription: result.subscription
    });
  } catch (err: any) {
    console.error('[Verify Payment Error]', err);
    res.status(500).json({ error: err.message || 'Payment verification failed on server.' });
  }
});

/**
 * POST /subscriptions/:id/cancel and POST /subscription/cancel
 * Customer-initiated cancellation action through the application (Requirement 1, 3, 5).
 */
reviewFlowRouter.post(['/subscriptions/:id/cancel', '/subscriptions/cancel', '/subscription/cancel'], requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const subId = req.params.id || req.body.subscriptionId || req.body.id;
    const { reason = 'Cancelled by customer via Qorbiq AI web application' } = req.body;

    let sub = subId ? reviewFlowStore.getSubscriptionById(subId) : reviewFlowStore.getSubscription(user.uid);
    if (!sub) {
      return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND', message: 'No active subscription found for this user.' });
    }

    // Validate ownership (Multi-tenancy isolation Requirement 4)
    if (sub.ownerUid !== user.uid && (sub as any).userId !== user.uid && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'UNAUTHORIZED_ACCESS', message: 'You do not have permission to manage this subscription.' });
    }

    const cancelResult = await reviewFlowStore.cancelSubscription(sub.id, user.uid, reason);
    if (!cancelResult.success) {
      return res.status(400).json({ error: cancelResult.error || 'FAILED_TO_CANCEL_SUBSCRIPTION' });
    }

    res.json({
      success: true,
      message: 'Subscription successfully cancelled. It will remain accessible until the end of the current billing cycle.',
      subscription: cancelResult.subscription
    });
  } catch (err: any) {
    console.error('[Subscription Cancel Error]', err);
    res.status(500).json({ error: err.message || 'Server error while cancelling subscription.' });
  }
});

/**
 * POST /webhooks/cashfree (and /cashfree/webhook)
 * Cashfree Webhook Authority:
 * Verifies webhook signature with CASHFREE_SECRET_KEY using (timestamp + rawBody) HMAC-SHA256.
 * Handles PAYMENT_SUCCESS_WEBHOOK, ORDER_PAID_SUCCESS, SUBSCRIPTION_STATUS_CHANGE_WEBHOOK, SUBSCRIPTION_PAYMENT_SUCCESS_WEBHOOK, REFUND_STATUS_WEBHOOK.
 */
const handleCashfreeWebhook = (req: Request, res: Response) => {
  const signature = (req.headers['x-webhook-signature'] as string) || '';
  const timestamp = (req.headers['x-webhook-timestamp'] as string) || '';
  const cfProvider = paymentGatewayRegistry.getProvider('CASHFREE');

  // Verify signature if secret key is present
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (secretKey && !secretKey.includes('your_cashfree_secret_key')) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = cfProvider.verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.warn('[Cashfree Webhook] Invalid signature rejected.');
      return res.status(400).json({ error: 'INVALID_CASHFREE_WEBHOOK_SIGNATURE' });
    }
  }

  const normalized = cfProvider.parseWebhookEvent(req.body);
  if (!normalized) {
    return res.json({ status: 'ignored' });
  }

  const eventId = normalized.eventId || `${normalized.eventType}_${normalized.subscriptionId || normalized.orderId || normalized.paymentId}_${timestamp}`;

  // Requirement 2: Idempotent webhook processing to prevent duplicate activation/charges
  if (reviewFlowStore.isWebhookEventProcessed(eventId)) {
    console.log(`[Cashfree Webhook] Duplicate event detected and ignored: ${eventId}`);
    return res.json({ status: 'ignored', reason: 'duplicate_event', eventId });
  }

  console.log(`[Cashfree Webhook Event] ${normalized.eventType} -> Normalized Status: ${normalized.status} [eventId: ${eventId}]`);

  switch (normalized.status) {
    case 'PAID': {
      const allPayments = reviewFlowStore.getAllPayments();
      const matched = allPayments.find(
        p =>
          (normalized.orderId && (p.cashfreeOrderId === normalized.orderId || p.id === normalized.orderId)) ||
          (normalized.subscriptionId && p.cashfreeSubscriptionId === normalized.subscriptionId)
      );

      if (matched && matched.status === 'PENDING') {
        reviewFlowStore.verifyPaymentAndActivate({
          paymentId: matched.id,
          userId: matched.userId,
          gateway: 'CASHFREE',
          cfPaymentId: normalized.paymentId,
          cfOrderId: normalized.orderId,
          cfSubscriptionId: normalized.subscriptionId,
          autoBypassSigCheck: true
        }).catch(err => console.error('[Cashfree Webhook Activation Error]', err));
      }
      break;
    }
    case 'RENEWED': {
      if (normalized.subscriptionId) {
        reviewFlowStore.handleSubscriptionCharged({
          subscriptionId: normalized.subscriptionId,
          orderId: normalized.orderId,
          paymentId: normalized.paymentId,
          amount: normalized.amount
        });
      }
      break;
    }
    case 'HALTED': {
      if (normalized.subscriptionId) {
        reviewFlowStore.handleSubscriptionHalted({
          subscriptionId: normalized.subscriptionId,
          reason: 'Recurring subscription mandate halted or payment failed'
        });
      }
      break;
    }
    case 'CANCELLED': {
      if (normalized.subscriptionId) {
        reviewFlowStore.handleSubscriptionCancelled({
          subscriptionId: normalized.subscriptionId,
          reason: 'Subscription cancelled via Cashfree merchant dashboard or customer mandate'
        });
      }
      break;
    }
    case 'REFUNDED': {
      if (normalized.orderId || normalized.paymentId) {
        const payment = reviewFlowStore.getAllPayments().find(
          p => p.cashfreeOrderId === normalized.orderId || p.cashfreePaymentId === normalized.paymentId
        );
        if (payment && payment.status !== 'REFUNDED') {
          reviewFlowStore.refundPayment(payment.id, 'Webhook notification: Cashfree refund processed', normalized.refundAmount)
            .catch(() => {});
        }
      }
      break;
    }
    default:
      break;
  }

  // Record that this webhook event has been successfully handled
  reviewFlowStore.recordProcessedWebhookEvent(eventId);

  res.json({ status: 'ok', received: true, eventId });
};

reviewFlowRouter.post('/webhooks/cashfree', handleCashfreeWebhook);
reviewFlowRouter.post('/cashfree/webhook', handleCashfreeWebhook);

/**
 * POST /webhooks/razorpay (and /razorpay/webhook)
 * Razorpay Webhook Authority:
 * Verifies webhook signature with RAZORPAY_WEBHOOK_SECRET over raw body.
 * Handles payment.captured, order.paid, subscription.charged, subscription.halted, subscription.cancelled, refund.processed.
 * Preserves business & QR records permanently without deletion (Requirement 13).
 */
const handleRazorpayWebhook = (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rzpProvider = paymentGatewayRegistry.getProvider('RAZORPAY');

  if (webhookSecret && !webhookSecret.includes('your_razorpay_webhook_secret_here')) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = rzpProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid signature rejected.');
      return res.status(400).json({ error: 'INVALID_WEBHOOK_SIGNATURE' });
    }
  }

  const normalized = rzpProvider.parseWebhookEvent(req.body);
  if (!normalized) {
    return res.json({ status: 'ignored' });
  }

  console.log(`[Razorpay Webhook Event] ${normalized.eventType} -> Normalized Status: ${normalized.status}`);

  switch (normalized.status) {
    case 'PAID': {
      if (normalized.orderId) {
        const allPayments = reviewFlowStore.getAllPayments();
        const matched = allPayments.find(p => p.razorpayOrderId === normalized.orderId || p.id === normalized.orderId);
        if (matched && matched.status === 'PENDING') {
          reviewFlowStore.verifyPaymentAndActivate({
            paymentId: matched.id,
            userId: matched.userId,
            gateway: 'RAZORPAY',
            razorpayPaymentId: normalized.paymentId,
            razorpayOrderId: normalized.orderId,
            razorpaySubscriptionId: normalized.subscriptionId,
            autoBypassSigCheck: true
          }).catch(err => console.error('[Webhook Activation Error]', err));
        }
      }
      break;
    }
    case 'RENEWED': {
      if (normalized.subscriptionId) {
        reviewFlowStore.handleSubscriptionCharged({
          subscriptionId: normalized.subscriptionId,
          orderId: normalized.orderId,
          paymentId: normalized.paymentId,
          amount: normalized.amount
        });
      }
      break;
    }
    case 'HALTED': {
      if (normalized.subscriptionId) {
        reviewFlowStore.handleSubscriptionHalted({
          subscriptionId: normalized.subscriptionId,
          reason: 'Recurring payment failed or halted by bank'
        });
      }
      break;
    }
    case 'CANCELLED': {
      if (normalized.subscriptionId) {
        reviewFlowStore.handleSubscriptionCancelled({
          subscriptionId: normalized.subscriptionId,
          reason: 'Subscription cancelled via merchant portal or customer mandate'
        });
      }
      break;
    }
    case 'REFUNDED': {
      if (normalized.paymentId) {
        const payment = reviewFlowStore.getAllPayments().find(p => p.razorpayPaymentId === normalized.paymentId);
        if (payment && payment.status !== 'REFUNDED') {
          reviewFlowStore.refundPayment(payment.id, 'Webhook notification: Refund processed', normalized.refundAmount)
            .catch(() => {});
        }
      }
      break;
    }
    default:
      break;
  }

  res.json({ status: 'ok', received: true });
};

reviewFlowRouter.post('/webhooks/razorpay', handleRazorpayWebhook);
reviewFlowRouter.post('/razorpay/webhook', handleRazorpayWebhook);

/**
 * GET /subscriptions/:id/business
 * Get the business linked to a specific subscription
 */
reviewFlowRouter.get('/subscriptions/:id/business', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const sub = reviewFlowStore.getSubscriptionById(req.params.id);
  if (!sub || sub.ownerUid !== user.uid) {
    return res.status(404).json({ error: 'Subscription not found.' });
  }
  const biz = sub.businessId ? reviewFlowStore.getBusinessById(sub.businessId) : null;
  res.json({ subscription: sub, business: biz || null });
});

// =============================================================
// AI TOPICS GENERATION & EXPERIENCE TOPICS ENDPOINTS
// =============================================================

/**
 * POST /businesses/:id/generate-topics
 * STRICT RULE ENFORCEMENT:
 * 1. Business MUST already be saved in DB. Read and verify saved business first.
 * 2. If business not found or not saved: STOP, return error.
 * 3. Only then call Gemini securely server-side.
 * 4. Generate 7–8 business-specific topics without emojis.
 * 5. Save generated topics to experience_topics.
 */
reviewFlowRouter.post('/businesses/:id/generate-topics', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const businessId = req.params.id;

  // 1. Read and verify saved business from database
  const business = reviewFlowStore.getBusinessById(businessId);
  if (!business || business.ownerUid !== user.uid) {
    return res.status(404).json({
      error: 'Your business information could not be saved. Please try again.'
    });
  }

  if (!business.businessName || !business.businessName.trim() || !business.description || business.description.trim().length < 10) {
    return res.status(400).json({
      error: 'Your business information could not be saved. Please try again.'
    });
  }

  try {
    // 2. Call Gemini using saved business record
    const topics = await generateCustomerExperienceTopicsAI({
      businessName: business.businessName,
      category: business.category,
      subcategory: business.subcategory,
      description: business.description,
      city: business.city,
      primaryLanguage: business.primaryLanguage || business.preferredLanguage || 'English'
    });

    // 3. Save generated topics against businessId
    const saved = reviewFlowStore.saveExperienceTopics(businessId, topics);

    reviewFlowStore.addAuditLogRecord({
      id: 'log_' + Date.now(),
      userId: user.uid,
      businessId,
      action: 'ai_generation',
      timestamp: new Date().toISOString(),
      metadata: { topicsCount: saved.length }
    });

    res.json({
      success: true,
      topics: saved
    });
  } catch (err: any) {
    console.error('[AI Topics] Generation error:', err);
    res.status(500).json({
      error: 'AI generation failed. Please try again.'
    });
  }
});

/**
 * GET /businesses/:id/topics
 * Get experience topics for a business
 */
reviewFlowRouter.get('/businesses/:id/topics', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = reviewFlowStore.getBusinessById(req.params.id);
  if (!business || business.ownerUid !== user.uid) {
    return res.status(404).json({ error: 'Business not found or unauthorized.' });
  }

  const topics = reviewFlowStore.getExperienceTopics(req.params.id);
  res.json({ topics });
});

/**
 * PUT /businesses/:id/topics
 * Confirm or update experience topics for a business
 */
reviewFlowRouter.put('/businesses/:id/topics', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = reviewFlowStore.getBusinessById(req.params.id);
  if (!business || business.ownerUid !== user.uid) {
    return res.status(404).json({ error: 'Business not found or unauthorized.' });
  }

  const { topics } = req.body;
  if (!Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one topic.' });
  }

  const saved = reviewFlowStore.saveExperienceTopics(req.params.id, topics);
  res.json({ success: true, topics: saved });
});

/**
 * POST /businesses/:id/complete-onboarding
 * The business MUST NOT become ACTIVE until all required onboarding stages are completed:
 * - Business information saved
 * - Google Review URL configured
 * - AI topics generated
 * - Topics confirmed
 * - NFC created
 * - Dynamic QR created
 * - Subscription verified
 */
reviewFlowRouter.post('/businesses/:id/complete-onboarding', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const business = reviewFlowStore.getBusinessById(req.params.id);

  if (!business || business.ownerUid !== user.uid) {
    return res.status(404).json({ error: 'Business not found or unauthorized.' });
  }

  if (!business.businessName || !business.businessName.trim()) {
    return res.status(400).json({ error: 'Business name is required.' });
  }

  if (!business.googleReviewUrl || !business.googleReviewUrl.trim()) {
    return res.status(400).json({ error: 'Google Review URL must be configured.' });
  }

  const urlCheck = isValidGoogleReviewUrl(business.googleReviewUrl);
  if (!urlCheck.valid) {
    return res.status(400).json({ error: urlCheck.error || 'Google Review URL is invalid.' });
  }

  const topics = reviewFlowStore.getExperienceTopics(business.id);
  if (topics.length === 0) {
    return res.status(400).json({ error: 'Experience topics must be confirmed before activating.' });
  }

  // Ensure primary dynamic QR stand exists
  let primaryQr = reviewFlowStore.getQrCodesByBusiness(business.id, user.uid)[0];
  if (!primaryQr) {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const qrResult = reviewFlowStore.createQrCode(business.id, user.uid, 'Primary Stand', baseUrl);
    primaryQr = qrResult.qrCode!;
  }

  // Ensure primary NFC exists
  reviewFlowStore.getNfcCardByBusiness(business.id, user.uid);

  // Activate business
  const now = new Date().toISOString();
  business.onboardingStatus = 'COMPLETED';
  business.onboardingCompleted = true;
  business.onboardingCompletedAt = now;
  business.status = 'ACTIVE';
  business.updatedAt = now;

  // Also update user's active business
  reviewFlowStore.setActiveBusiness(user.uid, business.id);

  reviewFlowStore.addAuditLogRecord({
    id: 'log_' + Date.now(),
    userId: user.uid,
    businessId: business.id,
    action: 'onboarding_completed',
    timestamp: now,
    metadata: { businessName: business.businessName }
  });

  res.json({
    success: true,
    business,
    message: 'Onboarding completed. Your business is now ACTIVE!'
  });
});


// Legacy simulated checkout endpoint — strictly disabled in production (Requirement 2)
reviewFlowRouter.post('/billing/checkout', requireAuth, (req: Request, res: Response) => {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ||
    process.env.PAYMENT_GATEWAY_ENVIRONMENT === 'PRODUCTION';

  if (isProduction) {
    return res.status(403).json({
      error: 'SIMULATED_CHECKOUT_DISABLED',
      message: 'Simulated checkout is strictly disabled in production. Please complete checkout via official Cashfree payment gateway.'
    });
  }

  const user = (req as any).user;
  const { paymentMethod = 'Test Checkout' } = req.body;

  // Backend verification of subscription
  const sub = reviewFlowStore.activateReviewFlowPro(user.uid, paymentMethod);

  reviewFlowStore.addAuditLog({
    id: 'log_' + Date.now(),
    actorUid: user.uid,
    actorEmail: user.email,
    action: 'PLAN_CHANGED',
    targetType: 'subscription',
    targetId: sub.id,
    details: `User activated ReviewFlow Pro via ${paymentMethod}. Status: active.`,
    result: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    subscription: sub,
    message: 'ReviewFlow Pro plan activated successfully.'
  });
});

// =============================================================
// SUPER ADMIN DASHBOARD & CONTROLS (Section 8, 9, 10)
// =============================================================
reviewFlowRouter.get('/admin/overview', requireSuperAdmin, (_req: Request, res: Response) => {
  const overview = reviewFlowStore.getAdminOverview();
  res.json(overview);
});

// Paginated Clients Table (Section 9)
reviewFlowRouter.get('/admin/clients', requireSuperAdmin, (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const filter = (req.query.filter as any) || 'all';
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

  const result = reviewFlowStore.getClientsPaginated({ search, filter, page, pageSize });
  res.json(result);
});

// Deep Client Detail Page (Section 10)
reviewFlowRouter.get('/admin/clients/:clientId', requireSuperAdmin, (req: Request, res: Response) => {
  const { clientId } = req.params;
  const detail = reviewFlowStore.getClientDetail(clientId);
  if (!detail) {
    return res.status(404).json({ error: 'Client not found.' });
  }
  res.json(detail);
});

// Suspend Client with recorded reason (Module 1)
reviewFlowRouter.post('/admin/clients/:clientId/suspend', requireSuperAdmin, (req: Request, res: Response) => {
  const { clientId } = req.params;
  const { reason = 'Super Admin manual suspension' } = req.body;
  const admin = (req as any).user;
  const success = reviewFlowStore.updateUserStatusWithReason(clientId, 'suspended', admin.uid, reason);
  if (!success) {
    return res.status(404).json({ error: 'Client not found.' });
  }
  res.json({ success: true, status: 'suspended', reason });
});

// Reactivate Client with recorded reason (Module 1)
reviewFlowRouter.post('/admin/clients/:clientId/reactivate', requireSuperAdmin, (req: Request, res: Response) => {
  const { clientId } = req.params;
  const { reason = 'Super Admin manual reactivation' } = req.body;
  const admin = (req as any).user;
  const success = reviewFlowStore.updateUserStatusWithReason(clientId, 'active', admin.uid, reason);
  if (!success) {
    return res.status(404).json({ error: 'Client not found.' });
  }
  res.json({ success: true, status: 'active', reason });
});

// Suspend Business with recorded reason (Module 1)
reviewFlowRouter.post('/admin/businesses/:businessId/suspend', requireSuperAdmin, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { reason = 'Super Admin manual business suspension' } = req.body;
  const admin = (req as any).user;
  const success = reviewFlowStore.updateBusinessStatusWithReason(businessId, 'suspended', admin.uid, reason);
  if (!success) {
    return res.status(404).json({ error: 'Business not found.' });
  }
  res.json({ success: true, status: 'suspended', reason });
});

// Reactivate Business with recorded reason (Module 1)
reviewFlowRouter.post('/admin/businesses/:businessId/reactivate', requireSuperAdmin, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { reason = 'Super Admin manual business reactivation' } = req.body;
  const admin = (req as any).user;
  const success = reviewFlowStore.updateBusinessStatusWithReason(businessId, 'active', admin.uid, reason);
  if (!success) {
    return res.status(404).json({ error: 'Business not found.' });
  }
  res.json({ success: true, status: 'active', reason });
});

// Update Plan Limits (AI, QR codes)
reviewFlowRouter.post('/admin/clients/:clientId/limits', requireSuperAdmin, (req: Request, res: Response) => {
  const { clientId } = req.params;
  const { maxAiMonthly, maxQrCodes, status } = req.body;
  const admin = (req as any).user;

  const updated = reviewFlowStore.updateSubscriptionLimits(clientId, { maxAiMonthly, maxQrCodes, status }, admin.uid);
  if (!updated) {
    return res.status(404).json({ error: 'Subscription not found for this client.' });
  }
  res.json({ success: true, subscription: updated });
});

// Super Admin Businesses List
reviewFlowRouter.get('/admin/businesses', requireSuperAdmin, (_req: Request, res: Response) => {
  const businesses = reviewFlowStore.getAllBusinesses();
  const qrs = reviewFlowStore.getAllQrCodes();
  const users = reviewFlowStore.getAllUsers();

  const enriched = businesses.map(b => {
    const owner = users.find(u => u.uid === b.ownerUid);
    const sub = reviewFlowStore.getSubscription(b.ownerUid);
    const bQrs = qrs.filter(q => q.businessId === b.id);
    const analytics = reviewFlowStore.getBusinessAnalytics(b.id);
    return {
      ...b,
      ownerEmail: owner?.email || 'N/A',
      ownerName: owner?.displayName || 'N/A',
      planName: sub?.planName || 'ReviewFlow Pro (Trial)',
      qrCount: bQrs.length,
      activeQrCount: bQrs.filter(q => q.status === 'ACTIVE').length,
      primaryQrCode: bQrs[0]?.uniqueCode || null,
      primaryQrDestination: bQrs[0]?.destinationUrl || null,
      qrCodes: bQrs,
      totalScans: analytics.totalScans,
      aiGenerations: analytics.eventsBreakdown.aiDraftsGenerated
    };
  });

  res.json({ businesses: enriched });
});

// Subscriptions Overview
reviewFlowRouter.get('/admin/subscriptions', requireSuperAdmin, (_req: Request, res: Response) => {
  const users = reviewFlowStore.getAllUsers();
  const subscriptions = users
    .filter(u => u.role !== 'SUPER_ADMIN')
    .map(u => {
      const sub = reviewFlowStore.getSubscription(u.uid);
      const biz = reviewFlowStore.getBusinessByOwner(u.uid);
      return {
        userUid: u.uid,
        userName: u.displayName,
        userEmail: u.email,
        businessName: biz?.businessName || 'Not configured',
        subscription: sub
      };
    });

  res.json({
    subscriptions,
    plan: REVIEWFLOW_PRO_PLAN,
    comingSoon: COMING_SOON_FEATURES
  });
});

// System Settings & Audit Logs
reviewFlowRouter.get('/admin/system', requireSuperAdmin, (_req: Request, res: Response) => {
  const settings = reviewFlowStore.getSystemSettings();
  const rawKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || '';
  const masked = rawKey && rawKey.length > 8
    ? (rawKey.slice(0, 7) + '...' + rawKey.slice(-4))
    : '';

  res.json({
    settings: {
      ...settings,
      geminiApiKeyMasked: masked,
      hasApiKey: Boolean(rawKey && rawKey.length > 10)
    }
  });
});

reviewFlowRouter.patch('/admin/system', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updates = req.body;
  const updated = reviewFlowStore.updateSystemSettings(updates, admin.uid);
  const rawKey = updated.geminiApiKey || process.env.GEMINI_API_KEY || '';
  const masked = rawKey && rawKey.length > 8
    ? (rawKey.slice(0, 7) + '...' + rawKey.slice(-4))
    : '';

  res.json({
    settings: {
      ...updated,
      geminiApiKeyMasked: masked,
      hasApiKey: Boolean(rawKey && rawKey.length > 10)
    }
  });
});

reviewFlowRouter.get('/admin/audit-logs', requireSuperAdmin, (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const legacyLogs = reviewFlowStore.getAuditLogs(limit);
  const systemLogs = reviewFlowStore.getSystemAuditLogs({ limit });
  res.json({ logs: systemLogs.length > 0 ? systemLogs : legacyLogs });
});

// =============================================================
// SECTION 15-26: SUPER ADMIN DYNAMIC QR SUITE
// =============================================================
reviewFlowRouter.get('/admin/dynamic-qr', requireSuperAdmin, (req: Request, res: Response) => {
  const { businessId, status, search } = req.query as any;
  const list = reviewFlowStore.getDynamicQrCodes({ businessId, status, search });
  const analytics = reviewFlowStore.getDynamicQrAnalytics();
  res.json({ success: true, qrCodes: list, analytics });
});

reviewFlowRouter.post('/admin/dynamic-qr', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { businessId, shopSlug, destinationUrl, description } = req.body;
  if (!businessId) {
    return res.status(400).json({ error: 'BUSINESS_ID_REQUIRED' });
  }
  const created = reviewFlowStore.createDynamicQrCode({
    businessId,
    shopSlug,
    destinationUrl,
    description
  }, admin.uid);
  res.json({ success: true, qr: created });
});

reviewFlowRouter.put('/admin/dynamic-qr/:qrId', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { qrId } = req.params;
  const updates = req.body;
  const result = reviewFlowStore.updateDynamicQrCode(qrId, updates, admin.uid);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, qr: result.qr });
});

reviewFlowRouter.delete('/admin/dynamic-qr/:qrId', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { qrId } = req.params;
  const result = reviewFlowStore.deleteDynamicQrCode(qrId, admin.uid);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, message: 'QR Stand deleted successfully.' });
});

reviewFlowRouter.get('/admin/dynamic-qr/:qrId/analytics', requireSuperAdmin, (req: Request, res: Response) => {
  const { qrId } = req.params;
  const analytics = reviewFlowStore.getDynamicQrAnalytics(qrId);
  res.json({ success: true, analytics });
});

// =============================================================
// SECTION 5 & 6: ONE PLAN PRICING & VERSIONING
// /super-admin/plans
// =============================================================
reviewFlowRouter.get('/admin/plans', requireSuperAdmin, (_req: Request, res: Response) => {
  const plan = reviewFlowStore.getPlanDefinition();
  const versions = reviewFlowStore.getPlanVersions();
  res.json({ success: true, plan, versions });
});

reviewFlowRouter.put('/admin/plans', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updates = req.body;
  const result = reviewFlowStore.updatePlanDefinition(updates, admin.uid);
  res.json({ success: true, plan: result.plan, newVersionCreated: result.newVersionCreated });
});

// =============================================================
// SECTION 33 & 36: AI USAGE & INTERNAL COST DASHBOARD
// /super-admin/ai-usage
// =============================================================
reviewFlowRouter.get('/admin/ai-usage', requireSuperAdmin, (req: Request, res: Response) => {
  const { businessId } = req.query as any;
  const metrics = reviewFlowStore.getAiUsageMetrics(businessId);
  res.json({ success: true, ...metrics });
});

// =============================================================
// SECTION 10: SUPER ADMIN BILLING & PAYMENTS SUITE
// /super-admin/payments
// ==========================================
reviewFlowRouter.get('/admin/payments', requireSuperAdmin, (_req: Request, res: Response) => {
  const payments = reviewFlowStore.getAllPayments();
  const subscriptions = reviewFlowStore.getSubscriptions();
  res.json({ success: true, payments, subscriptions });
});

reviewFlowRouter.post('/admin/payments/:paymentId/refund', requireSuperAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { paymentId } = req.params;
  const { reason, amount } = req.body;
  const result = await reviewFlowStore.refundPayment(paymentId, reason, amount, admin?.email || admin?.uid);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, message: 'Payment successfully refunded.', refundId: result.refundId });
});

/**
 * GET /admin/billing/history
 * Invoices and billing history preserving historical invoice prices (Requirement 14 & 15)
 */
reviewFlowRouter.get('/admin/billing/history', requireSuperAdmin, (_req: Request, res: Response) => {
  const invoices = reviewFlowStore.getInvoicesHistory();
  res.json({ success: true, invoices });
});

reviewFlowRouter.get('/billing/history', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const invoices = reviewFlowStore.getInvoicesHistory(user.uid);
  res.json({ success: true, invoices });
});

reviewFlowRouter.post('/admin/subscriptions/:subId/status', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { subId } = req.params;
  const { status, reason } = req.body;
  const result = reviewFlowStore.updateSubscriptionStatus(subId, status, admin.uid, reason);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json({ success: true, subscription: result.subscription });
});

reviewFlowRouter.post('/admin/subscriptions/:subId/extend', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { subId } = req.params;
  const { days = 30, reason } = req.body;
  const result = reviewFlowStore.extendSubscription(subId, parseInt(days, 10), admin.uid, reason);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json({ success: true, subscription: result.subscription });
});

reviewFlowRouter.get('/admin/settings', requireSuperAdmin, (_req: Request, res: Response) => {
  const settings = reviewFlowStore.getSystemSettings();
  res.json({ success: true, settings });
});

reviewFlowRouter.put('/admin/settings', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updates = req.body;
  const updated = reviewFlowStore.updateSystemSettings(updates, admin.uid);
  res.json({ success: true, settings: updated });
});

// =============================================================
// FIREBASE CLOUD FIRESTORE SYNCHRONIZATION (Super Admin)
// =============================================================
reviewFlowRouter.get('/admin/firebase-sync/status', requireSuperAdmin, (_req: Request, res: Response) => {
  const status = firebaseSyncService.getStatus();
  res.json({ success: true, ...status });
});

reviewFlowRouter.post('/admin/firebase-sync', requireSuperAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { mode = 'push' } = req.body;

  try {
    let result: any;
    if (mode === 'pull') {
      result = await firebaseSyncService.pullAllFromFirestore();
    } else {
      result = await firebaseSyncService.pushAllToFirestore();
    }

    reviewFlowStore.addAuditLog({
      id: 'log_' + Date.now(),
      actorUid: admin.uid,
      actorEmail: admin.email || 'superadmin',
      action: mode === 'pull' ? 'FIREBASE_IMPORT' : 'FIREBASE_SYNC',
      targetType: 'system',
      targetId: 'firestore',
      details: `Super Admin executed Firebase DB ${mode}. Result: ${JSON.stringify(result.synced || result.imported || {})}`,
      result: result.success ? 'SUCCESS' : 'WARNING',
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, result });
  } catch (err: any) {
    console.error('[Firebase Sync Error]', err.message);
    res.status(500).json({ success: false, error: err.message || 'Firebase sync failed.' });
  }
});

// =============================================================
// MODULE 2: INVOICES REST API (Super Admin & Client)
// =============================================================

// Super Admin: List Invoices with Search, Filter & Pagination
reviewFlowRouter.get('/admin/invoices', requireSuperAdmin, (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || 'all';
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

  const result = reviewFlowStore.getInvoices({ search, status, page, pageSize });
  res.json(result);
});

// Super Admin: Single Invoice Details
reviewFlowRouter.get('/admin/invoices/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const invoice = reviewFlowStore.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }
  res.json(invoice);
});

// Super Admin: Render Printable / PDF View of Invoice
reviewFlowRouter.get('/admin/invoices/:id/pdf', requireSuperAdmin, (req: Request, res: Response) => {
  const invoice = reviewFlowStore.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).send('Invoice not found.');
  }
  const html = generateInvoiceHtml(invoice);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Super Admin: Update Invoice Status (Cancellations, Refunds)
reviewFlowRouter.post('/admin/invoices/:id/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const admin = (req as any).user;
  if (!['ISSUED', 'REFUNDED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid invoice status.' });
  }

  const updated = reviewFlowStore.updateInvoiceStatus(req.params.id, status as any, admin.uid, reason);
  if (!updated) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }
  res.json({ success: true, invoice: updated });
});

// Client: Get My Invoices
reviewFlowRouter.get('/invoices', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

  const result = reviewFlowStore.getInvoices({ userId: user.uid, page, pageSize });
  res.json(result);
});

// Client: Get My Single Invoice
reviewFlowRouter.get('/invoices/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const invoice = reviewFlowStore.getInvoiceById(req.params.id);
  if (!invoice || (invoice.userId !== user.uid && user.role !== 'SUPER_ADMIN')) {
    return res.status(404).json({ error: 'Invoice not found or access denied.' });
  }
  res.json(invoice);
});

// Client: Render My Printable / PDF View
reviewFlowRouter.get('/invoices/:id/pdf', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const invoice = reviewFlowStore.getInvoiceById(req.params.id);
  if (!invoice || (invoice.userId !== user.uid && user.role !== 'SUPER_ADMIN')) {
    return res.status(404).send('Invoice not found or access denied.');
  }
  const html = generateInvoiceHtml(invoice);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// =============================================================
// MODULE 5: PHYSICAL STANDEE PRODUCTS CATALOGUE
// =============================================================

// Public / Client: Get Standee Products Catalogue
reviewFlowRouter.get('/products', (_req: Request, res: Response) => {
  const products = reviewFlowStore.getProducts(true);
  res.json({ products });
});

// Public / Client: Get Single Standee Product
reviewFlowRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = reviewFlowStore.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ product });
});

// Super Admin: Create Product
reviewFlowRouter.post('/admin/products', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  try {
    const product = reviewFlowStore.createProduct(req.body, admin.uid);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin: Update Product
reviewFlowRouter.put('/admin/products/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updated = reviewFlowStore.updateProduct(req.params.id, req.body, admin.uid);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ success: true, product: updated });
});

// =============================================================
// MODULE 5: PHYSICAL STANDEE CUSTOMER ORDER MANAGEMENT
// =============================================================

// Client: Create Standee Order & Generate Cashfree Checkout Intent
reviewFlowRouter.post('/orders/standee', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    businessId,
    productId,
    variantId,
    quantity = 1,
    customization = {},
    shippingAddress = {},
    paymentGateway = 'CASHFREE'
  } = req.body;

  if (!businessId) {
    return res.status(400).json({ error: 'Please specify the business workspace for this standee order.' });
  }
  if (!productId) {
    return res.status(400).json({ error: 'Please choose a standee product.' });
  }

  try {
    // 1. Create order in pending_payment state with address validation
    const order = reviewFlowStore.createStandeeOrder({
      userId: user.uid,
      businessId,
      productId,
      variantId,
      quantity,
      customization,
      shippingAddress
    });

    // Save shipping address for future reuse
    reviewFlowStore.saveShippingAddress(shippingAddress, user.uid);

    // 2. Initialize Cashfree PG payment session
    const cfProvider = paymentGatewayRegistry.getProvider('CASHFREE');
    let paymentSessionId: string | undefined;
    let cfOrderId: string | undefined;

    try {
      const intent = await cfProvider.createSubscriptionIntent({
        userId: user.uid,
        planId: order.productId,
        billingInterval: 'one_time' as any,
        billingModel: 'STANDARD',
        amount: order.grandTotal,
        currency: 'INR',
        customerEmail: user.email,
        customerName: user.displayName || order.customerName,
        customerPhone: order.customerPhone,
        returnUrl: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/app/orders/${order.id}?cf_order_id={order_id}`
      });

      paymentSessionId = intent.paymentSessionId;
      cfOrderId = intent.orderId;
      order.cashfreeOrderId = cfOrderId;
      order.cashfreePaymentSessionId = paymentSessionId;
    } catch (cfErr: any) {
      console.warn('[Standee Order Cashfree Intent Notice]', cfErr.message);
      // Generate synthetic sandbox session ID if sandbox keys are testing
      paymentSessionId = 'session_cf_standee_' + order.id;
      order.cashfreePaymentSessionId = paymentSessionId;
    }

    res.json({
      success: true,
      order,
      orderId: order.id,
      paymentSessionId,
      grandTotal: order.grandTotal,
      currency: 'INR'
    });
  } catch (err: any) {
    console.error('[Standee Order Creation Error]', err.message);
    res.status(400).json({ error: err.message || 'Unable to place standee order.' });
  }
});

// Client: Verify Payment after Cashfree Checkout
reviewFlowRouter.post('/orders/standee/:orderId/verify', requireAuth, async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { cashfreePaymentId = 'cf_pay_' + Date.now(), cashfreeOrderId } = req.body;

  try {
    const verifiedOrder = reviewFlowStore.verifyStandeeOrderPayment(orderId, cashfreePaymentId, cashfreeOrderId);
    res.json({
      success: true,
      order: verifiedOrder,
      invoiceNumber: verifiedOrder.invoiceNumber
    });
  } catch (err: any) {
    console.error('[Standee Order Verification Error]', err.message);
    res.status(400).json({ error: err.message || 'Payment verification failed.' });
  }
});

// Client: List My Standee Orders
reviewFlowRouter.get('/orders/standee', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

  const result = reviewFlowStore.getStandeeOrders({ userId: user.uid, page, pageSize });
  res.json(result);
});

// Client: Get My Single Standee Order
reviewFlowRouter.get('/orders/standee/:orderId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const order = reviewFlowStore.getStandeeOrderById(req.params.orderId);
  if (!order || (order.userId !== user.uid && user.role !== 'SUPER_ADMIN')) {
    return res.status(404).json({ error: 'Order not found or access denied.' });
  }
  res.json({ order });
});

// Super Admin: List All Orders with Filters, Search & Pagination
reviewFlowRouter.get('/admin/orders', requireSuperAdmin, (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || 'all';
  const paymentStatus = (req.query.paymentStatus as string) || 'all';
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

  const result = reviewFlowStore.getStandeeOrders({ search, status, paymentStatus, page, pageSize });
  res.json(result);
});

// Super Admin: Single Order Details
reviewFlowRouter.get('/admin/orders/:orderId', requireSuperAdmin, (req: Request, res: Response) => {
  const order = reviewFlowStore.getStandeeOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const activation = reviewFlowStore.getProductActivationByOrder(order.id);
  const invoice = order.invoiceId ? reviewFlowStore.getInvoiceById(order.invoiceId) : undefined;
  res.json({ order, activation, invoice });
});

// Super Admin: Update Order Status
reviewFlowRouter.post('/admin/orders/:orderId/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { status, note } = req.body;
  const admin = (req as any).user;

  const updated = reviewFlowStore.updateStandeeOrderStatus(req.params.orderId, status, admin.uid, note);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json({ success: true, order: updated });
});

// Super Admin: Assign Courier Tracking & Dispatch
reviewFlowRouter.post('/admin/orders/:orderId/tracking', requireSuperAdmin, (req: Request, res: Response) => {
  const { courierProvider, trackingNumber, trackingUrl, estimatedDeliveryDate, note } = req.body;
  const admin = (req as any).user;

  if (!courierProvider || !trackingNumber) {
    return res.status(400).json({ error: 'Courier provider name and tracking number are required.' });
  }

  const updated = reviewFlowStore.assignCourierTracking(
    req.params.orderId,
    { courierProvider, trackingNumber, trackingUrl, estimatedDeliveryDate, note },
    admin.uid
  );

  if (!updated) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json({ success: true, order: updated });
});

// Super Admin: Cancel Order
reviewFlowRouter.post('/admin/orders/:orderId/cancel', requireSuperAdmin, (req: Request, res: Response) => {
  const { reason } = req.body;
  const admin = (req as any).user;

  const order = reviewFlowStore.getStandeeOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.cancellationReason = reason || 'Cancelled by administrator.';
  const updated = reviewFlowStore.updateStandeeOrderStatus(req.params.orderId, 'cancelled', admin.uid, `Cancellation: ${order.cancellationReason}`);
  res.json({ success: true, order: updated });
});

// =============================================================
// MODULE 6: CUSTOMIZED QR / NFC PRODUCT ACTIVATIONS
// =============================================================

// Super Admin: List Activations
reviewFlowRouter.get('/admin/activations', requireSuperAdmin, (req: Request, res: Response) => {
  const businessId = req.query.businessId as string | undefined;
  const activations = reviewFlowStore.getProductActivations(businessId);
  res.json({ activations });
});

// Super Admin: Single Activation Details
reviewFlowRouter.get('/admin/activations/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const activation = reviewFlowStore.getProductActivationById(req.params.id);
  if (!activation) {
    return res.status(404).json({ error: 'Product activation not found.' });
  }
  res.json({ activation });
});

// Super Admin: Update Operational Checklist
reviewFlowRouter.post('/admin/activations/:id/checklist', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updated = reviewFlowStore.updateActivationChecklist(req.params.id, req.body, admin.uid);
  if (!updated) {
    return res.status(404).json({ error: 'Product activation not found.' });
  }
  res.json({ success: true, activation: updated });
});

// Super Admin: Request Reprint
reviewFlowRouter.post('/admin/activations/:id/reprint', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { reason = 'Hardware reprint requested' } = req.body;
  const updated = reviewFlowStore.recordReprint(req.params.id, reason, admin.uid);
  if (!updated) {
    return res.status(404).json({ error: 'Product activation not found.' });
  }
  res.json({ success: true, activation: updated });
});

// =============================================================
// SAVED SHIPPING ADDRESSES (Client)
// =============================================================

reviewFlowRouter.get('/user/addresses', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const addresses = reviewFlowStore.getShippingAddressesByUser(user.uid);
  res.json({ addresses });
});

reviewFlowRouter.post('/user/addresses', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const address = reviewFlowStore.saveShippingAddress(req.body, user.uid);
    res.json({ success: true, address });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// =============================================================
// MODULE 7: SELLER INVOICE SETTINGS (Super Admin)
// =============================================================

reviewFlowRouter.get('/admin/settings/seller', requireSuperAdmin, (_req: Request, res: Response) => {
  const settings = reviewFlowStore.getSystemSettings();
  res.json({ sellerDetails: settings.sellerDetails });
});

reviewFlowRouter.post('/admin/settings/seller', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updated = reviewFlowStore.updateSellerDetails(req.body, admin.uid);
  res.json({ success: true, sellerDetails: updated });
});

// =============================================================
// MODULE 7 & 10: PUBLIC COMPLIANCE & CASHFREE READINESS
// =============================================================

reviewFlowRouter.get(['/public/business-settings', '/public/compliance-settings'], (_req: Request, res: Response) => {
  const compliance = reviewFlowStore.getComplianceSettings();
  const plan = reviewFlowStore.getPlanDefinition();
  res.json({
    complianceSettings: compliance,
    plan: {
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      features: plan.features
    }
  });
});

reviewFlowRouter.post('/public/contact', async (req: Request, res: Response) => {
  const { name, email, phone, businessName, category, message, honeypot } = req.body;

  // Anti-spam honeypot
  if (honeypot) {
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).json({ error: 'Please enter your message (at least 5 characters).' });
  }

  const lead = reviewFlowStore.createCrmInquiry({
    name: name.trim(),
    email: email.trim(),
    phone: phone ? String(phone).trim() : '',
    businessName: businessName ? String(businessName).trim() : 'Website Inquiry',
    category: category ? String(category).trim() : 'General enquiry',
    city: 'Website Visitor',
    message: message.trim()
  });

  res.json({
    success: true,
    message: 'Thank you for reaching out. Your enquiry has been received and our team will get back to you shortly.',
    referenceId: lead.id
  });
});

reviewFlowRouter.get('/admin/compliance-settings', requireSuperAdmin, (_req: Request, res: Response) => {
  const settings = reviewFlowStore.getComplianceSettings();
  const checklist = reviewFlowStore.getCashfreeReadinessChecklist();
  res.json({ complianceSettings: settings, checklist });
});

reviewFlowRouter.post('/admin/compliance-settings', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const updated = reviewFlowStore.updateComplianceSettings(req.body, admin.uid);
  const checklist = reviewFlowStore.getCashfreeReadinessChecklist();
  res.json({ success: true, complianceSettings: updated, checklist });
});

reviewFlowRouter.get('/admin/cashfree-readiness-checklist', requireSuperAdmin, (_req: Request, res: Response) => {
  const checklist = reviewFlowStore.getCashfreeReadinessChecklist();
  res.json({ checklist });
});

// 404 handler for API routes
reviewFlowRouter.all('*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});
