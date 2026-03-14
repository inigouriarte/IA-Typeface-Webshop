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

// --- Deterministic invoice number from session ID ---
function generateInvoiceNumber(sessionId) {
  const year = new Date().getFullYear();
  const hash = crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 8).toUpperCase();
  return `IA-${year}-${hash}`;
}

// --- Invoice PDF generation (German-compliant) ---
function generateInvoicePDF(session, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', (b) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const meta = session.metadata || {};
    const date = new Date(session.created * 1000);
    const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const customer = session.customer_details || {};
    const address = customer.address || {};
    const lineItems = session.line_items?.data || [];
    const currency = (session.currency || 'eur').toUpperCase();
    const grossTotal = (session.amount_total || 0) / 100;
    const vatRate = 0.19;
    const netTotal = +(grossTotal / (1 + vatRate)).toFixed(2);
    const vatAmount = +(grossTotal - netTotal).toFixed(2);

    const left = 50;
    const rightCol = 350;

    // Seller header
    doc.fontSize(18).font('Helvetica-Bold').text(SELLER.name, left, 50);
    doc.fontSize(8).font('Helvetica').fillColor('#555');
    doc.text(`${SELLER.owner} · ${SELLER.street} · ${SELLER.city} · ${SELLER.country}`, left, doc.y + 2);
    doc.text(`E-Mail: ${SELLER.email} · Steuernummer: ${SELLER.taxNumber}`);
    doc.fillColor('#000');

    doc.moveDown(2);

    // Buyer address block
    doc.fontSize(9).font('Helvetica-Bold').text('Rechnungsempfänger', left, doc.y);
    doc.font('Helvetica').fontSize(10);
    doc.text(customer.name || '—');
    if (address.line1) doc.text(address.line1);
    if (address.line2) doc.text(address.line2);
    const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
    if (cityLine) doc.text(cityLine);
    if (address.country) doc.text(address.country);
    doc.text(customer.email || '');

    // Invoice meta (right side)
    const metaY = 160;
    doc.fontSize(10).font('Helvetica');
    doc.text('Rechnungsnummer:', rightCol, metaY);
    doc.font('Helvetica-Bold').text(invoiceNumber, rightCol + 120, metaY);
    doc.font('Helvetica');
    doc.text('Rechnungsdatum:', rightCol, metaY + 16);
    doc.text(dateStr, rightCol + 120, metaY + 16);
    doc.text('Leistungsdatum:', rightCol, metaY + 32);
    doc.text(dateStr, rightCol + 120, metaY + 32);

    // Invoice title
    const titleY = Math.max(doc.y + 20, metaY + 60);
    doc.fontSize(14).font('Helvetica-Bold').text('RECHNUNG / INVOICE', left, titleY);
    doc.moveDown(1);

    // Line items table
    const tableX = left;
    const colDesc = tableX;
    const colQty = 340;
    const colNet = 390;
    const colVat = 450;
    const colGross = 500;
    const tableW = colGross + 50 - tableX;

    const thY = doc.y;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#555');
    doc.text('Beschreibung / Description', colDesc, thY);
    doc.text('Anz.', colQty, thY, { width: 30, align: 'right' });
    doc.text('Netto', colNet, thY, { width: 45, align: 'right' });
    doc.text('USt.', colVat, thY, { width: 35, align: 'right' });
    doc.text('Brutto', colGross, thY, { width: 50, align: 'right' });
    doc.fillColor('#000');
    doc.moveDown(0.4);
    doc.moveTo(tableX, doc.y).lineTo(tableX + tableW, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.4);

    // Rows
    doc.font('Helvetica').fontSize(9);
    for (const item of lineItems) {
      const itemGross = (item.amount_total || 0) / 100;
      const itemNet = +(itemGross / (1 + vatRate)).toFixed(2);
      const itemVat = +(itemGross - itemNet).toFixed(2);
      const y = doc.y;
      const desc = (item.description || meta.productName || '—') + '\nFont-Lizenz / Font license';
      doc.text(desc, colDesc, y, { width: colQty - colDesc - 10 });
      const rowBottom = doc.y;
      doc.text(String(item.quantity || 1), colQty, y, { width: 30, align: 'right' });
      doc.text(itemNet.toFixed(2) + ' €', colNet, y, { width: 45, align: 'right' });
      doc.text(itemVat.toFixed(2) + ' €', colVat, y, { width: 35, align: 'right' });
      doc.text(itemGross.toFixed(2) + ' €', colGross, y, { width: 50, align: 'right' });
      doc.y = rowBottom;
      doc.moveDown(0.3);
    }

    // License tier note
    if (meta.licenseTier) {
      doc.fontSize(8).fillColor('#555').text(`Lizenztyp: ${meta.licenseTier}`, colDesc, doc.y);
      doc.fillColor('#000');
      doc.moveDown(0.3);
    }

    // Totals
    doc.moveDown(0.3);
    doc.moveTo(tableX, doc.y).lineTo(tableX + tableW, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    let totY = doc.y;
    doc.text('Nettobetrag / Net total', colDesc, totY);
    doc.text(netTotal.toFixed(2) + ' €', colGross, totY, { width: 50, align: 'right' });
    totY += 15;
    doc.text(`USt. / VAT (${(vatRate * 100).toFixed(0)}%)`, colDesc, totY);
    doc.text(vatAmount.toFixed(2) + ' €', colGross, totY, { width: 50, align: 'right' });
    totY += 15;
    doc.moveTo(colNet, totY).lineTo(tableX + tableW, totY).lineWidth(0.5).stroke();
    totY += 6;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Gesamtbetrag / Total', colDesc, totY);
    doc.text(grossTotal.toFixed(2) + ' €', colGross, totY, { width: 50, align: 'right' });

    // Footer
    doc.moveDown(4);
    doc.fontSize(8).font('Helvetica').fillColor('#888');
    doc.text('Vielen Dank für Ihren Einkauf. Diese Rechnung dient als Lizenznachweis.', left, doc.y);
    doc.text('Thank you for your purchase. This invoice serves as your proof of license.');
    doc.moveDown(1);
    doc.text(`${SELLER.name} · ${SELLER.owner} · ${SELLER.street} · ${SELLER.city}`);
    doc.text(`${SELLER.email} · Steuernummer: ${SELLER.taxNumber}`);

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
    archive.append(invoiceBuf, { name: `Rechnung-${invoiceNumber}.pdf` });

    await archive.finalize();
  } catch (e) {
    console.error('Download error:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
};
