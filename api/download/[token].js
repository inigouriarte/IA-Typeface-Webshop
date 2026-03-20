const Stripe = require('stripe');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');
const TYPEFACE_FONT_DIRS = require('../_font-dirs');

const DOWNLOAD_SECRET = process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || '';
const DOWNLOAD_TTL_MS = 48 * 60 * 60 * 1000;

const SELLER = {
  name: 'Indigo Alphabets',
  owner: 'Iñigo Uriarte Peña',
  street: 'Markgrafendamm 28',
  city: '10245 Berlin',
  country: 'Germany',
  email: 'hi@indigoindigo.org',
  taxNumber: '16/568/03523',
};

// --- Token verification ---
function verifyDownloadToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    const sig = parts.pop();
    const expires = parseInt(parts.pop(), 10);
    const sessionId = parts.join(':');
    const expected = crypto
      .createHmac('sha256', DOWNLOAD_SECRET)
      .update(sessionId + ':' + expires)
      .digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Date.now() > expires) return null;
    return sessionId;
  } catch {
    return null;
  }
}

// --- Filter font files to only include purchased styles ---
function filterFontFiles(allFiles, productName) {
  if (!productName) return allFiles;

  // If the product name contains "Family" (case-insensitive), include all files
  if (/family/i.test(productName)) return allFiles;

  // Split combined product names (e.g. "INDG Alvica Thin + INDG Alvica Regular")
  var products = productName.split(/\s*\+\s*/);

  // Extract style keywords from each product name
  // e.g. "INDG Alvica Thin" → "Thin", "INDG Actio Thin Expanded" → "ThinExpanded"
  var styleKeywords = [];
  for (var i = 0; i < products.length; i++) {
    var parts = products[i].trim().split(/\s+/);
    if (parts.length >= 3) {
      styleKeywords.push(parts.slice(2).join('').toLowerCase());
    }
  }

  if (!styleKeywords.length) return allFiles;

  // Filter files using exact style matching on the filename portion after the last hyphen
  // e.g. "INDGAlvica-Thin.woff2" → style is "thin", matches keyword "thin" exactly
  // This prevents "Thin" from matching "ThinItalic"
  var filtered = allFiles.filter(function (file) {
    var base = file.replace(/\.[^.]+$/, ''); // remove extension
    var hyphenIdx = base.lastIndexOf('-');
    if (hyphenIdx === -1) return false;
    var fileStyle = base.substring(hyphenIdx + 1).toLowerCase();
    for (var j = 0; j < styleKeywords.length; j++) {
      if (fileStyle === styleKeywords[j]) return true;
    }
    return false;
  });

  // Fallback: if exact matching found nothing, return all files
  // (better to over-deliver than under-deliver to a paying customer)
  return filtered.length > 0 ? filtered : allFiles;
}

// --- Deterministic invoice number from session ID ---
function generateInvoiceNumber(sessionId) {
  const year = new Date().getFullYear();
  const hash = crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 8).toUpperCase();
  return `IA-${year}-${hash}`;
}

