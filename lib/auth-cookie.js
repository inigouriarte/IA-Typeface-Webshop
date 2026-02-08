/**
 * Signed cookie auth for Vercel serverless (no session store).
 */

const crypto = require('crypto');

const COOKIE_NAME = 'admin_session';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is required');
  return s;
}

function sign(payload) {
  const secret = getSecret();
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(data, 'utf8').toString('base64url') + '.' + sig;
}

function verify(value) {
  if (!value || typeof value !== 'string') return null;
  const [b64, sig] = value.split('.');
  if (!b64 || !sig) return null;
  let data;
  try {
    data = Buffer.from(b64, 'base64url').toString('utf8');
  } catch (_) {
    return null;
  }
  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
  if (sig !== expected) return null;
  try {
    return JSON.parse(data);
  } catch (_) {
    return null;
  }
}

function getCookie(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(new RegExp('(?:^|;)\\s*' + COOKIE_NAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

function setCookie(res, payload) {
  const value = sign(payload);
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${MAX_AGE}`,
  ].join('; '));
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    'Max-Age=0',
  ].join('; '));
}

function isAdmin(req) {
  const payload = verify(getCookie(req));
  return payload && payload.admin === true;
}

module.exports = { getCookie, setCookie, clearCookie, verify, sign, isAdmin, COOKIE_NAME };
