/**
 * Public GET: typeface samples from Blob or static file.
 */
const { readSamples } = require('../../lib/blob-data');

module.exports = async function (req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  try {
    const samples = await readSamples(req);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.end(JSON.stringify(samples));
  } catch (e) {
    res.status(500).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: e.message }));
  }
};
