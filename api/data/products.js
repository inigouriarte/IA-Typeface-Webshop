/**
 * Public GET: products from Blob or static file. Used by rewrites so the site gets admin-edited data.
 */
const { readProducts } = require('../../lib/blob-data');

module.exports = async function (req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  try {
    const products = await readProducts(req);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.end(JSON.stringify(products));
  } catch (e) {
    res.status(500).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: e.message }));
  }
};
