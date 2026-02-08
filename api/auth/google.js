const crypto = require('crypto');
const { sign } = require('../../lib/auth-cookie');

const COOKIE_STATE = 'admin_google_state';

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (host && host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

module.exports = function (req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  const hasGoogle = Boolean(
    process.env.SESSION_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
  if (!hasGoogle) {
    res.status(400).send('Google login is not configured');
    return;
  }
  const state = crypto.randomBytes(24).toString('hex');
  const value = sign({ state });
  res.setHeader('Set-Cookie', [
    `${COOKIE_STATE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    'Max-Age=600',
  ].join('; '));
  const baseUrl = process.env.BASE_URL || getBaseUrl(req);
  const redirectUri = encodeURIComponent((baseUrl + '/api/auth/google/callback').replace(/\/$/, ''));
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
  res.writeHead(302, { Location: url });
  res.end();
};
