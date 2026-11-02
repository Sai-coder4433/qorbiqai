import { jsPDF } from 'jspdf';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  orderId: string;
  paymentId?: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shopName: string;
  shopCategory?: string;
  shopAddress?: string;
  planName: string;
  durationDays: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  validFrom: string;
  validUntil: string;
}

/**
 * Generate and download a verified tax invoice PDF using jsPDF
 */
export function generateInvoicePdf(inv: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = '#1d4ed8'; // Blue 700
  const slateDark = '#0f172a';
  const slateMuted = '#64748b';
  const borderLight = '#e2e8f0';

  // --- HEADER ---
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company Brand
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Qorbiq AI', 18, 20);

  doc.setFontSize(9);
  doc.setTextColor(slateMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Next-Gen AI Review & Reputation Engine for Physical Businesses', 18, 26);
  doc.text('Official Platform: https://qorbiqai.com  |  Support: support@qorbiqai.com', 18, 31);

  // TAX INVOICE Title
  doc.setTextColor(slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TAX INVOICE', pageWidth - 18, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted);
  doc.text(`Invoice No: ${inv.invoiceNumber}`, pageWidth - 18, 26, { align: 'right' });
  doc.text(`Date: ${inv.date}`, pageWidth - 18, 31, { align: 'right' });
  doc.text('Payment Gateway: Cashfree (Verified)', pageWidth - 18, 36, { align: 'right' });

  // Divider Line
  doc.setDrawColor(borderLight);
  doc.setLineWidth(0.5);
  doc.line(18, 45, pageWidth - 18, 45);

  // --- BILL TO & SERVICE TO SECTIONS ---
  let y = 56;

  // Bill To (Owner)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark);
  doc.text('BILLED TO (BUSINESS OWNER)', 18, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateMuted);
  doc.text(`Name: ${inv.customerName || 'Business Owner'}`, 18, y + 6);
  doc.text(`Email: ${inv.customerEmail}`, 18, y + 11);
  if (inv.customerPhone) {
    doc.text(`Contact: ${inv.customerPhone}`, 18, y + 16);
  }

  // Shop / Stand Association
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark);
  doc.text('ENTITLED SHOP WORKSPACE', rightColX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateMuted);
  doc.text(`Shop Name: ${inv.shopName}`, rightColX, y + 6);
  if (inv.shopCategory) {
    doc.text(`Category: ${inv.shopCategory.replace(/_/g, ' ')}`, rightColX, y + 11);
  }
  doc.text(`Order ID: ${inv.orderId}`, rightColX, y + 16);
  if (inv.paymentId) {
    doc.text(`Cashfree Ref: ${inv.paymentId}`, rightColX, y + 21);
  }

  // --- ITEM DETAILS TABLE ---
  y = 90;
  doc.setFillColor(241, 245, 249);
  doc.rect(18, y, pageWidth - 36, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark);
  doc.text('DESCRIPTION / SUBSCRIPTION PLAN', 22, y + 6);
  doc.text('DURATION', 115, y + 6);
  doc.text('RATE', 145, y + 6);
  doc.text('TOTAL (INR)', pageWidth - 22, y + 6, { align: 'right' });

  // Table Row
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark);
  doc.text(inv.planName, 22, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted);
  doc.text('One-Time Software Subscription Access — No Auto Debit', 22, y + 5);
  doc.text(`Access Window: ${inv.validFrom} to ${inv.validUntil}`, 22, y + 10);
  doc.text('Includes: Dynamic QR, Smart NFC Routing, Multilingual AI Review Drafts', 22, y + 14);

  // Duration & Pricing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateDark);
  doc.text(`${inv.durationDays} Days`, 115, y);
  doc.text(`INR ${inv.amount.toLocaleString('en-IN')}`, 145, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${inv.amount.toLocaleString('en-IN')}`, pageWidth - 22, y, { align: 'right' });

  // Divider
  y += 24;
  doc.setDrawColor(borderLight);
  doc.line(18, y, pageWidth - 36, y);

  // --- TOTALS SECTION ---
  y += 8;
  const totalsLabelX = pageWidth - 80;
  const totalsValueX = pageWidth - 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateMuted);
  doc.text('Subtotal:', totalsLabelX, y);
  doc.text(`INR ${inv.amount.toLocaleString('en-IN')}`, totalsValueX, y, { align: 'right' });

  y += 6;
  doc.text('Applicable Taxes (Inclusive):', totalsLabelX, y);
  doc.text('INR 0.00', totalsValueX, y, { align: 'right' });

  y += 8;
  doc.setFillColor(239, 246, 255);
  doc.rect(totalsLabelX - 5, y - 5, pageWidth - totalsLabelX - 13, 11, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  doc.text('Total Paid:', totalsLabelX, y + 2);
  doc.text(`INR ${inv.amount.toLocaleString('en-IN')}`, totalsValueX, y + 2, { align: 'right' });

  // --- PAYMENT CONFIRMATION BADGE ---
  y += 25;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(18, y, pageWidth - 36, 20, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#15803d');
  doc.text('STATUS: FULLY PAID (ONE-TIME PAYMENT)', 24, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor('#166534');
  doc.text('Payment captured securely through Cashfree 256-Bit Encrypted Payment Gateway. Zero recurring debits.', 24, y + 14);

  // --- TERMS & FOOTER ---
  y += 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark);
  doc.text('Terms of Access & Licensing:', 18, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted);
  doc.text('1. This payment grants one-time non-recurring access for the specified shop workspace.', 18, y + 5);
  doc.text('2. Dynamic QR and NFC destination routing will remain active throughout the subscription duration.', 18, y + 9);
  doc.text('3. For questions or enterprise inquiries, contact support@qorbiqai.com or visit https://qorbiqai.com', 18, y + 13);

  // Footer bar
  doc.setFontSize(7.5);
  doc.setTextColor('#94a3b8');
  doc.text('Generated electronically by Qorbiq AI Cloud Platform. No physical signature required.', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

export function downloadInvoicePdf(inv: InvoiceData) {
  const doc = generateInvoicePdf(inv);
  doc.save(`${inv.invoiceNumber || 'Invoice'}_QorbiqAI.pdf`);
}

