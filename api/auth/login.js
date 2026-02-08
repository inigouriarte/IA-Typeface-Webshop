const bcrypt = require('bcryptjs');
const { setCookie } = require('../../lib/auth-cookie');
const readBody = require('../read-body');

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const hasPassword = Boolean(process.env.SESSION_SECRET && process.env.ADMIN_PASSWORD_HASH);
  if (!hasPassword) {
    res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Password login is not configured' }));
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (_) {
    res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }
  const password = body.password;
  if (!password || typeof password !== 'string') {
    res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Password required' }));
    return;
  }
  const ok = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!ok) {
    res.status(401).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Invalid password' }));
    return;
  }
  setCookie(res, { admin: true });
  res.setHeader('Content-Type', 'application/json').end(JSON.stringify({ ok: true }));
};
