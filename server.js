/**
 * Local dev server: serves the static site and API to edit content.
 * Run: npm run dev   (or node server.js)
 * Admin: http://localhost:3000/admin.html  (no login)
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const INDEX_CONTENT_PATH = path.join(DATA_DIR, 'index-content.json');
const TYPEFACE_DETAIL_CONTENT_PATH = path.join(DATA_DIR, 'typeface-detail-content.json');

app.use(express.json({ limit: '2mb' }));

// Serve static files (site root)
app.use(express.static(__dirname));

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

app.get('/api/admin/index-content', async (req, res) => {
  try {
    const data = await readIndexContent();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/index-content', async (req, res) => {
  try {
    const body = req.body;
    const data = Array.isArray(body) ? body : (body.data && Array.isArray(body.data) ? body.data : null);
    if (!data) return res.status(400).json({ error: 'Expected JSON array of index content' });
    await writeIndexContent(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin API: Typeface detail pages content (spreadsheet source for all detail pages) ---
async function readTypefaceDetailContent() {
  const raw = await fs.readFile(TYPEFACE_DETAIL_CONTENT_PATH, 'utf8');
  const data = JSON.parse(raw);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

async function writeTypefaceDetailContent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Typeface detail content must be an object');
  await fs.writeFile(TYPEFACE_DETAIL_CONTENT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

app.get('/api/admin/typeface-detail-content', async (req, res) => {
  try {
    const data = await readTypefaceDetailContent();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/typeface-detail-content', async (req, res) => {
  try {
    const body = req.body;
    const data = body && typeof body === 'object' && !Array.isArray(body) ? body : (body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null);
    if (!data) return res.status(400).json({ error: 'Expected JSON object (id -> detail config)' });
    await writeTypefaceDetailContent(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
