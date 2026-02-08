const { isAdmin } = require('../../lib/auth-cookie');
const { readSamples, writeSamples } = require('../../lib/blob-data');
const readBody = require('../read-body');

module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (!isAdmin(req)) {
    res.status(401).end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  if (req.method === 'GET') {
    try {
      const samples = await readSamples(req);
      res.end(JSON.stringify(samples));
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
    const samples = Array.isArray(body) ? body : (body.samples && Array.isArray(body.samples) ? body.samples : null);
    if (!samples) {
      res.status(400).end(JSON.stringify({ error: 'Expected JSON array of typeface samples' }));
      return;
    }
    try {
      await writeSamples(samples);
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.status(500).end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  res.status(405).end();
};
