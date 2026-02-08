const { isAdmin } = require('../../lib/auth-cookie');

module.exports = function (req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  if (isAdmin(req)) {
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.status(401).end(JSON.stringify({ error: 'Not logged in' }));
  }
};
