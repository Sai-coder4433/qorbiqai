import { ReviewFlowInvoice } from './types.ts';

/**
 * Professional HTML & Printable Invoice Template Generator
 * Designed to render clean, vectorized, print-ready and PDF-downloadable invoices.
 */
export function generateInvoiceHtml(invoice: ReviewFlowInvoice): string {
  const seller = invoice.sellerDetails;
  const isTaxApplicable = Boolean(seller.taxApplicable && seller.gstin && seller.gstin.trim().length > 0);

  const formattedInvoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedPaymentDate = new Date(invoice.paymentDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const currencySymbol = '₹';
  const grandTotal = Number(invoice.grandTotal ?? (invoice as any).totalAmount ?? 0);
  const subtotal = Number(invoice.subtotal ?? (invoice as any).baseAmount ?? grandTotal);
  const totalTax = Number(invoice.totalTax ?? (invoice as any).taxAmount ?? 0);
  const taxableAmount = Number(invoice.taxableAmount ?? (subtotal - (invoice.totalDiscount || 0)));
  const totalDiscount = Number(invoice.totalDiscount ?? 0);
  const shippingCharge = Number(invoice.shippingCharge ?? 0);

  const rowsHtml = (invoice.items || [])
    .map((item, index) => {
      const quantity = item.quantity || 1;
      const unitPrice = Number(item.unitPrice ?? 0);
      const discount = Number(item.discount ?? 0);
      const totalAmount = Number(item.totalAmount ?? (item as any).amount ?? (unitPrice * quantity - discount));

      return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: center;">
          ${index + 1}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
          <strong style="display: block; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${escapeHtml(item.description)}</strong>
          ${item.billingPeriod ? `<span style="font-size: 11px; color: #64748b;">Period: ${escapeHtml(item.billingPeriod)}</span>` : ''}
          ${item.hsnSac ? `<span style="font-size: 11px; color: #64748b; margin-left: 8px;">HSN/SAC: ${escapeHtml(item.hsnSac)}</span>` : ''}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; text-align: center;">
          ${quantity}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; text-align: right;">
          ${currencySymbol}${unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        ${
          discount > 0
            ? `<td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #059669; text-align: right;">
                -${currencySymbol}${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>`
            : ''
        }
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; text-align: right; font-weight: 600;">
          ${currencySymbol}${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber} — ${escapeHtml(seller.brandName || 'Qorbiq AI')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .action-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .badge-paid {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-refunded {
      background: #fff1f2;
      color: #9f1239;
      border: 1px solid #fecdd3;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .invoice-wrapper {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
      }
      @page {
        margin: 1.5cm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body>
  <!-- Print & Download Header Controls -->
  <div class="action-bar">
    <div style="font-size: 13px; color: #64748b;">
      Viewing Official Invoice &bull; <span class="mono">${escapeHtml(invoice.invoiceNumber)}</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save as PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  <div class="invoice-wrapper">
    <!-- Header with Branding & Invoice Details -->
    <div style="padding: 40px; border-bottom: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #2563eb; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 18px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
            Q
          </div>
          <div>
            <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -0.02em;">
              ${escapeHtml(seller.brandName || 'Qorbiq AI')}
            </h1>
            <p style="font-size: 11px; color: #64748b; font-weight: 500;">AI Review Automation Platform</p>
          </div>
        </div>

        <div style="font-size: 12px; color: #475569; line-height: 1.6;">
          <strong style="color: #1e293b;">${escapeHtml(seller.legalBusinessName || 'Qorbiq AI Technologies')}</strong><br>
          ${escapeHtml(seller.registeredAddress)}<br>
          ${escapeHtml(seller.city)}, ${escapeHtml(seller.state)} - ${escapeHtml(seller.pinCode)}<br>
          ${seller.supportEmail ? `Email: ${escapeHtml(seller.supportEmail)}<br>` : ''}
          ${seller.supportPhone ? `Phone: ${escapeHtml(seller.supportPhone)}<br>` : ''}
          ${
            isTaxApplicable
              ? `<span style="display: inline-block; margin-top: 4px; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; font-weight: 600; font-size: 11px; color: #1e293b;">GSTIN: <span class="mono">${escapeHtml(seller.gstin || '')}</span></span>`
              : ''
          }
        </div>
      </div>

      <div style="text-align: right;">
        <span class="badge ${invoice.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-refunded'}" style="margin-bottom: 10px;">
          ${invoice.paymentStatus === 'PAID' ? 'Payment Verified &bull; Paid' : escapeHtml(invoice.paymentStatus)}
        </span>
        <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 4px;">
          TAX INVOICE
        </h2>
        <div style="font-size: 14px; font-weight: 700; color: #2563eb; margin-bottom: 8px;" class="mono">
          ${escapeHtml(invoice.invoiceNumber)}
        </div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
          <strong>Invoice Date:</strong> ${formattedInvoiceDate}<br>
          <strong>Payment Date:</strong> ${formattedPaymentDate}<br>
          <strong>Payment Ref:</strong> <span class="mono" style="font-size: 11px;">${escapeHtml(invoice.paymentReference)}</span><br>
          <strong>Payment Method:</strong> ${escapeHtml(invoice.paymentGateway)}
        </div>
      </div>
    </div>

    <!-- Billed To Section -->
    <div style="padding: 28px 40px; background: #fafbfc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 24px;">
      <div style="flex: 1;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; display: block; margin-bottom: 6px;">
          Billed To / Customer Details
        </span>
        <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
          ${escapeHtml(invoice.customerName)}
        </h3>
        <p style="font-size: 13px; font-weight: 600; color: #2563eb; margin-bottom: 4px;">
          ${escapeHtml(invoice.businessName)}
        </p>
        <div style="font-size: 12px; color: #475569; line-height: 1.6;">
          ${invoice.customerEmail ? `Email: ${escapeHtml(invoice.customerEmail)}<br>` : ''}
          ${invoice.customerPhone ? `Contact: ${escapeHtml(invoice.customerPhone)}<br>` : ''}
          ${invoice.customerBillingAddress ? `Address: ${escapeHtml(invoice.customerBillingAddress)}` : ''}
        </div>
      </div>

      <div style="text-align: right; min-width: 180px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; display: block; margin-bottom: 6px;">
          Currency & Amount Paid
        </span>
        <div style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
          ${currencySymbol}${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <span style="font-size: 11px; color: #059669; font-weight: 600;">
          All amounts in INR (${invoice.currency || 'INR'})
        </span>
      </div>
    </div>

    <!-- Line Items Table -->
    <div style="padding: 32px 40px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; width: 40px; text-align: center;">#</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Description</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; width: 60px; text-align: center;">Qty</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; width: 110px; text-align: right;">Unit Price</th>
            ${totalDiscount > 0 ? `<th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; width: 90px; text-align: right;">Discount</th>` : ''}
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; width: 120px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Financial Calculation Summary -->
      <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
        <div style="width: 320px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569;">
            <span>Subtotal:</span>
            <span>${currencySymbol}${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          ${
            totalDiscount > 0
              ? `<div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #059669;">
                  <span>Discount:</span>
                  <span>-${currencySymbol}${totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>`
              : ''
          }

          ${
            shippingCharge > 0
              ? `<div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569;">
                  <span>Shipping & Handling:</span>
                  <span>${currencySymbol}${shippingCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>`
              : ''
          }

          ${
            isTaxApplicable && totalTax > 0
              ? `
                <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #64748b;">
                  <span>Taxable Amount:</span>
                  <span>${currencySymbol}${taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ${
                  invoice.cgstTotal > 0
                    ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #64748b;">
                        <span>CGST (${(seller.gstRate || 18) / 2}%):</span>
                        <span>${currencySymbol}${invoice.cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>`
                    : ''
                }
                ${
                  invoice.sgstTotal > 0
                    ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #64748b;">
                        <span>SGST (${(seller.gstRate || 18) / 2}%):</span>
                        <span>${currencySymbol}${invoice.sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>`
                    : ''
                }
                ${
                  invoice.igstTotal > 0
                    ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #64748b;">
                        <span>IGST (${seller.gstRate || 18}%):</span>
                        <span>${currencySymbol}${invoice.igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>`
                    : ''
                }
              `
              : ''
          }

          <div style="display: flex; justify-content: space-between; padding: 12px 0 6px 0; border-top: 2px solid #0f172a; margin-top: 8px; font-size: 16px; font-weight: 800; color: #0f172a;">
            <span>Grand Total:</span>
            <span>${currencySymbol}${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="text-align: right; font-size: 11px; color: #059669; font-weight: 600;">
            Payment Completed in Full
          </div>
        </div>
      </div>

      <!-- Footer & Legal Terms -->
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
          <div>
            <strong style="color: #64748b; display: block; margin-bottom: 2px;">Terms & Conditions</strong>
            &bull; This is an authentic computer-generated digital tax invoice authorized by ${escapeHtml(seller.legalBusinessName)}.<br>
            &bull; Cashfree payment transaction reference: <span class="mono">${escapeHtml(invoice.paymentReference)}</span>.<br>
            &bull; For any billing enquiries or receipt copies, contact <span class="mono">${escapeHtml(seller.supportEmail || 'support@qorbiq.ai')}</span>.
          </div>
          <div style="text-align: right; min-width: 150px;">
            <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              ${escapeHtml(seller.legalBusinessName)}
            </div>
            <span style="display: inline-block; padding: 3px 8px; background: #f1f5f9; border-radius: 4px; font-size: 10px; font-weight: 700; color: #475569;">
              Digitally Signed & Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