// --- Invoice PDF generation (per design template) ---
function generateInvoicePDF(session, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', (b) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Register custom fonts
    const alvicaSemiboldPath = path.join(process.cwd(), 'fonts', 'Alvica', 'INDGAlvica-Semibold.ttf');
    const dmMonoPath = path.join(process.cwd(), 'fonts', 'invoice', 'DMMono-Regular.ttf');
    try {
      doc.registerFont('AlvicaSemibold', alvicaSemiboldPath);
    } catch (e) {
      // Fallback to Helvetica-Bold if font not found
    }
    try {
      doc.registerFont('DMMono', dmMonoPath);
    } catch (e) {
      // Fallback to Courier if font not found
    }
    const monoFont = fs.existsSync(dmMonoPath) ? 'DMMono' : 'Courier';
    const logoFont = fs.existsSync(alvicaSemiboldPath) ? 'AlvicaSemibold' : 'Helvetica-Bold';

    const meta = session.metadata || {};
    const date = new Date(session.created * 1000);
    const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const customer = session.customer_details || {};
    const address = customer.address || {};
    const lineItems = session.line_items?.data || [];
    const grossTotal = (session.amount_total || 0) / 100;
    const vatRate = 0.19;
    const netTotal = +(grossTotal / (1 + vatRate)).toFixed(2);
    const vatAmount = +(grossTotal - netTotal).toFixed(2);

    const left = 50;
    const pageW = 595.28; // A4 width in points
    const rightEdge = pageW - 50;

    // --- Header: "Indigo Alphabets®" in blue ---
    doc.fontSize(28).font(logoFont).fillColor('#0000FF');
    doc.text('Indigo Alphabets\u00AE', left, 50);
    doc.fillColor('#000');

    doc.moveDown(2);

    // --- Invoice number & date ---
    doc.fontSize(10).font(monoFont);
    doc.text(`Invoice no.: ${invoiceNumber}`, left, doc.y);
    doc.text(`Date: ${dateStr}`);

    doc.moveDown(1);

    // --- ISSUER block ---
    doc.font(monoFont).fontSize(10);
    doc.text('ISSUER:', left, doc.y);
    doc.text(SELLER.owner);
    doc.text(SELLER.email);
    doc.text(`${SELLER.street} ${SELLER.city}, ${SELLER.country}`);
    doc.text(`Tax no.: ${SELLER.taxNumber}`);

    doc.moveDown(1);

    // --- RECEIVER block ---
    doc.text('RECEIVER:', left, doc.y);
    doc.text(customer.name || '\u2014');
    doc.text(customer.email || '');
    const addressParts = [];
    if (address.line1) addressParts.push(address.line1);
    if (address.line2) addressParts.push(address.line2);
    const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
    if (cityLine) addressParts.push(cityLine);
    if (address.country) addressParts.push(address.country);
    doc.text(addressParts.join(', ') || '');

    doc.moveDown(1.5);

    // --- INVOICE title ---
    doc.font(monoFont).fontSize(10).text('INVOICE', left, doc.y);
    doc.moveDown(1);

    // --- Table header ---
    const colDesc = left;
    const colQty = 340;
    const colNet = 395;
    const colTax = 445;
    const colGross = 495;
    const colW = 50;

    doc.font(monoFont).fontSize(10);
    const thY = doc.y;
    doc.text('Description', colDesc, thY);
    doc.text('Qty.', colQty, thY, { width: colW, align: 'left' });
    doc.text('Net', colNet, thY, { width: colW, align: 'left' });
    doc.text('Tax', colTax, thY, { width: colW, align: 'left' });
    doc.text('Gross', colGross, thY, { width: colW, align: 'left' });

    // --- Line items ---
    doc.font(monoFont).fontSize(10);
    for (const item of lineItems) {
      const itemGross = (item.amount_total || 0) / 100;
      const itemNet = +(itemGross / (1 + vatRate)).toFixed(2);
      const itemVat = +(itemGross - itemNet).toFixed(2);
      const desc = item.description || meta.productName || '\u2014';
      doc.text(desc, colDesc, doc.y);

      // License tier note
      if (meta.licenseTier) {
        doc.text(`License type: ${meta.licenseTier}`, colDesc, doc.y);
      }

      const rowY = doc.y;
      // Empty line then values
      doc.text(String(item.quantity || 1), colQty, rowY - (meta.licenseTier ? 14 : 0), { width: colW, align: 'left' });
      doc.text(itemNet.toFixed(2) + '\u20AC', colNet, rowY - (meta.licenseTier ? 14 : 0), { width: colW, align: 'left' });
      doc.text(itemVat.toFixed(2) + '\u20AC', colTax, rowY - (meta.licenseTier ? 14 : 0), { width: colW, align: 'left' });
      doc.text(itemGross.toFixed(2) + '\u20AC', colGross, rowY - (meta.licenseTier ? 14 : 0), { width: colW, align: 'left' });
    }

    // --- Separator ---
    doc.text('/', colDesc, doc.y);
    doc.text('/', colGross, doc.y - 14, { width: colW, align: 'left' });

    // --- Totals ---
    doc.text('Net total', colDesc, doc.y);
    doc.text(netTotal.toFixed(2) + '\u20AC', colGross, doc.y - 14, { width: colW, align: 'left' });

    doc.text(`VAT (${(vatRate * 100).toFixed(0)}%)`, colDesc, doc.y);
    doc.text(vatAmount.toFixed(2) + '\u20AC', colGross, doc.y - 14, { width: colW, align: 'left' });

    doc.moveDown(1);

    // --- TOTAL ---
    doc.font(monoFont).fontSize(10);
    const totalY = doc.y;
    doc.text('TOTAL', colDesc, totalY);
    doc.text(grossTotal.toFixed(2) + '\u20AC', colGross, totalY, { width: colW, align: 'left' });

    doc.moveDown(1.5);

    // --- Thank you ---
    doc.font(monoFont).fontSize(10);
    doc.text('Thank you for your purchase.', left, doc.y);
    doc.text('This invoice serves as your proof of license.');

    doc.end();
  });
}

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  try {
    const token = req.query.token;
    const sessionId = verifyDownloadToken(token);
    if (!sessionId) {
      return res.status(403).json({
        error: 'Download link has expired. Please revisit your purchase confirmation page to get a new link.',
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
    if (session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'Payment not completed' });
    }

    const typefaceId = session.metadata?.typefaceId || '';
    const fontDirName = TYPEFACE_FONT_DIRS[typefaceId];
    if (!fontDirName) {
      return res.status(404).json({ error: 'Unknown typeface: ' + typefaceId });
    }

    // Read font files from the project directory (included via vercel.json includeFiles)
    const fontDir = path.join(process.cwd(), 'fonts', fontDirName);
    let fontFiles;
    try {
      fontFiles = fs.readdirSync(fontDir).filter((f) => !f.startsWith('.'));
    } catch (e) {
      return res.status(500).json({ error: 'Font files not found for: ' + fontDirName });
    }

    // Filter to only include purchased styles (not the entire family)
    const productName = session.metadata?.productName || '';
    fontFiles = filterFontFiles(fontFiles, productName);

    // Generate invoice
    const invoiceNumber = generateInvoiceNumber(sessionId);
    const invoiceBuf = await generateInvoicePDF(session, invoiceNumber);

    // Build ZIP
    const zipName = `INDG-${fontDirName.replace(/\s+/g, '-')}-License.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of fontFiles) {
      archive.file(path.join(fontDir, file), { name: `fonts/${file}` });
    }
    archive.append(invoiceBuf, { name: `Invoice-${invoiceNumber}.pdf` });

    await archive.finalize();
  } catch (e) {
    console.error('Download error:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
};
