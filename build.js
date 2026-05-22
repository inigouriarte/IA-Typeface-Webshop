/**
 * Build script to generate HTML files from components
 * Run with: node build.js
 *
 * Reads content from data/index-content.json and data/typeface-detail-content.json
 * (the same files the admin panel edits). Run after saving in the admin to regenerate the site.
 *
 * - Injects typeface sections into index.html
 * - Generates typeface detail pages (alvica.html, actio.html, ...)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_JSON = path.join(DATA_DIR, 'index-content.json');
const DETAIL_JSON = path.join(DATA_DIR, 'typeface-detail-content.json');
const PAGES_JSON = path.join(DATA_DIR, 'page-content.json');
const STYLES_JSON = path.join(DATA_DIR, 'styles.json');

function loadJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('Missing ' + filePath + '. Create it or save from the admin panel first.');
        process.exit(1);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Invalid JSON in ' + filePath + ': ' + e.message);
        process.exit(1);
    }
}

const typefacesConfig = loadJson(INDEX_JSON);
if (!Array.isArray(typefacesConfig)) {
    console.error(INDEX_JSON + ' must be a JSON array.');
    process.exit(1);
}

const typefaceDetailConfig = loadJson(DETAIL_JSON);
if (typeof typefaceDetailConfig !== 'object' || typefaceDetailConfig === null || Array.isArray(typefaceDetailConfig)) {
    console.error(DETAIL_JSON + ' must be a JSON object (id -> detail config).');
    process.exit(1);
}

const { renderAllTypefaces } = require('./typefaces-renderer.js');
const { renderTypefaceDetailPage, generateFooterColumns } = require('./typeface-detail-renderer.js');

function buildIndex() {
    const indexPath = path.join(ROOT, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    const typefacesHtml = renderAllTypefaces(typefacesConfig);
    const mainRegex = /<main class="typefaces-container" id="typefaces">[\s\S]*?<\/main>/;
    if (!mainRegex.test(html)) {
        console.error('Build: could not find <main id="typefaces"> in index.html');
        process.exit(1);
    }
    html = html.replace(mainRegex, '<main class="typefaces-container" id="typefaces">\n' + typefacesHtml + '\n    </main>');

    // Update footer with dynamic font list
    const footerColumnsRegex = /<div class="typeface-columns">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(<div class="footer-bottom">)/;
    if (footerColumnsRegex.test(html)) {
        const columns = generateFooterColumns(typefacesConfig, 'text-decoration: none; color: inherit;');
        html = html.replace(footerColumnsRegex, '<div class="typeface-columns">\n' + columns + '\n            </div>\n        </div>\n        $1');
        console.log('Built index.html (footer updated)');
    }

    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Built index.html (typeface sections injected)');
}

function buildDetailPages() {
    const detailIds = Object.keys(typefaceDetailConfig);
    for (const typefaceId of detailIds) {
        const config = typefacesConfig.find(c => c.id === typefaceId);
        if (!config) {
            console.warn('Build: no typefacesConfig for', typefaceId, '- skipping');
            continue;
        }
        const detailConfig = typefaceDetailConfig[typefaceId];
        const html = renderTypefaceDetailPage(typefaceId, config, detailConfig, typefacesConfig);
        const outFile = typefaceId === 'heron2' ? 'heron.html' : typefaceId + '.html';
        const outPath = path.join(ROOT, outFile);
        fs.writeFileSync(outPath, html, 'utf8');
        console.log('Built', outFile);
    }
}

function buildStaticPages() {
    const staticPages = ['about.html', 'contact.html', 'licensing.html', 'privacy-policy.html', 'impressum.html', 'agb.html', 'widerruf.html', 'success.html'];
    const footerColumnsRegex = /<div class="typeface-columns">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(<div class="footer-bottom">)/;
    const columns = generateFooterColumns(typefacesConfig);

    // Load page content for text injection
    let pageContent = {};
    if (fs.existsSync(PAGES_JSON)) {
        try { pageContent = JSON.parse(fs.readFileSync(PAGES_JSON, 'utf8')); } catch (e) { /* ignore */ }
    }

    for (const page of staticPages) {
        const pagePath = path.join(ROOT, page);
        if (!fs.existsSync(pagePath)) continue;
        let html = fs.readFileSync(pagePath, 'utf8');
        if (footerColumnsRegex.test(html)) {
            html = html.replace(footerColumnsRegex, '<div class="typeface-columns">\n' + columns + '\n            </div>\n        </div>\n        $1');
        }

        // Inject page content from page-content.json
        const aboutTextRegex = /<div class="about-text"[^>]*>[\s\S]*?<\/div>/;
        const contentMap = {
            'licensing.html': 'licensing',
            'privacy-policy.html': 'privacyPolicy',
            'impressum.html': 'impressum',
            'agb.html': 'agb',
            'widerruf.html': 'widerruf',
        };
        const contentKey = contentMap[page];
        if (contentKey && pageContent[contentKey]) {
            const section = pageContent[contentKey];
            // Only the numbered string paragraphs (paragraph1, paragraph2, ...). The admin also
            // stores a "paragraphs" array of objects for round-tripping; including it here would
            // stringify the objects into "[object Object],[object Object],..." in the output.
            const paraKeys = Object.keys(section)
                .filter(k => /^paragraph\d+$/.test(k))
                .sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10));
            const paras = paraKeys.map(k => section[k]).filter(Boolean).map(p => `                <p>${p}</p>`).join('\n');
            if (paras) {
                html = html.replace(aboutTextRegex, `<div class="about-text" contenteditable="true" spellcheck="false">\n${paras}\n            </div>`);
            }
        }

        fs.writeFileSync(pagePath, html, 'utf8');
        console.log('Built', page);
    }
}

