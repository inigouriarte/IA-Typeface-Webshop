const requireAdmin = require('../_require-admin');
const path = require('path');
const fs = require('fs');

module.exports = async function (req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const filePath = path.join(process.cwd(), 'data', 'typeface-detail-content.json');

  if (req.method === 'GET') {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === 'PUT') {
    res.status(501).json({ error: 'Content editing is not available in production. Use the local dev server (npm run dev) to edit content, then redeploy.' });
  } else {
    res.status(405).end();
  }
};
