const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const TYPEFACE_FONT_DIRS = require('./_font-dirs');

const TRIAL_LICENSE_TEXT = `FOR TESTING PURPOSES ONLY

This font file is provided by Indigo Alphabets\u00AE for evaluation purposes only.
You may use this file to preview and test the typeface in your designs.

LIMITATIONS:
\u2022 This font may NOT be used in any commercial or published project.
\u2022 This font may NOT be distributed, shared, or sublicensed.
\u2022 This font may NOT be embedded in websites, applications, or documents intended for public distribution.
\u2022 This font may NOT be modified, decompiled, or reverse-engineered.

This trial version is intended solely for personal evaluation.
To use this typeface in any project, you must purchase a license.

Purchase a license at: https://alphabets.indigoindigo.org

Contact: hi@indigoindigo.org
`;

const FREE_LICENSE_TEXT = `FREE LICENSE

This typeface is provided by Indigo Alphabets\u00AE free of charge.
You may use this typeface in personal and commercial projects.

CONDITIONS:
\u2022 This typeface may NOT be sold or sublicensed.
\u2022 This typeface may NOT be modified, decompiled, or reverse-engineered.
\u2022 Attribution to Indigo Alphabets\u00AE is appreciated but not required.

For more information: https://indigoalphabets.com

\u00A9 Indigo Alphabets\u00AE — All rights reserved.
Contact: hi@indigoindigo.org
`;

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    var typefaceId = req.query.id || '';
    var style = req.query.style || '';
    var mode = req.query.mode || '';

    var fontDirName = TYPEFACE_FONT_DIRS[typefaceId];
    if (!fontDirName) {
      return res.status(404).json({ error: 'Unknown typeface' });
    }

    // Free download mode: verify typeface is actually free
    if (mode === 'free') {
      try {
        var detailPath = path.join(process.cwd(), 'data', 'typeface-detail-content.json');
        var detailData = JSON.parse(fs.readFileSync(detailPath, 'utf8'));
        if (!detailData[typefaceId] || !detailData[typefaceId].isFree) {
          return res.status(403).json({ error: 'This typeface is not available for free download' });
        }
      } catch (e) {
        return res.status(500).json({ error: 'Could not verify typeface status' });
      }
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

    if (mode === 'free') {
      // Free download: include ALL font files
      var zipName = 'INDG-' + fontDirName.replace(/\s+/g, '-') + '-Free.zip';
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="' + zipName + '"');

      var archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (var i = 0; i < allFiles.length; i++) {
        archive.file(path.join(fontDir, allFiles[i]), { name: 'fonts/' + allFiles[i] });
      }
      archive.append(FREE_LICENSE_TEXT, { name: 'LICENSE.txt' });

      await archive.finalize();
    } else {
      // Trial download: all .ttf files in the family
      var ttfFiles = allFiles.filter(function (f) {
        return f.toLowerCase().endsWith('.ttf');
      });
      if (!ttfFiles.length) ttfFiles = allFiles;

      if (!ttfFiles.length) {
        return res.status(404).json({ error: 'No font file found' });
      }

      var zipName = 'INDG-' + fontDirName.replace(/\s+/g, '-') + '-Test.zip';
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="' + zipName + '"');

      var archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (var j = 0; j < ttfFiles.length; j++) {
        archive.file(path.join(fontDir, ttfFiles[j]), { name: 'fonts/' + ttfFiles[j] });
      }
      archive.append(TRIAL_LICENSE_TEXT, { name: 'Test-License.txt' });

      await archive.finalize();
    }
  } catch (e) {
    console.error('Test download error:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
};
