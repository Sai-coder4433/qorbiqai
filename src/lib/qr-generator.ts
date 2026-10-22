import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export interface QrRenderOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate a PNG Data URL for a given target URL
 */
export async function generateQrPngDataUrl(
  url: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const { width = 1024, margin = 2, color = { dark: '#09090b', light: '#ffffff' } } = options;
  return QRCode.toDataURL(url, {
    width,
    margin,
    color,
    errorCorrectionLevel: 'H'
  });
}

/**
 * Generate print-quality SVG vector markup
 */
export async function generateQrSvgString(
  url: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const { margin = 2, color = { dark: '#09090b', light: '#ffffff' } } = options;
  return QRCode.toString(url, {
    type: 'svg',
    margin,
    color,
    errorCorrectionLevel: 'H'
  });
}

/**
 * Generate 3000x3000 Ultra HD PNG Data URL for professional printing / standees / NFC cards (300+ DPI)
 */
export async function generateUltraHdQrPngDataUrl(
  url: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const { width = 3000, margin = 3, color = { dark: '#09090b', light: '#ffffff' } } = options;
  return QRCode.toDataURL(url, {
    width,
    margin,
    color,
    errorCorrectionLevel: 'H'
  });
}

/**
 * Generate print-quality SVG vector markup (infinite resolution)
 */
export async function generateVectorQrSvg(
  url: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const { margin = 3, color = { dark: '#09090b', light: '#ffffff' } } = options;
  return QRCode.toString(url, {
    type: 'svg',
    margin,
    color,
    errorCorrectionLevel: 'H'
  });
}

/**
 * Trigger immediate browser download of 3000x3000 Ultra HD PNG
 */
export async function downloadUltraHdPng(url: string, filename: string): Promise<void> {
  const dataUrl = await generateUltraHdQrPngDataUrl(url, { width: 3000, margin: 3 });
  downloadFile(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`, 'image/png');
}

/**
 * Trigger immediate browser download of print-ready vector SVG
 */
export async function downloadVectorSvg(url: string, filename: string): Promise<void> {
  const svgString = await generateVectorQrSvg(url, { margin: 3 });
  downloadFile(svgString, filename.endsWith('.svg') ? filename : `${filename}.svg`, 'image/svg+xml');
}

/**
 * Download a generated asset to customer device
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const link = document.createElement('a');
  if (mimeType === 'image/svg+xml' || mimeType === 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    link.href = URL.createObjectURL(blob);
  } else {
    link.href = content;
  }
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export type PrintTemplateType = 'counter_stand' | 'table_tent' | 'wall_poster';

export interface PrintCardParams {
  businessName: string;
  qrCodeUrl: string; // The trackable redirect URL e.g. https://domain.com/r/code
  placementName?: string;
  templateType: PrintTemplateType;
}

/**
 * Generate high-resolution, print-ready PDF using jsPDF
 */
export async function generatePrintPdf(params: PrintCardParams): Promise<void> {
  const { businessName, qrCodeUrl, placementName = 'Front Desk', templateType } = params;

  // High-res QR code PNG data URL for embedding into PDF
  const qrDataUrl = await generateQrPngDataUrl(qrCodeUrl, { width: 1200, margin: 1 });

  if (templateType === 'table_tent' || templateType === 'counter_stand') {
    // 5x7 inches counter card (portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [127, 178] // 5 x 7 inches in mm
    });

    const pageWidth = 127;
    const pageHeight = 178;

    // Background soft card border
    doc.setDrawColor(228, 231, 236); // #E4E7EC
    doc.setLineWidth(0.8);
    doc.roundedRect(6, 6, pageWidth - 12, pageHeight - 12, 4, 4);

    // Subtle header badge
    doc.setFillColor(244, 245, 247);
    doc.roundedRect(pageWidth / 2 - 28, 14, 56, 8, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 84, 103);
    doc.text('GOOGLE REVIEW', pageWidth / 2, 19.5, { align: 'center' });

    // Business Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(16, 24, 40); // Near black
    doc.text(businessName, pageWidth / 2, 32, { align: 'center', maxWidth: pageWidth - 24 });

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 84, 103);
    doc.text('Scan with your phone camera to leave a review', pageWidth / 2, 40, { align: 'center' });

    // Google 5-Star Row Representation
    const starY = 47;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(245, 158, 11); // Amber star color
    doc.text('★ ★ ★ ★ ★', pageWidth / 2, starY, { align: 'center' });

    // QR Code Frame
    const qrSize = 64;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 56;

    doc.setDrawColor(234, 236, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4, 4, 'FD');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Call To Action Box
    doc.setFillColor(37, 99, 235); // Brand Accent Blue
    doc.roundedRect(pageWidth / 2 - 40, 134, 80, 12, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Review Us on Google', pageWidth / 2, 141.5, { align: 'center' });

    // Footer notice
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(152, 162, 179);
    doc.text(`Opens directly to Google Maps • ${placementName}`, pageWidth / 2, 158, { align: 'center' });
    doc.text('No app download required', pageWidth / 2, 163, { align: 'center' });

    doc.save(`${businessName.replace(/\s+/g, '_')}_Google_Review_Stand.pdf`);
  } else {
    // A4 Wall Poster (210 x 297 mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Outer subtle border
    doc.setDrawColor(228, 231, 236);
    doc.setLineWidth(1.2);
    doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 6, 6);

    // Accent top banner
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(12, 12, pageWidth - 24, 8, 4, 4, 'F');

    // Header Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('OFFICIAL GOOGLE REVIEW', pageWidth / 2, 38, { align: 'center' });

    // Business Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(16, 24, 40);
    doc.text(businessName, pageWidth / 2, 54, { align: 'center', maxWidth: pageWidth - 40 });

    // Question
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(71, 84, 103);
    doc.text('Enjoyed your visit today? Help us grow with a review!', pageWidth / 2, 66, { align: 'center' });

    // 5 Stars
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(245, 158, 11);
    doc.text('★ ★ ★ ★ ★', pageWidth / 2, 78, { align: 'center' });

    // QR Code Frame
    const qrSize = 100;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 94;

    doc.setDrawColor(234, 236, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 6, 6, 'FD');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Call to Action
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageWidth / 2 - 55, 218, 110, 16, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Scan with Phone Camera', pageWidth / 2, 228.5, { align: 'center' });

    // Steps list
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 84, 103);
    doc.text('1. Open Camera  •  2. Point at QR Code  •  3. Tap link to post', pageWidth / 2, 250, { align: 'center' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(152, 162, 179);
    doc.text(`Official Google Reviews • Direct Redirection • ${placementName}`, pageWidth / 2, 274, { align: 'center' });

    doc.save(`${businessName.replace(/\s+/g, '_')}_Google_Review_Poster.pdf`);
  }
}
