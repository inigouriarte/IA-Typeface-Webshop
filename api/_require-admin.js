/**
 * Shared admin auth check for Vercel serverless functions.
 * Returns the session if the user is an admin, otherwise sends 401.
 */

let authInstance;

async function getAuth() {
  if (authInstance) return authInstance;
  const { auth } = await import('../lib/auth.mjs');
  authInstance = auth;
  return auth;
}

module.exports = async function requireAdmin(req, res) {
  const auth = await getAuth();
  const { fromNodeHeaders } = await import('better-auth/node');
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session && session.user && session.user.role === 'admin') {
      return session;
    }
  } catch (_) {}
  res.status(401).json({ error: 'Unauthorized – admin login required' });
  return null;
};
