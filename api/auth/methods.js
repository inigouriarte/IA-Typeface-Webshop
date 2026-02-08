module.exports = function (req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  const hasPassword = Boolean(process.env.SESSION_SECRET && process.env.ADMIN_PASSWORD_HASH);
  const hasGoogle = Boolean(
    process.env.SESSION_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ password: hasPassword, google: hasGoogle }));
};
