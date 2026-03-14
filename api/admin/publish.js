const requireAdmin = require('../_require-admin');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await requireAdmin(req, res);
  if (!session) return;

  res.status(501).json({ error: 'Publish is not available in production. Changes are deployed automatically when you push to the main branch.' });
};
