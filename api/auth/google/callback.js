const https = require('https');
const { verify, setCookie } = require('../../../lib/auth-cookie');

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const match = raw.match(new RegExp('(?:^|;)\\s*' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

const COOKIE_STATE = 'admin_google_state';

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (host && host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

module.exports = async function (req, res) {
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
    res.writeHead(302, { Location: '/admin.html?error=config' });
    res.end();
    return;
  }
  const { code, state, error } = req.url ? (() => {
    const u = new URL(req.url, 'http://x');
    return Object.fromEntries(u.searchParams);
  })() : {};
  if (error) {
    res.writeHead(302, { Location: '/admin.html?error=' + encodeURIComponent(error) });
    res.end();
    return;
  }
  const stateCookie = getCookie(req, COOKIE_STATE);
  const payload = stateCookie ? verify(stateCookie) : null;
  if (!code || !payload || payload.state !== state) {
    res.writeHead(302, { Location: '/admin.html?error=invalid_callback' });
    res.end();
    return;
  }
  const baseUrl = (process.env.BASE_URL || getBaseUrl(req)).replace(/\/$/, '');
  const redirectUri = baseUrl + '/api/auth/google/callback';
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }).toString();

  const tokenRes = await new Promise((resolve, reject) => {
    const r = https.request(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
      },
      (resp) => {
        let data = '';
        resp.on('data', (ch) => (data += ch));
        resp.on('end', () => resolve({ statusCode: resp.statusCode, data }));
      }
    );
    r.on('error', reject);
    r.write(body);
    r.end();
  });

  if (tokenRes.statusCode !== 200) {
    res.writeHead(302, { Location: '/admin.html?error=token' });
    res.end();
    return;
  }
  const tokens = JSON.parse(tokenRes.data);
  if (!tokens.access_token) {
    res.writeHead(302, { Location: '/admin.html?error=token' });
    res.end();
    return;
  }

  const userRes = await new Promise((resolve, reject) => {
    https.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: 'Bearer ' + tokens.access_token } },
      (resp) => {
        let data = '';
        resp.on('data', (ch) => (data += ch));
        resp.on('end', () => resolve({ statusCode: resp.statusCode, data }));
      }
    ).on('error', reject);
  });

  if (userRes.statusCode !== 200) {
    res.writeHead(302, { Location: '/admin.html?error=userinfo' });
    res.end();
    return;
  }
  const user = JSON.parse(userRes.data);
  const email = (user.email || '').toLowerCase();
  const allowed = process.env.ALLOWED_ADMIN_EMAILS
    ? process.env.ALLOWED_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  if (allowed.length === 0) {
    res.writeHead(302, { Location: '/admin.html?error=allowed_emails_required' });
    res.end();
    return;
  }
  if (!allowed.includes(email)) {
    res.writeHead(302, { Location: '/admin.html?error=not_allowed' });
    res.end();
    return;
  }

  setCookie(res, { admin: true });
  res.writeHead(302, { Location: '/admin.html' });
  res.end();
};
