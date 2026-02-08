/**
 * Local admin server: serves the static site and provides protected API
 * to edit data/products.json and data/typeface-samples.json.
 *
 * Run: npm run dev   (or node server.js)
 * Admin: http://localhost:3000/admin.html
 *
 * Auth: set SESSION_SECRET and either ADMIN_PASSWORD_HASH or Google OAuth (see .env.example).
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
const SAMPLES_PATH = path.join(DATA_DIR, 'typeface-samples.json');

const SESSION_SECRET = process.env.SESSION_SECRET;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ALLOWED_ADMIN_EMAILS = process.env.ALLOWED_ADMIN_EMAILS
  ? process.env.ALLOWED_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  : [];

const hasPassword = Boolean(SESSION_SECRET && ADMIN_PASSWORD_HASH);
const hasGoogle = Boolean(SESSION_SECRET && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

if (!SESSION_SECRET) {
  console.error('Missing .env: SESSION_SECRET is required.');
  process.exit(1);
}
if (!hasPassword && !hasGoogle) {
  console.error(
    'Missing .env: set either ADMIN_PASSWORD_HASH (run: node scripts/hash-password.js YOUR_PASSWORD) or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET for Google login.'
  );
  process.exit(1);
}

app.use(express.json({ limit: '2mb' }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Serve static files (site root)
app.use(express.static(__dirname));

// --- Auth ---
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/auth/methods  (which login options are enabled?)
app.get('/api/auth/methods', (req, res) => {
  res.json({ password: hasPassword, google: hasGoogle });
});

// POST /api/auth/login  { "password": "..." }
app.post('/api/auth/login', async (req, res) => {
  if (!hasPassword) return res.status(400).json({ error: 'Password login is not configured' });
  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }
  const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  req.session.admin = true;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ ok: true });
  });
});

// GET /api/auth/google  → redirect to Google
app.get('/api/auth/google', (req, res) => {
  if (!hasGoogle) return res.status(400).send('Google login is not configured');
  const state = crypto.randomBytes(24).toString('hex');
  req.session.googleState = state;
  req.session.save((err) => {
    if (err) return res.status(500).send('Session error');
    const redirectUri = encodeURIComponent(BASE_URL + '/api/auth/google/callback');
    const scope = encodeURIComponent('openid email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    res.redirect(url);
  });
});

// GET /api/auth/google/callback  → exchange code, set session, redirect to admin
app.get('/api/auth/google/callback', async (req, res) => {
  if (!hasGoogle) return res.redirect('/admin.html?error=config');
  const { code, state, error } = req.query;
  if (error) return res.redirect('/admin.html?error=' + encodeURIComponent(error));
  if (!code || state !== req.session?.googleState) return res.redirect('/admin.html?error=invalid_callback');
  delete req.session.googleState;

  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: BASE_URL + '/api/auth/google/callback',
    grant_type: 'authorization_code',
  }).toString();

  const tokenRes = await new Promise((resolve, reject) => {
    const req = https.request(
      'https://oauth2.googleapis.com/token',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (ch) => (data += ch));
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (tokenRes.statusCode !== 200) {
    return res.redirect('/admin.html?error=token');
  }
  const tokens = JSON.parse(tokenRes.data);
  if (!tokens.access_token) return res.redirect('/admin.html?error=token');

  const userRes = await new Promise((resolve, reject) => {
    https.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: 'Bearer ' + tokens.access_token } },
      (res) => {
        let data = '';
        res.on('data', (ch) => (data += ch));
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      }
    ).on('error', reject);
  });

  if (userRes.statusCode !== 200) return res.redirect('/admin.html?error=userinfo');
  const user = JSON.parse(userRes.data);
  const email = (user.email || '').toLowerCase();

  // Google login requires an explicit allow-list; otherwise anyone could enter.
  if (ALLOWED_ADMIN_EMAILS.length === 0) {
    return res.redirect('/admin.html?error=allowed_emails_required');
  }
  if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
    return res.redirect('/admin.html?error=not_allowed');
  }

  req.session.admin = true;
  req.session.email = email;
  req.session.save((err) => {
    if (err) return res.redirect('/admin.html?error=session');
    res.redirect('/admin.html');
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me  (am I logged in?)
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.admin) return res.json({ ok: true });
  res.status(401).json({ error: 'Not logged in' });
});

// --- Admin API: Products (protected) ---
async function readProducts() {
  const raw = await fs.readFile(PRODUCTS_PATH, 'utf8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

async function writeProducts(data) {
  if (!Array.isArray(data)) throw new Error('Products must be an array');
  await fs.writeFile(PRODUCTS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

app.get('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const body = req.body;
    const products = Array.isArray(body) ? body : (body.products && Array.isArray(body.products) ? body.products : null);
    if (!products) return res.status(400).json({ error: 'Expected JSON array of products' });
    await writeProducts(products);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin API: Typeface samples (protected) ---
async function readSamples() {
  const raw = await fs.readFile(SAMPLES_PATH, 'utf8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

async function writeSamples(data) {
  if (!Array.isArray(data)) throw new Error('Samples must be an array');
  await fs.writeFile(SAMPLES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

app.get('/api/admin/typeface-samples', requireAuth, async (req, res) => {
  try {
    const samples = await readSamples();
    res.json(samples);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/typeface-samples', requireAuth, async (req, res) => {
  try {
    const body = req.body;
    const samples = Array.isArray(body) ? body : (body.samples && Array.isArray(body.samples) ? body.samples : null);
    if (!samples) return res.status(400).json({ error: 'Expected JSON array of typeface samples' });
    await writeSamples(samples);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
