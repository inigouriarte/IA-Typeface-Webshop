const requireAdmin = require('../_require-admin');
const { commitFiles } = require('../_github');
const readBody = require('../read-body');
const path = require('path');
const fs = require('fs');

/**
 * Count the top-level entries in a content payload: array length for index,
 * object key count for detail/pages/styles.
 */
function countEntries(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') return Object.keys(data).length;
  return 0;
}

/**
 * Compare an incoming save against what's currently on disk and flag a
 * suspicious mass deletion (the payload drops more than half of the existing
 * entries, or empties a previously non-empty file). Read-only; never throws —
 * if the current file can't be read, it allows the save (fail-open, since a
 * missing baseline shouldn't block legitimate first writes).
 */
function guardAgainstMassDeletion(config, incoming) {
  try {
    const filePath = path.join(process.cwd(), 'data', config.file);
    const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const existingCount = countEntries(config.sanitize ? config.sanitize(current) : current);
    const incomingCount = countEntries(incoming);
    // Only guard when there's a meaningful baseline to protect.
    if (existingCount >= 3) {
      const droppingMostEntries = incomingCount < existingCount / 2;
      if (droppingMostEntries) {
        return {
          blocked: true,
          reason: `Incoming save has ${incomingCount} entries but ${existingCount} exist on disk — more than half would be removed.`,
          existingCount,
          incomingCount,
        };
      }
    }
    return { blocked: false, existingCount, incomingCount };
  } catch (e) {
    // Can't read baseline — don't block (fail open).
    return { blocked: false, existingCount: null, incomingCount: countEntries(incoming) };
  }
}

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
      const force = req.query.force === 'true';
      const files = [];
      for (const [key, value] of Object.entries(body)) {
        const config = CONTENT_MAP[key];
        if (!config) continue;
        const data = config.validate(value);
        if (!data) return res.status(400).json({ error: `Invalid data for type "${key}"` });

        // Data-loss guard: refuse a save that drops a large share of existing
        // entries versus what's on disk, unless explicitly forced. This is the
        // server-side backstop against the admin overwriting the whole
        // detail/index file with empty or near-empty data (which once wiped
        // all 13 typefaces when a failed client-side load left the in-memory
        // copy empty and a save persisted it).
        const guard = guardAgainstMassDeletion(config, data);
        if (guard.blocked && !force) {
          return res.status(409).json({
            error: 'Save blocked to prevent data loss',
            reason: guard.reason,
            existingCount: guard.existingCount,
            incomingCount: guard.incomingCount,
            hint: 'If this deletion is intentional, resubmit with ?force=true.',
          });
        }

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
