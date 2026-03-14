const requireAdmin = require('../_require-admin');
const { commitFiles, readFile } = require('../_github');
const readBody = require('../read-body');
const path = require('path');
const fs = require('fs');

module.exports = async function (req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'data', 'index-content.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(Array.isArray(data) ? data : []);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const body = JSON.parse(await readBody(req));
      const data = Array.isArray(body) ? body : (body.data && Array.isArray(body.data) ? body.data : null);
      if (!data) return res.status(400).json({ error: 'Expected JSON array of index content' });
      await commitFiles(
        [{ path: 'data/index-content.json', content: JSON.stringify(data, null, 2) + '\n' }],
        'Update index content via admin panel'
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).end();
  }
};
