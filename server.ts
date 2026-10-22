import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api.router.ts';
import { extensionsRouter } from './server/routes/extensions.router.ts';
import { db } from './server/db/database.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Security & parsing middleware (capturing rawBody for cryptographic webhook signatures)
  app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });

  // Health checks
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'LOCALOS AI',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/ready', (_req, res) => {
    res.json({
      ready: true,
      services: {
        database: 'connected',
        automationEngine: 'active',
        googleOAuth: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not_configured',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
        razorpay: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not_configured'
      }
    });
  });

  app.get('/version', (_req, res) => {
    res.json({
      version: '2.4.0',
      edition: 'Production Commercial SaaS',
      platform: 'LOCALOS AI'
    });
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').sendFile(path.resolve(__dirname, 'public/robots.txt'));
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml').sendFile(path.resolve(__dirname, 'public/sitemap.xml'));
  });

  // ReviewFlow AI Production Multi-Tenant Router & Store
  const { reviewFlowRouter } = await import('./server/reviewflow/routes.ts');
  const { reviewFlowStore } = await import('./server/reviewflow/store.ts');
  app.use('/api', reviewFlowRouter);
  app.use('/api/test', reviewFlowRouter);

  // -------------------------------------------------------------
  // SECTION 23: Production Dynamic QR Scan & Redirect Route
  // Route: /r/:businessId/:shopSlug/qr
  // Truly dynamic, fast 302, permanent, server-side atomic scans
  // -------------------------------------------------------------
  function parseUserAgent(ua: string) {
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'desktop';
    if (/mobile|android|iphone|ipod/i.test(ua)) deviceType = 'mobile';
    else if (/ipad|tablet/i.test(ua)) deviceType = 'tablet';

    let browser = 'Chrome';
    if (/crios|chrome/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/edge|edg/i.test(ua)) browser = 'Edge';

    let os = 'Unknown OS';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { deviceType, browser, os };
  }

  app.get('/r/:businessId/:shopSlug/qr', (req, res) => {
    const { businessId, shopSlug } = req.params;
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referrer = (req.headers['referer'] as string) || '';
    const ip = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').split(',')[0].trim();
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // 1. Resolve Dynamic QR record (with fallback lookup by businessId if shop was renamed)
    let dynQr = reviewFlowStore.getDynamicQrCodeByRoute(businessId, shopSlug);
    let biz = reviewFlowStore.getBusinessById(businessId);

    if (!dynQr && biz) {
      dynQr = reviewFlowStore.createDynamicQrCode({ businessId: biz.id, shopSlug });
    }

    if (!dynQr) {
      res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Not Found — ReviewFlow AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #18181b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 16px; padding: 36px 28px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: #fef2f2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; color: #09090b; }
    p { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>QR Code Not Found</h1>
    <p>This dynamic review stand link does not exist or has been removed.</p>
  </div>
</body>
</html>`);
      return;
    }

    // 2. Status verification
    if (dynQr.status === 'DISABLED' || dynQr.status === 'ARCHIVED') {
      res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Disabled — ReviewFlow AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #18181b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 16px; padding: 36px 28px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: #fef2f2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; color: #09090b; }
    p { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⛔</div>
    <h1>QR Code Disabled</h1>
    <p>This review QR code has been disabled by the platform administrator.</p>
  </div>
</body>
</html>`);
      return;
    }

    if (dynQr.status === 'PAUSED') {
      res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Currently Paused — ReviewFlow AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #18181b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 16px; padding: 36px 28px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: #fffbeb; color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; color: #09090b; }
    p { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⏸️</div>
    <h1>QR Code Currently Paused</h1>
    <p>${biz?.businessName || 'This business'} has temporarily paused reviews through this QR stand.</p>
  </div>
</body>
</html>`);
      return;
    }

    // 3. Atomic Scan Increment & Analytics (Section 25)
    reviewFlowStore.recordDynamicQrScan(dynQr.qrId, {
      deviceType,
      browser,
      os,
      referrer,
      ipAddress: ip
    });
    reviewFlowStore.recordScanEvent(dynQr.qrId, { userAgent, ip, source: 'Dynamic QR Scan' });

    // 4. Resolve destination & safe redirect (Section 24)
    let dest = dynQr.destinationUrl || `/review/c/${businessId}`;
    if (!/^https?:\/\//i.test(dest) && !dest.startsWith('/')) {
      dest = `/review/c/${businessId}`;
    }
    if (/^(javascript:|data:|file:|vbscript:)/i.test(dest)) {
      dest = `/review/c/${businessId}`;
    }

    // Fast 302 redirect
    res.redirect(302, dest);
  });

  // -------------------------------------------------------------
  // Public Direct Google Review QR Scan & Redirect (/r/:code) [Legacy support]
  // -------------------------------------------------------------
  app.get('/r/:code', (req, res) => {
    const code = req.params.code;
    const userAgent = (req.headers['user-agent'] as string) || '';
    const ip = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').split(',')[0].trim();

    // First check dynamic QR collection
    const dyn = reviewFlowStore.getDynamicQrCodeById(code) || reviewFlowStore.getDynamicQrCodes().find(q => q.businessId === code);
    if (dyn) {
      reviewFlowStore.recordDynamicQrScan(dyn.qrId, { ipAddress: ip });
      let dest = dyn.destinationUrl || `/review/c/${dyn.businessId}`;
      return res.redirect(302, dest);
    }

    const qr = reviewFlowStore.getQrCodeByUniqueCode(code);
    if (!qr) {
      res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Not Found — ReviewFlow AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #18181b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 16px; padding: 36px 28px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: #fef2f2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; color: #09090b; }
    p { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>QR Code Not Found</h1>
    <p>This review QR code link does not exist or has been removed by the business owner.</p>
  </div>
</body>
</html>`);
      return;
    }

    if (qr.status === 'PAUSED') {
      const biz = reviewFlowStore.getBusinessById(qr.businessId);
      res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Currently Paused — ReviewFlow AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #18181b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 16px; padding: 36px 28px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: #fffbeb; color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; color: #09090b; }
    p { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⏸️</div>
    <h1>QR Code Currently Paused</h1>
    <p>${biz?.businessName || 'This business'} has temporarily paused reviews through this QR stand.</p>
  </div>
</body>
</html>`);
      return;
    }

    const biz = reviewFlowStore.getBusinessById(qr.businessId);
    const isActive = biz && (biz.status === 'ACTIVE' || biz.status === 'active') && biz.onboardingStatus === 'COMPLETED';
    if (!biz || !isActive) {
      res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Unavailable — ReviewFlow AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #18181b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 16px; padding: 36px 28px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: #fef2f2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; color: #09090b; }
    p { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Business Account Inactive</h1>
    <p>This business review stand is currently unavailable. Please check back later.</p>
  </div>
</body>
</html>`);
      return;
    }

    // Record scan event securely in multi-tenant store
    reviewFlowStore.recordScanEvent(code, { userAgent, ip, source: 'Direct QR Scan' });

    // 302 Redirect to customer review assistance session
    res.redirect(302, `/review/c/${code}`);
  });

  // Vite integration
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LOCALOS AI running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
