/**
 * Shared typeface ID → font directory mapping.
 * Used by api/download/[token].js and api/admin/stats.js.
 * When adding a new font via api/admin/fonts (POST), this file
 * is also committed to GitHub so the mapping stays in sync.
 */
const TYPEFACE_FONT_DIRS = {
  alvica: 'Alvica',
  actio: 'Actio',
  modus: 'Modus',
  luara: 'Luara',
  dale: 'Dale',
  peqat: 'Peqat',
  heron2: 'Heron',
  naora: 'Naora',
  sifora: 'Sifora',
  zigrid: 'Zigrid',
  stycka: 'Stycka',
  oequadrat: 'Old English Quadrat',
  Test: 'INDIG Test',
};

module.exports = TYPEFACE_FONT_DIRS;
