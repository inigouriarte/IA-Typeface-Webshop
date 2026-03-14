/**
 * Vercel serverless catch-all for Better Auth.
 * Handles all /api/auth/* routes (sign-in, sign-up, sign-out, get-session, etc.)
 */

let handler;

async function getHandler() {
  if (handler) return handler;
  const { toNodeHandler } = await import('better-auth/node');
  const { auth } = await import('../../lib/auth.mjs');

  // Run migrations on first invocation to ensure tables exist
  const { getMigrations } = await import('better-auth/db/migration');
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  handler = toNodeHandler(auth);
  return handler;
}

module.exports = async function (req, res) {
  const h = await getHandler();
  return h(req, res);
};
