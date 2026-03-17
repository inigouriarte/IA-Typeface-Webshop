const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const TYPEFACE_FONT_DIRS = require('./_font-dirs');

const LICENSE_TEXT = `TRIAL LICENSE — FOR TESTING PURPOSES ONLY

This font file is provided by Indigo Alphabets\u00AE for evaluation purposes only.
You may use this file to preview and test the typeface in your designs.

LIMITATIONS:
\u2022 This font may NOT be used in any commercial or published project.
\u2022 This font may NOT be distributed, shared, or sublicensed.
\u2022 This font may NOT be embedded in websites, applications, or documents intended for public distribution.
\u2022 This font may NOT be modified, decompiled, or reverse-engineered.

This trial version is intended solely for personal evaluation.
To use this typeface in any project, you must purchase a license.

Purchase a license at: https://indigoalphabets.com

\u00A9 Indigo Alphabets\u00AE — All rights reserved.
Contact: hi@indigoindigo.org
`;

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    var typefaceId = req.query.id || '';
    var style = req.query.style || '';

    var fontDirName = TYPEFACE_FONT_DIRS[typefaceId];
    if (!fontDirName) {
      return res.status(404).json({ error: 'Unknown typeface' });
    }

    var fontDir = path.join(process.cwd(), 'fonts', fontDirName);
    var allFiles;
    try {
      allFiles = fs.readdirSync(fontDir).filter(function (f) {
        return !f.startsWith('.');
      });
    } catch (e) {
      return res.status(500).json({ error: 'Font files not found' });
    }

    // Only include .ttf files for test downloads (most universal format)
    var ttfFiles = allFiles.filter(function (f) {
      return f.toLowerCase().endsWith('.ttf');
    });
    if (!ttfFiles.length) ttfFiles = allFiles;

    // Find the file matching the requested style
    var matchedFile = null;
    if (style) {
      // Normalize: "Bold Expanded" → "BoldExpanded", "Regular" → "Regular"
      var normalizedStyle = style.replace(/\s+/g, '');
      for (var i = 0; i < ttfFiles.length; i++) {
        var lower = ttfFiles[i].toLowerCase();
        if (lower.indexOf(normalizedStyle.toLowerCase()) !== -1) {
          matchedFile = ttfFiles[i];
          break;
        }
      }
    }

    // Fallback: use the first .ttf file
    if (!matchedFile) matchedFile = ttfFiles[0];
    if (!matchedFile) {
      return res.status(404).json({ error: 'No font file found' });
    }

    // Build ZIP
    var zipName = 'INDG-' + fontDirName.replace(/\s+/g, '-') + '-Trial.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + zipName + '"');

    var archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.file(path.join(fontDir, matchedFile), { name: 'fonts/' + matchedFile });
    archive.append(LICENSE_TEXT, { name: 'TRIAL-LICENSE.txt' });

    await archive.finalize();
  } catch (e) {
    console.error('Test download error:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
};
