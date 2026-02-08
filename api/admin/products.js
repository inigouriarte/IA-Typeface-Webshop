const { isAdmin } = require('../../lib/auth-cookie');
const { readProducts, writeProducts } = require('../../lib/blob-data');
const readBody = require('../read-body');

module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (!isAdmin(req)) {
    res.status(401).end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  if (req.method === 'GET') {
    try {
      const products = await readProducts(req);
      res.end(JSON.stringify(products));
    } catch (e) {
      res.status(500).end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (req.method === 'PUT') {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (_) {
      res.status(400).end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    const products = Array.isArray(body) ? body : (body.products && Array.isArray(body.products) ? body.products : null);
    if (!products) {
      res.status(400).end(JSON.stringify({ error: 'Expected JSON array of products' }));
      return;
    }
    try {
      await writeProducts(products);
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.status(500).end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  res.status(405).end();
};
