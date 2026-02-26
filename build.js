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
const { renderTypefaceDetailPage } = require('./typeface-detail-renderer.js');

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
        const html = renderTypefaceDetailPage(typefaceId, config, detailConfig);
        const outFile = typefaceId === 'heron2' ? 'heron.html' : typefaceId + '.html';
        const outPath = path.join(ROOT, outFile);
        fs.writeFileSync(outPath, html, 'utf8');
        console.log('Built', outFile);
    }
}

function main() {
    buildIndex();
    buildDetailPages();
    console.log('Build complete.');
}

main();
