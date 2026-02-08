const { clearCookie } = require('../../lib/auth-cookie');

module.exports = function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  clearCookie(res);
  res.setHeader('Content-Type', 'application/json').end(JSON.stringify({ ok: true }));
};
