const requireAdmin = require('../_require-admin');
const { commitFiles } = require('../_github');
const readBody = require('../read-body');
const path = require('path');
const fs = require('fs');

module.exports = async function (req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'data', 'typeface-detail-content.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const body = JSON.parse(await readBody(req));
      const data = body && typeof body === 'object' && !Array.isArray(body) ? body : (body.data && typeof body.data === 'object' ? body.data : null);
      if (!data) return res.status(400).json({ error: 'Expected JSON object' });
      await commitFiles(
        [{ path: 'data/typeface-detail-content.json', content: JSON.stringify(data, null, 2) + '\n' }],
        'Update typeface detail content via admin panel'
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).end();
  }
};
