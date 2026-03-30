/**
 * Local dev server: serves the static site and API to edit content.
 * Run: npm run dev   (or node server.js)
 * Admin: http://localhost:3000/admin.html  (login required)
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const crypto = require('crypto');
const Stripe = require('stripe');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const multer = require('multer');
const { execSync } = require('child_process');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DOWNLOAD_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DOWNLOAD_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const INDEX_CONTENT_PATH = path.join(DATA_DIR, 'index-content.json');
const TYPEFACE_DETAIL_CONTENT_PATH = path.join(DATA_DIR, 'typeface-detail-content.json');

(async () => {
  // Dynamic ESM imports for Better Auth
  const { toNodeHandler } = await import('better-auth/node');
  const { fromNodeHeaders } = await import('better-auth/node');
  const { auth } = await import('./lib/auth.mjs');

  // Ensure auth tables exist (safe to run on every boot – idempotent)
  const { getMigrations } = await import('better-auth/db/migration');
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  const app = express();

  // Better Auth handler – MUST be mounted before express.json()
  app.all('/api/auth/*', toNodeHandler(auth));

  app.use(express.json({ limit: '2mb' }));

  // Serve static files (site root)
  app.use(express.static(__dirname));

  // --- Admin auth middleware ---
  async function requireAdmin(req, res, next) {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session && session.user && session.user.role === 'admin') {
        return next();
      }
    } catch (_) {}
    res.status(401).json({ error: 'Unauthorized – admin login required' });
  }

  // --- Stripe Checkout ---
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  app.get('/api/create-checkout-session', (req, res) => {
    res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null });
  });

  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' });
    }
    try {
      const { productName, priceAmount, typefaceId, embedded, metadata: extraMeta } = req.body;
      if (!productName || !priceAmount) {
        return res.status(400).json({ error: 'Missing productName or priceAmount' });
      }

      const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
      const isEmbedded = !!embedded;

      const sessionConfig = {
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: `Font license – ${productName}`,
            },
            unit_amount: Math.round(priceAmount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        metadata: {
          typefaceId: typefaceId || '',
          productName: productName,
          ...(extraMeta || {}),
        },
      };

      if (isEmbedded) {
        sessionConfig.ui_mode = 'embedded';
        sessionConfig.return_url = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      } else {
        sessionConfig.success_url = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
        sessionConfig.cancel_url = `${baseUrl}/${typefaceId || ''}`;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      if (isEmbedded) {
        res.json({ clientSecret: session.client_secret });
      } else {
        res.json({ url: session.url });
      }
    } catch (e) {
      console.error('Stripe error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // --- Typeface ID → font directory mapping ---
  const TYPEFACE_FONT_DIRS = {
    alvica: 'Alvica',
    actio: 'Actio',
    modus: 'Modus',
    luara: 'Luara',
    dale: 'Dale',
    peqat: 'Peqat',
    heron2: 'Heron',
    naora: 'Naora',
    sifora: 'Sifora',
    zigrid: 'Zigrid',
    stycka: 'Stycka',
    oequadrat: 'Old English Quadrat',
    Test: 'INDIG Test',
    dajo: 'DAJO',
    stycka: 'Stycka'
  };

  // --- Signed download tokens ---
  function createDownloadToken(sessionId) {
    const expires = Date.now() + DOWNLOAD_TTL_MS;
    const payload = sessionId + ':' + expires;
    const sig = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
    return Buffer.from(payload + ':' + sig).toString('base64url');
  }

  function verifyDownloadToken(token) {
    try {
      const decoded = Buffer.from(token, 'base64url').toString();
      const parts = decoded.split(':');
      if (parts.length < 3) return null;
      const sig = parts.pop();
      const expires = parseInt(parts.pop(), 10);
      const sessionId = parts.join(':');
      const expected = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(sessionId + ':' + expires).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
      if (Date.now() > expires) return null;
      return sessionId;
    } catch { return null; }
  }

  // --- Checkout session retrieval ---
  app.get('/api/checkout-session/:id', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    try {
      const session = await stripe.checkout.sessions.retrieve(req.params.id, {
        expand: ['line_items'],
      });
      const downloadToken = session.payment_status === 'paid'
        ? createDownloadToken(session.id)
        : null;

      res.json({
        id: session.id,
        status: session.payment_status,
        customerEmail: session.customer_details?.email || '',
        customerName: session.customer_details?.name || '',
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        downloadToken: downloadToken,
        lineItems: (session.line_items?.data || []).map(li => ({
          name: li.description,
          amount: li.amount_total,
          currency: li.currency,
          quantity: li.quantity,
        })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Download fonts + invoice ZIP ---
  app.get('/api/download/:token', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    try {
      const sessionId = verifyDownloadToken(req.params.token);
      if (!sessionId) {
        return res.status(403).json({ error: 'Download link has expired. Please revisit your purchase confirmation page to get a new link.' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
      if (session.payment_status !== 'paid') {
        return res.status(403).json({ error: 'Payment not completed' });
      }

      const typefaceId = session.metadata?.typefaceId || '';
      const fontDirName = TYPEFACE_FONT_DIRS[typefaceId];
      if (!fontDirName) {
        return res.status(404).json({ error: 'Unknown typeface' });
      }

      const fontDir = path.join(__dirname, 'fonts', fontDirName);
      const fontFiles = await fs.readdir(fontDir);

      // Generate invoice PDF into a buffer
      const invoiceNumber = await assignInvoiceNumber(sessionId);
      const invoiceBuf = await generateInvoicePDF(session, invoiceNumber);

      // Stream ZIP
      const zipName = `INDG-${fontDirName.replace(/\s+/g, '-')}-License.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      // Add font files
      for (const file of fontFiles) {
        archive.file(path.join(fontDir, file), { name: `fonts/${file}` });
      }

      // Add invoice
      archive.append(invoiceBuf, { name: `Rechnung-${invoiceNumber}.pdf` });

      await archive.finalize();
    } catch (e) {
      console.error('Download error:', e.message);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message });
      }
    }
  });

  // --- Invoice numbering (random, stable per session) ---
  const INVOICE_MAP_PATH = path.join(DATA_DIR, 'invoice-map.json');

  async function assignInvoiceNumber(sessionId) {
    let map = {};
    try {
      const raw = await fs.readFile(INVOICE_MAP_PATH, 'utf8');
      map = JSON.parse(raw);
    } catch { /* file doesn't exist yet */ }

    if (map[sessionId]) return map[sessionId];

    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    const invoiceNum = `IA-${year}-${rand}`;
    map[sessionId] = invoiceNum;
    await fs.writeFile(INVOICE_MAP_PATH, JSON.stringify(map, null, 2) + '\n', 'utf8');
    return invoiceNum;
  }

  // --- Seller details (update with your real info) ---
  const SELLER = {
    name: 'Indigo Alphabets',
    owner: 'Iñigo Uriarte Peña',
    street: 'Markgrafendamm 28',
    city: '10245 Berlin',
    country: 'Germany',
    email: 'hi@indigoindigo.org',
    taxNumber: '16/568/03523',
  };

  // --- Invoice PDF generation (German-compliant) ---
  function generateInvoicePDF(session, invoiceNumber) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
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

      // ── Seller header ──
      doc.fontSize(18).font('Helvetica-Bold');
      doc.characterSpacing(-0.45); // -0.025em tracking at 18pt
      doc.text(SELLER.name, left, 50);
      doc.characterSpacing(0); // reset tracking
      doc.fontSize(8).font('Helvetica').fillColor('#555');
      doc.lineGap(3); // slightly increased line spacing for body text
      doc.text(`${SELLER.owner} · ${SELLER.street} · ${SELLER.city} · ${SELLER.country}`, left, doc.y + 2);
      doc.text(`E-Mail: ${SELLER.email} · Steuernummer: ${SELLER.taxNumber}`);
      doc.fillColor('#000');

      doc.moveDown(2);

      // ── Buyer address block ──
      doc.fontSize(9).font('Helvetica-Bold').text('Rechnungsempfänger', left, doc.y);
      doc.font('Helvetica').fontSize(10);
      doc.text(customer.name || '—');
      if (address.line1) doc.text(address.line1);
      if (address.line2) doc.text(address.line2);
      const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
      if (cityLine) doc.text(cityLine);
      if (address.country) doc.text(address.country);
      doc.text(customer.email || '');

      // ── Invoice meta (right side) ──
      const metaY = 160;
      doc.fontSize(10).font('Helvetica');
      doc.text('Rechnungsnummer:', rightCol, metaY);
      doc.font('Helvetica-Bold').text(invoiceNumber, rightCol + 120, metaY);
      doc.font('Helvetica');
      doc.text('Rechnungsdatum:', rightCol, metaY + 16);
      doc.text(dateStr, rightCol + 120, metaY + 16);
      doc.text('Leistungsdatum:', rightCol, metaY + 32);
      doc.text(dateStr, rightCol + 120, metaY + 32);

      // ── Invoice title ──
      const titleY = Math.max(doc.y + 20, metaY + 60);
      doc.fontSize(14).font('Helvetica-Bold').text('RECHNUNG / INVOICE', left, titleY);
      doc.moveDown(1);

      // ── Line items table ──
      const tableX = left;
      const colDesc = tableX;
      const colQty = 340;
      const colNet = 390;
      const colVat = 450;
      const colGross = 500;
      const tableW = colGross + 50 - tableX;

      // Table header
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

      // ── Totals ──
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

      // ── Footer ──
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

  // --- Admin API: Index page content ---
  async function readIndexContent() {
    const raw = await fs.readFile(INDEX_CONTENT_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }

  async function writeIndexContent(data) {
    if (!Array.isArray(data)) throw new Error('Index content must be an array');
    await fs.writeFile(INDEX_CONTENT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  // --- Admin API: Typeface detail pages content ---
  async function readTypefaceDetailContent() {
    const raw = await fs.readFile(TYPEFACE_DETAIL_CONTENT_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  async function writeTypefaceDetailContent(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Typeface detail content must be an object');
    await fs.writeFile(TYPEFACE_DETAIL_CONTENT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  app.get('/api/admin/content', requireAdmin, async (req, res) => {
    try {
      if (req.query.type === 'detail') {
        res.json(await readTypefaceDetailContent());
      } else {
        res.json(await readIndexContent());
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/content', requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (req.query.type === 'detail') {
        const data = body && typeof body === 'object' && !Array.isArray(body) ? body : (body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null);
        if (!data) return res.status(400).json({ error: 'Expected JSON object (id -> detail config)' });
        await writeTypefaceDetailContent(data);
      } else {
        const data = Array.isArray(body) ? body : (body.data && Array.isArray(body.data) ? body.data : null);
        if (!data) return res.status(400).json({ error: 'Expected JSON array of index content' });
        await writeIndexContent(data);
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Admin API: Orders (Stripe checkout sessions) ---
  app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    if (!stripe) return res.json({ orders: [], hasStripe: false });
    try {
      const limit = Math.min(parseInt(req.query.limit) || 30, 100);
      const params = { limit, expand: ['data.line_items'] };
      if (req.query.starting_after) params.starting_after = req.query.starting_after;
      const sessions = await stripe.checkout.sessions.list(params);
      const orders = sessions.data
        .filter(s => s.payment_status === 'paid')
        .map(s => ({
          id: s.id,
          created: s.created,
          email: s.customer_details?.email || '',
          name: s.customer_details?.name || '',
          amount: s.amount_total,
          currency: s.currency,
          typefaceId: s.metadata?.typefaceId || '',
          productName: s.metadata?.productName || '',
          licenseTier: s.metadata?.licenseTier || '',
          country: s.customer_details?.address?.country || '',
          city: s.customer_details?.address?.city || '',
        }));
      res.json({
        orders,
        hasMore: sessions.has_more,
        hasStripe: true,
        lastId: orders.length ? orders[orders.length - 1].id : null,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const fontCount = Object.keys(TYPEFACE_FONT_DIRS).length;
      let orderCount = 0, revenue = 0;
      if (stripe) {
        // Get recent balance (last 30 days)
        const since = Math.floor((Date.now() - 30 * 86400000) / 1000);
        const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: since } });
        const paid = sessions.data.filter(s => s.payment_status === 'paid');
        orderCount = paid.length;
        revenue = paid.reduce((sum, s) => sum + (s.amount_total || 0), 0);
      }
      res.json({ fontCount, orderCount, revenue, hasStripe: !!stripe });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Admin API: Create new font ---
  function detectWeightInfo(filename) {
    const lower = filename.toLowerCase();
    let weight = 400, label = 'Regular', style = 'normal', stretch = 'normal';
    if (/thin/i.test(lower)) { weight = 100; label = 'Thin'; }
    else if (/extralight|ultralight/i.test(lower)) { weight = 200; label = 'ExtraLight'; }
    else if (/light/i.test(lower)) { weight = 300; label = 'Light'; }
    else if (/medium/i.test(lower)) { weight = 500; label = 'Medium'; }
    else if (/semibold|demibold/i.test(lower)) { weight = 600; label = 'SemiBold'; }
    else if (/extrabold|ultrabold/i.test(lower)) { weight = 800; label = 'ExtraBold'; }
    else if (/(?<![a-z])bold/i.test(lower) && !/semi|demi|extra|ultra/i.test(lower)) { weight = 700; label = 'Bold'; }
    else if (/black|heavy/i.test(lower)) { weight = 900; label = 'Black'; }
    if (/italic/i.test(lower)) style = 'italic';
    else if (/oblique/i.test(lower)) style = 'oblique';
    if (/condensed/i.test(lower)) stretch = 'condensed';
    else if (/expanded/i.test(lower)) stretch = 'expanded';
    return { weight, label, style, stretch };
  }

  function addEntryToJSObject(src, markerStr, newLine) {
    const markerIdx = src.indexOf(markerStr);
    if (markerIdx === -1) return src;
    // Find the opening { of the object
    const openBrace = src.indexOf('{', markerIdx);
    if (openBrace === -1) return src;
    // Find matching closing }
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      if (src[i] === '{') depth++;
      if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          // i is the closing }. Find the last non-whitespace char before it.
          let lastContent = i - 1;
          while (lastContent > openBrace && /\s/.test(src[lastContent])) lastContent--;
          // Add comma if the last content char isn't a comma or {
          let comma = '';
          if (src[lastContent] !== ',' && src[lastContent] !== '{') comma = ',';
          return src.slice(0, lastContent + 1) + comma + '\n' + newLine + src.slice(lastContent + 1);
        }
      }
    }
    return src;
  }

  // ── Publish (rebuild site pages) ──
  app.post('/api/admin/publish', requireAdmin, async (req, res) => {
    try {
      execSync('npm run build', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
      res.json({ ok: true, message: 'Site pages regenerated.' });
    } catch (e) {
      const stderr = e.stderr ? e.stderr.toString().slice(-500) : e.message;
      res.status(500).json({ error: 'Build failed: ' + stderr });
    }
  });

  app.post('/api/admin/fonts', requireAdmin, upload.array('files', 50), async (req, res) => {
    try {
      const { fontId, name, dirName, description, designer, version } = req.body;
      const pricing = req.body.pricing ? JSON.parse(req.body.pricing) : [];
      if (!fontId || !name || !dirName) {
        return res.status(400).json({ error: 'fontId, name, and dirName are required' });
      }
      const files = req.files || [];
      if (!files.length) {
        return res.status(400).json({ error: 'No font files uploaded' });
      }

      const fontDir = path.join(__dirname, 'fonts', dirName);
      await fs.mkdir(fontDir, { recursive: true });

      // Save files and group by weight
      const weightMap = {};
      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!['.woff2', '.woff', '.ttf', '.otf'].includes(ext)) continue;
        const info = detectWeightInfo(file.originalname);
        const key = `${info.weight}-${info.style}-${info.stretch}`;
        if (!weightMap[key]) weightMap[key] = { ...info, files: {} };
        const format = ext === '.woff2' ? 'woff2' : ext === '.woff' ? 'woff' : ext.slice(1);
        weightMap[key].files[format] = file.originalname;
        await fs.writeFile(path.join(fontDir, file.originalname), file.buffer);
      }

      const weights = Object.values(weightMap);
      if (!weights.length) {
        return res.status(400).json({ error: 'No valid font files found (.woff2, .woff, .ttf, .otf)' });
      }
      const defaultWeight = weights.find(w => w.weight === 400) || weights[0];
      const defaultFile = defaultWeight.files.woff2 || defaultWeight.files.woff || Object.values(defaultWeight.files)[0];
      const defaultFilePath = `fonts/${dirName}/${defaultFile}`;
      const isOneStyle = weights.length === 1;

      // 1. Append @font-face rules and sample rule to styles.css
      const cssPath = path.join(__dirname, 'styles.css');
      let css = await fs.readFile(cssPath, 'utf8');

      let fontFaceCSS = `\n/* ${name} Font Faces */\n`;
      for (const w of weights) {
        const srcParts = [];
        if (w.files.woff2) srcParts.push(`url('fonts/${dirName}/${w.files.woff2}') format('woff2')`);
        if (w.files.woff) srcParts.push(`url('fonts/${dirName}/${w.files.woff}') format('woff')`);
        if (!srcParts.length && w.files.ttf) srcParts.push(`url('fonts/${dirName}/${w.files.ttf}') format('truetype')`);
        if (!srcParts.length && w.files.otf) srcParts.push(`url('fonts/${dirName}/${w.files.otf}') format('opentype')`);
        if (srcParts.length) {
          fontFaceCSS += `@font-face {\n    font-family: '${name}';\n    src: ${srcParts.join(',\\n         ')};\n    font-weight: ${w.weight};\n    font-style: ${w.style};\n    font-display: swap;\n}\n\n`;
        }
      }
      const sampleRule = `.typeface-sample[data-font="${fontId}"] {\n    font-family: '${name}', sans-serif;\n}\n\n`;

      // Insert @font-face after last existing font-face block
      const lastFontFaceIdx = css.lastIndexOf('font-display: swap;\n}');
      if (lastFontFaceIdx >= 0) {
        const insertAt = css.indexOf('\n', lastFontFaceIdx + 20) + 1;
        css = css.slice(0, insertAt) + fontFaceCSS + css.slice(insertAt);
      } else {
        css = fontFaceCSS + css;
      }
      // Insert sample rule after last existing sample rule
      const sampleMatches = [...css.matchAll(/\.typeface-sample\[data-font="[^"]+"\]\s*\{[^}]+\}\n/g)];
      if (sampleMatches.length) {
        const lastMatch = sampleMatches[sampleMatches.length - 1];
        const insertAt = lastMatch.index + lastMatch[0].length;
        css = css.slice(0, insertAt) + '\n' + sampleRule + css.slice(insertAt);
      }
      await fs.writeFile(cssPath, css, 'utf8');

      // 2. Update index-content.json
      const indexContent = await readIndexContent();
      const newIndexEntry = {
        id: fontId,
        name: name,
        displayName: name.replace(/^INDG\s+/i, ''),
        linkUrl: `${fontId}.html`,
        hasLink: true,
        dropdownType: isOneStyle ? '' : 'weight',
        fontSize: 120,
        letterSpacing: 0,
        isOneStyle: isOneStyle,
      };
      if (!isOneStyle) {
        const sorted = [...weights].sort((a, b) => a.weight - b.weight);
        newIndexEntry.weights = sorted.map(w => w.weight);
        newIndexEntry.weightLabels = sorted.map(w => w.label);
        newIndexEntry.defaultWeight = defaultWeight.weight;
        newIndexEntry.defaultWeightIndex = newIndexEntry.weights.indexOf(defaultWeight.weight);
      }
      indexContent.push(newIndexEntry);
      await writeIndexContent(indexContent);

      // 3. Update typeface-detail-content.json
      const detailContent = await readTypefaceDetailContent();
      detailContent[fontId] = {
        description: description || '',
        details: {
          designer: designer || 'Iñigo Uriarte',
          version: version || '1.0',
          formats: 'TTF, WOFF, WOFF2',
          styles: String(weights.length),
          glyphs: '',
          unicodeRanges: ['Basic Latin', 'Latin 1-Supplement'],
        },
        samples: [{
          weight: defaultWeight.weight,
          fontSize: 120,
          text: 'The quick brown fox jumps over the lazy dog.',
          sampleId: defaultWeight.label.toLowerCase(),
        }],
        pricing: pricing,
        hasOpenType: false,
        openTypeFeatures: [],
      };
      await writeTypefaceDetailContent(detailContent);

      // 4. Update typeface-detail-renderer.js (TYPEFACE_FONT_PATHS)
      const rendererPath = path.join(__dirname, 'typeface-detail-renderer.js');
      let renderer = await fs.readFile(rendererPath, 'utf8');
      renderer = addEntryToJSObject(renderer, 'var TYPEFACE_FONT_PATHS', `    ${fontId}: '${defaultFilePath}'`);
      await fs.writeFile(rendererPath, renderer, 'utf8');

      // 5. Update script.js (fontFileMap + fontFamilyMap)
      const scriptPath = path.join(__dirname, 'script.js');
      let script = await fs.readFile(scriptPath, 'utf8');
      script = addEntryToJSObject(script, 'const fontFileMap', `    '${name}': '${defaultFilePath}'`);
      script = addEntryToJSObject(script, 'const fontFamilyMap', `        '${fontId}': '${name}'`);
      await fs.writeFile(scriptPath, script, 'utf8');

      // 6. Update TYPEFACE_FONT_DIRS in server.js + in memory
      TYPEFACE_FONT_DIRS[fontId] = dirName;
      const serverPath = path.join(__dirname, 'server.js');
      let serverSrc = await fs.readFile(serverPath, 'utf8');
      serverSrc = addEntryToJSObject(serverSrc, 'const TYPEFACE_FONT_DIRS', `    ${fontId}: '${dirName}'`);
      await fs.writeFile(serverPath, serverSrc, 'utf8');

      // 7. Run build to generate the detail page and update index.html
      try {
        execSync('npm run build', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
      } catch (buildErr) {
        // Font was created but build failed – still report success with warning
        return res.json({
          ok: true,
          warning: 'Font files and config saved, but build failed: ' + (buildErr.stderr?.toString() || buildErr.message),
          message: `Font "${name}" created. Run "npm run build" manually to generate pages.`,
        });
      }

      res.json({ ok: true, message: `Font "${name}" created successfully. Detail page: ${fontId}.html` });
    } catch (e) {
      console.error('Font creation error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Clean URLs: serve .html files for extensionless paths (matches Vercel cleanUrls)
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.includes('.') || req.path.startsWith('/api/')) return next();
    const filePath = path.join(__dirname, req.path + '.html');
    if (fsSync.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    next();
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  });
})();
