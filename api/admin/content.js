const requireAdmin = require('../_require-admin');
const { commitFiles } = require('../_github');
const readBody = require('../read-body');
const path = require('path');
const fs = require('fs');

const CONTENT_MAP = {
  index: {
    file: 'index-content.json',
    commitMsg: 'Update index content via admin panel',
    validate(data) {
      return Array.isArray(data) ? data : (data && data.data && Array.isArray(data.data) ? data.data : null);
    },
    sanitize(data) {
      return Array.isArray(data) ? data : [];
    },
  },
  detail: {
    file: 'typeface-detail-content.json',
    commitMsg: 'Update typeface detail content via admin panel',
    validate(data) {
      return data && typeof data === 'object' && !Array.isArray(data)
        ? data
        : (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : null);
    },
    sanitize(data) {
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    },
  },
  pages: {
    file: 'page-content.json',
    commitMsg: 'Update page content via admin panel',
    validate(data) {
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    },
    sanitize(data) {
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    },
  },
  styles: {
    file: 'styles.json',
    commitMsg: 'Update styles via admin panel',
    validate(data) {
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    },
    sanitize(data) {
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    },
  },
};

module.exports = async function (req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const type = req.query.type || 'index';

  // Batch mode: save multiple content types in a single commit
  if (type === 'batch' && req.method === 'PUT') {
    try {
      const body = JSON.parse(await readBody(req));
      const files = [];
      for (const [key, value] of Object.entries(body)) {
        const config = CONTENT_MAP[key];
        if (!config) continue;
        const data = config.validate(value);
        if (!data) return res.status(400).json({ error: `Invalid data for type "${key}"` });
        files.push({ path: `data/${config.file}`, content: JSON.stringify(data, null, 2) + '\n' });
      }
      if (!files.length) return res.status(400).json({ error: 'No valid content types in batch' });
      await commitFiles(files, 'Update content via admin panel');
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const config = CONTENT_MAP[type];
  if (!config) {
    return res.status(400).json({ error: 'Invalid type. Use ?type=index, ?type=detail, ?type=pages, or ?type=batch' });
  }

  const filePath = path.join(process.cwd(), 'data', config.file);

  if (req.method === 'GET') {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(config.sanitize(data));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const body = JSON.parse(await readBody(req));
      const data = config.validate(body);
      if (!data) return res.status(400).json({ error: `Invalid data for type "${type}"` });
      await commitFiles(
        [{ path: `data/${config.file}`, content: JSON.stringify(data, null, 2) + '\n' }],
        config.commitMsg
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).end();
  }
};
