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

function addEntryToJSObject(src, markerStr, newLine) {
  const markerIdx = src.indexOf(markerStr);
  if (markerIdx === -1) return src;
  const openBrace = src.indexOf('{', markerIdx);
  if (openBrace === -1) return src;
  let depth = 0;
  for (let i = openBrace; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        let lastContent = i - 1;
        while (lastContent > openBrace && /\s/.test(src[lastContent])) lastContent--;
        let comma = '';
        if (src[lastContent] !== ',' && src[lastContent] !== '{') comma = ',';
        return src.slice(0, lastContent + 1) + comma + '\n' + newLine + src.slice(lastContent + 1);
      }
    }
  }
  return src;
}

/**
 * Parse multipart/form-data from the raw request.
 * Returns { fields: {name: value}, files: [{fieldname, originalname, buffer}] }
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

      let start = body.indexOf(delimiter) + delimiter.length + 2; // skip \r\n
      while (true) {
        const end = body.indexOf(delimiter, start);
        if (end === -1) break;
        const part = body.slice(start, end - 2); // -2 for \r\n before delimiter
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
        if (body.slice(start, start + 2).toString() === '--') break; // end marker
        start += 2; // skip \r\n
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
    const { fontId, name, dirName, description, designer, version } = fields;
    const pricing = fields.pricing ? JSON.parse(fields.pricing) : [];

    if (!fontId || !name || !dirName) {
      return res.status(400).json({ error: 'fontId, name, and dirName are required' });
    }
    if (!uploadedFiles.length) {
      return res.status(400).json({ error: 'No font files uploaded' });
    }

    // Group files by weight
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

    const weights = Object.values(weightMap);
    if (!weights.length) {
      return res.status(400).json({ error: 'No valid font files found (.woff2, .woff, .ttf, .otf)' });
    }

    const defaultWeight = weights.find(w => w.weight === 400) || weights[0];
    const defaultFile = defaultWeight.files.woff2 || defaultWeight.files.woff || Object.values(defaultWeight.files)[0];
    const defaultFilePath = `fonts/${dirName}/${defaultFile}`;
    const isOneStyle = weights.length === 1;

    // Read current files from GitHub
    const [cssData, indexData, detailData, rendererData, scriptData, serverData] = await Promise.all([
      readFile('styles.css'),
      readFile('data/index-content.json'),
      readFile('data/typeface-detail-content.json'),
      readFile('typeface-detail-renderer.js'),
      readFile('script.js'),
      readFile('server.js'),
    ]);

    // 1. Update styles.css
    let css = cssData.content;
    let fontFaceCSS = `\n/* ${name} Font Faces */\n`;
    for (const w of weights) {
      const srcParts = [];
      if (w.files.woff2) srcParts.push(`url('fonts/${dirName}/${w.files.woff2}') format('woff2')`);
      if (w.files.woff) srcParts.push(`url('fonts/${dirName}/${w.files.woff}') format('woff')`);
      if (!srcParts.length && w.files.ttf) srcParts.push(`url('fonts/${dirName}/${w.files.ttf}') format('truetype')`);
      if (!srcParts.length && w.files.otf) srcParts.push(`url('fonts/${dirName}/${w.files.otf}') format('opentype')`);
      if (srcParts.length) {
        fontFaceCSS += `@font-face {\n    font-family: '${name}';\n    src: ${srcParts.join(',\n         ')};\n    font-weight: ${w.weight};\n    font-style: ${w.style};\n    font-display: swap;\n}\n\n`;
      }
    }
    const sampleRule = `.typeface-sample[data-font="${fontId}"] {\n    font-family: '${name}', sans-serif;\n}\n\n`;
    const lastFontFaceIdx = css.lastIndexOf('font-display: swap;\n}');
    if (lastFontFaceIdx >= 0) {
      const insertAt = css.indexOf('\n', lastFontFaceIdx + 20) + 1;
      css = css.slice(0, insertAt) + fontFaceCSS + css.slice(insertAt);
    } else {
      css = fontFaceCSS + css;
    }
    const sampleMatches = [...css.matchAll(/\.typeface-sample\[data-font="[^"]+"\]\s*\{[^}]+\}\n/g)];
    if (sampleMatches.length) {
      const lastMatch = sampleMatches[sampleMatches.length - 1];
      const insertAt = lastMatch.index + lastMatch[0].length;
      css = css.slice(0, insertAt) + '\n' + sampleRule + css.slice(insertAt);
    }

    // 2. Update index-content.json
    const indexContent = JSON.parse(indexData.content);
    const newIndexEntry = {
      id: fontId, name, displayName: name.replace(/^INDG\s+/i, ''),
      linkUrl: `${fontId}.html`, hasLink: true,
      dropdownType: isOneStyle ? '' : 'weight',
      fontSize: 120, letterSpacing: 0, isOneStyle,
    };
    if (!isOneStyle) {
      const sorted = [...weights].sort((a, b) => a.weight - b.weight);
      newIndexEntry.weights = sorted.map(w => w.weight);
      newIndexEntry.weightLabels = sorted.map(w => w.label);
      newIndexEntry.defaultWeight = defaultWeight.weight;
      newIndexEntry.defaultWeightIndex = newIndexEntry.weights.indexOf(defaultWeight.weight);
    }
    indexContent.push(newIndexEntry);

    // 3. Update typeface-detail-content.json
    const detailContent = JSON.parse(detailData.content);
    detailContent[fontId] = {
      description: description || '',
      details: {
        designer: designer || 'Iñigo Uriarte',
        version: version || '1.0',
        formats: 'TTF, WOFF, WOFF2',
        styles: String(weights.length),
        glyphs: '',
        unicodeRanges: ['Basic Latin', 'Latin 1-Supplement'],
      },
      samples: [{
        weight: defaultWeight.weight, fontSize: 120,
        text: 'The quick brown fox jumps over the lazy dog.',
        sampleId: defaultWeight.label.toLowerCase(),
      }],
      pricing,
      hasOpenType: false,
      openTypeFeatures: [],
    };

    // 4. Update typeface-detail-renderer.js
    let renderer = rendererData.content;
    renderer = addEntryToJSObject(renderer, 'var TYPEFACE_FONT_PATHS', `    ${fontId}: '${defaultFilePath}'`);

    // 5. Update script.js
    let script = scriptData.content;
    script = addEntryToJSObject(script, 'const fontFileMap', `    '${name}': '${defaultFilePath}'`);
    script = addEntryToJSObject(script, 'const fontFamilyMap', `        '${fontId}': '${name}'`);

    // 6. Update server.js
    let serverSrc = serverData.content;
    serverSrc = addEntryToJSObject(serverSrc, 'const TYPEFACE_FONT_DIRS', `    ${fontId}: '${dirName}'`);

    // Commit all files to GitHub
    const filesToCommit = [
      ...fontFiles,
      { path: 'styles.css', content: css },
      { path: 'data/index-content.json', content: JSON.stringify(indexContent, null, 2) + '\n' },
      { path: 'data/typeface-detail-content.json', content: JSON.stringify(detailContent, null, 2) + '\n' },
      { path: 'typeface-detail-renderer.js', content: renderer },
      { path: 'script.js', content: script },
      { path: 'server.js', content: serverSrc },
    ];

    const result = await commitFiles(filesToCommit, `Add font: ${name}`, 'main');

    res.json({
      ok: true,
      message: `Font "${name}" committed to GitHub. Vercel will auto-deploy.`,
      commitSha: result.sha,
    });
  } catch (e) {
    console.error('Font creation error:', e);
    res.status(500).json({ error: e.message });
  }
};
