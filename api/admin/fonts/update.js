const requireAdmin = require('../../_require-admin');
const { commitFiles, readFile } = require('../../_github');

function detectWeightInfo(filename) {
  const lower = filename.toLowerCase();
  let weight = 400, label = 'Regular', style = 'normal', stretch = 'normal';
  if (/thin/i.test(lower)) { weight = 100; label = 'Thin'; }
  else if (/extralight|ultralight/i.test(lower)) { weight = 200; label = 'ExtraLight'; }
  else if (/light/i.test(lower)) { weight = 300; label = 'Light'; }
  else if (/medium/i.test(lower)) { weight = 500; label = 'Medium'; }
  else if (/semibold|demibold/i.test(lower)) { weight = 600; label = 'SemiBold'; }
  else if (/extrabold|ultrabold/i.test(lower)) { weight = 800; label = 'ExtraBold'; }
  else if (/(?<![a-z])bold/i.test(lower) && !/semi|demi|extra|ultra/i.test(lower)) { weight = 700; label = 'Bold'; }
  else if (/black|heavy/i.test(lower)) { weight = 900; label = 'Black'; }
  if (/italic/i.test(lower)) style = 'italic';
  else if (/oblique/i.test(lower)) style = 'oblique';
  if (/condensed/i.test(lower)) stretch = 'condensed';
  else if (/expanded/i.test(lower)) stretch = 'expanded';
  return { weight, label, style, stretch };
}

/**
 * Parse multipart/form-data from the raw request.
 */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('error', reject);
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+?)(?:;|$)/);
      if (!boundaryMatch) return reject(new Error('No boundary in content-type'));
      const boundary = boundaryMatch[1].trim();
      const parts = [];
      const delimiter = Buffer.from('--' + boundary);

      let start = body.indexOf(delimiter) + delimiter.length + 2;
      while (true) {
        const end = body.indexOf(delimiter, start);
        if (end === -1) break;
        const part = body.slice(start, end - 2);
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) { start = end + delimiter.length + 2; continue; }
        const headerStr = part.slice(0, headerEnd).toString('utf-8');
        const content = part.slice(headerEnd + 4);
        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        if (nameMatch) {
          parts.push({
            fieldname: nameMatch[1],
            originalname: filenameMatch ? filenameMatch[1] : null,
            isFile: !!filenameMatch,
            buffer: content,
            value: filenameMatch ? null : content.toString('utf-8'),
          });
        }
        start = end + delimiter.length;
        if (body.slice(start, start + 2).toString() === '--') break;
        start += 2;
      }

      const fields = {};
      const files = [];
      for (const p of parts) {
        if (p.isFile) {
          files.push({ fieldname: p.fieldname, originalname: p.originalname, buffer: p.buffer });
        } else {
          fields[p.fieldname] = p.value;
        }
      }
      resolve({ fields, files });
    });
  });
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    const { fields, files: uploadedFiles } = await parseMultipart(req);
    const { fontId, dirName, name } = fields;

    if (!fontId || !dirName) {
      return res.status(400).json({ error: 'fontId and dirName are required' });
    }
    if (!uploadedFiles.length) {
      return res.status(400).json({ error: 'No font files uploaded' });
    }

    // Process uploaded font files
    const weightMap = {};
    const fontFiles = [];
    for (const file of uploadedFiles) {
      const ext = '.' + file.originalname.split('.').pop().toLowerCase();
      if (!['.woff2', '.woff', '.ttf', '.otf'].includes(ext)) continue;
      const info = detectWeightInfo(file.originalname);
      const key = `${info.weight}-${info.style}-${info.stretch}`;
      if (!weightMap[key]) weightMap[key] = { ...info, files: {} };
      const format = ext === '.woff2' ? 'woff2' : ext === '.woff' ? 'woff' : ext.slice(1);
      weightMap[key].files[format] = file.originalname;
      fontFiles.push({
        path: `fonts/${dirName}/${file.originalname}`,
        content: file.buffer.toString('base64'),
        encoding: 'base64',
      });
    }

    if (!fontFiles.length) {
      return res.status(400).json({ error: 'No valid font files found (.woff2, .woff, .ttf, .otf)' });
    }

    // Update CSS: read current styles.css and replace/add @font-face for this font
    const cssData = await readFile('styles.css');
    let css = cssData.content;
    const weights = Object.values(weightMap);

    // Build new @font-face rules for uploaded weights
    let newFontFaces = '';
    for (const w of weights) {
      const srcParts = [];
      if (w.files.woff2) srcParts.push(`url('fonts/${dirName}/${w.files.woff2}') format('woff2')`);
      if (w.files.woff) srcParts.push(`url('fonts/${dirName}/${w.files.woff}') format('woff')`);
      if (!srcParts.length && w.files.ttf) srcParts.push(`url('fonts/${dirName}/${w.files.ttf}') format('truetype')`);
      if (!srcParts.length && w.files.otf) srcParts.push(`url('fonts/${dirName}/${w.files.otf}') format('opentype')`);
      if (srcParts.length) {
        newFontFaces += `@font-face {\n    font-family: '${name || fontId}';\n    src: ${srcParts.join(',\n         ')};\n    font-weight: ${w.weight};\n    font-style: ${w.style};\n    font-display: swap;\n}\n\n`;
      }
    }

    // Remove existing @font-face blocks for this font's directory and re-add
    // Match @font-face blocks that reference this font's directory
    const fontFacePattern = new RegExp(
      `@font-face\\s*\\{[^}]*fonts/${dirName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^}]*\\}\\s*`,
      'g'
    );
    const existingBlocks = css.match(fontFacePattern) || [];

    if (existingBlocks.length > 0) {
      // Remove old blocks for weights we're replacing
      for (const w of weights) {
        const weightPattern = new RegExp(
          `@font-face\\s*\\{[^}]*fonts/${dirName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^}]*font-weight:\\s*${w.weight};[^}]*\\}\\s*`,
          'g'
        );
        css = css.replace(weightPattern, '');
      }
    }

    // Insert new @font-face blocks after the last existing @font-face for this font,
    // or after the last @font-face block in the file
    if (newFontFaces) {
      const lastFontFaceIdx = css.lastIndexOf('font-display: swap;\n}');
      if (lastFontFaceIdx >= 0) {
        const insertAt = css.indexOf('\n', lastFontFaceIdx + 20) + 1;
        css = css.slice(0, insertAt) + '\n' + newFontFaces + css.slice(insertAt);
      } else {
        css = newFontFaces + css;
      }
    }

    // Commit font files + updated CSS
    const filesToCommit = [
      ...fontFiles,
      { path: 'styles.css', content: css },
    ];

    const result = await commitFiles(filesToCommit, `Update font files: ${name || fontId}`, 'main');

    res.json({
      ok: true,
      message: `${fontFiles.length} file(s) uploaded for "${name || fontId}". Vercel will auto-deploy.`,
      commitSha: result.sha,
      files: fontFiles.map(f => f.path),
    });
  } catch (e) {
    console.error('Font update error:', e);
    res.status(500).json({ error: e.message });
  }
};
