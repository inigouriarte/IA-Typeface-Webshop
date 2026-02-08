/**
 * Read/write products and typeface-samples in Vercel Blob.
 * When Blob is empty, products/samples are loaded from the deployed static files.
 */

const { list, put } = require('@vercel/blob');

const PRODUCTS_PATH = 'admin/products.json';
const SAMPLES_PATH = 'admin/typeface-samples.json';

async function getBlobContent(pathname) {
  const { blobs } = await list({ prefix: 'admin/' });
  const blob = blobs.find((b) => b.pathname === pathname);
  if (!blob || !blob.url) return null;
  const res = await fetch(blob.url);
  if (!res.ok) return null;
  return res.text();
}

function getOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (host && host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function readProducts(req) {
  const raw = await getBlobContent(PRODUCTS_PATH);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (_) {}
  }
  const origin = getOrigin(req);
  try {
    const res = await fetch(`${origin}/data/products.json`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (_) {}
  return [];
}

async function writeProducts(data) {
  if (!Array.isArray(data)) throw new Error('Products must be an array');
  await put(PRODUCTS_PATH, JSON.stringify(data, null, 2) + '\n', {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readSamples(req) {
  const raw = await getBlobContent(SAMPLES_PATH);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (_) {}
  }
  const origin = getOrigin(req);
  try {
    const res = await fetch(`${origin}/data/typeface-samples.json`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (_) {}
  return [];
}

async function writeSamples(data) {
  if (!Array.isArray(data)) throw new Error('Samples must be an array');
  await put(SAMPLES_PATH, JSON.stringify(data, null, 2) + '\n', {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

module.exports = { readProducts, writeProducts, readSamples, writeSamples };