// Build a CSS string of variable overrides from data/styles.json (admin "Styles" editor).
// Only colour values are applied (the explicit purpose of the colour editor); each is
// validated as a #RRGGBB hex so a malformed value can never break the page.
function buildThemeOverrideCss() {
    if (!fs.existsSync(STYLES_JSON)) return '';
    let styles;
    try { styles = JSON.parse(fs.readFileSync(STYLES_JSON, 'utf8')); } catch (e) { return ''; }
    if (!styles || typeof styles !== 'object' || Array.isArray(styles)) return '';

    const isHex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim());
    const lightMap = {
        colorPrimary: '--color-primary',
        colorText: '--color-text',
        colorBackground: '--color-background',
        colorStroke: '--color-stroke',
        colorFooter: '--color-footer-background',
    };
    const darkMap = {
        darkPrimary: '--color-primary',
        darkText: '--color-text',
        darkBackground: '--color-background',
        darkStroke: '--color-stroke',
    };
    const decls = map => Object.entries(map)
        .filter(([key]) => isHex(styles[key]))
        .map(([key, cssVar]) => `${cssVar}: ${styles[key].trim()};`)
        .join('');

    const light = decls(lightMap);
    const dark = decls(darkMap);
    let css = '';
    if (light) css += `:root{${light}}`;
    if (dark) css += `html[data-theme="dark"]{${dark}}`;
    return css;
}

// Inject (or refresh/clear) the theme override <style> in every built HTML page so the
// colours saved from the admin "Styles" editor actually take effect on the deployed site.
function applyThemeOverrides() {
    const css = buildThemeOverrideCss();
    const existingRe = /\n?\s*<style id="theme-overrides">[\s\S]*?<\/style>/;
    const block = css ? `\n    <style id="theme-overrides">${css}</style>` : '';

    const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== 'admin.html');
    let count = 0;
    for (const file of htmlFiles) {
        const p = path.join(ROOT, file);
        let html = fs.readFileSync(p, 'utf8');
        if (!/<\/head>/.test(html)) continue;
        const next = html.replace(existingRe, '').replace('</head>', `${block}\n</head>`);
        if (next !== html) { fs.writeFileSync(p, next, 'utf8'); count++; }
    }
    console.log(css ? `Applied theme overrides to ${count} page(s)` : `Cleared theme overrides (no styles.json colours)`);
}

function main() {
    buildIndex();
    buildDetailPages();
    buildStaticPages();
    applyThemeOverrides();
    console.log('Build complete.');
}

main();
