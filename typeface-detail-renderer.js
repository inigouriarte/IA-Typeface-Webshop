/**
 * Render typeface detail pages
 * Generates complete HTML for typeface detail pages
 */

/**
 * Single source for typeface id → font file path (for preload and OpenType feature detection).
 * Add one entry here when adding a new typeface so the dropdown shows only that font's features.
 */
var TYPEFACE_FONT_PATHS = {
    alvica: 'fonts/Alvica/INDGAlvica-Semibold.woff2',
    actio: 'fonts/Actio/INDGActio-RegularNormal.woff2',
    modus: 'fonts/Modus/INDGModus-Grey.woff2',
    luara: 'fonts/Luara/INDG Luara.woff2',
    dale: 'fonts/Dale/INDGDale-Regular.woff2',
    peqat: 'fonts/Peqat/INDGPeqat-Norma.woff2',
    heron2: 'fonts/Heron/INDGHeron-ST.woff2',
    naora: 'fonts/Naora/INDG Naora.woff2',
    sifora: 'fonts/Sifora/INDGSifora-Regular.woff2',
    zigrid: 'fonts/Zigrid/INDG Zigrid.woff2',
    oequadrat: 'fonts/Old English Quadrat/Old-English-Quadrat.woff2'
};

/**
 * Canonical order for OpenType features in the dropdown (ligatures → case → figures → alternates → stylistic sets → rest).
 */
var OPENTYPE_FEATURE_ORDER = [
    'liga', 'calt', 'clig', 'dlig',   // ligatures / contextual
    'smcp', 'c2sc',                    // case
    'onum', 'lnum', 'tnum', 'zero',   // figures
    'salt',                            // stylistic alternates
    'ss01', 'ss02', 'ss03', 'ss04', 'ss05', 'ss06', 'ss07', 'ss08', 'ss09', 'ss10', 'ss11', 'ss12', 'ss13', 'ss14', 'ss15', 'ss16', 'ss17', 'ss18', 'ss19', 'ss20'
];

/** Title-case a string but keep "INDG" unchanged. */
function toTitleCaseKeepINDG(str) {
    return str.split(' ').map(function (word) {
        return word === 'INDG' ? 'INDG' : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

function sortOpenTypeFeatures(features) {
    const order = OPENTYPE_FEATURE_ORDER;
    const orderIndex = (tag) => {
        const i = order.indexOf(tag);
        if (i >= 0) return i;
        const ss = /^ss(\d+)$/.exec(tag);
        if (ss) return 1000 + parseInt(ss[1], 10);
        return 2000;
    };
    return [...features].sort((a, b) => {
        const ia = orderIndex(a);
        const ib = orderIndex(b);
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b);
    });
}

/**
 * Render the OpenType features dropdown menu
 * @param {Array} features - Array of feature tags (shown in sensible order)
 * @returns {string} HTML string for OpenType dropdown
 */
function renderOpenTypeDropdown(features = []) {
    const list = features && features.length ? sortOpenTypeFeatures(features) : [];
    const options = list.map(feature =>
        `                            <div class="dropdown-option" data-feature="${feature}">${feature}</div>`
    ).join('\n');

    return `                <div class="control-box">
                    <div class="custom-dropdown opentype-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">OT features</span>
                        </button>
                        <div class="dropdown-menu opentype-menu">
${options}
                        </div>
                    </div>
                </div>`;
}

/**
 * Render a weight dropdown menu
 * @param {Array} weights - Array of weight values
 * @param {Array} labels - Array of weight labels
 * @param {number} selectedIndex - Index of selected weight
 * @returns {string} HTML string for weight dropdown
 */
function renderWeightDropdown(weights, labels, selectedIndex = 0) {
    const options = weights.map((weight, index) => {
        const selected = index === selectedIndex ? ' selected' : '';
        return `                            <div class="dropdown-option${selected}" data-value="${weight}">${labels[index]}</div>`;
    }).join('\n');

    return `                <div class="control-box">
                    <div class="custom-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">${labels[selectedIndex]}</span>
                        </button>
                        <div class="dropdown-menu">
${options}
                        </div>
                    </div>
                </div>`;
}

/**
 * Render a weight-stretch dropdown menu
 * @param {Array} weights - Array of weight-stretch objects
 * @param {number} selectedIndex - Index of selected option
 * @returns {string} HTML string for weight-stretch dropdown
 */
function renderWeightStretchDropdown(weights, selectedIndex = 0) {
    const options = weights.map((item, index) => {
        const selected = index === selectedIndex ? ' selected' : '';
        return `                            <div class="dropdown-option${selected}" data-weight="${item.weight}" data-stretch="${item.stretch}">${item.label}</div>`;
    }).join('\n');

    return `                <div class="control-box">
                    <div class="custom-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">${weights[selectedIndex].label}</span>
                        </button>
                        <div class="dropdown-menu">
${options}
                        </div>
                    </div>
                </div>`;
}

/**
 * Render a style dropdown menu
 * @param {Array} styles - Array of style objects
 * @param {number} selectedIndex - Index of selected style
 * @returns {string} HTML string for style dropdown
 */
function renderStyleDropdown(styles, selectedIndex = 0) {
    const options = styles.map((item, index) => {
        const selected = index === selectedIndex ? ' selected' : '';
        return `                            <div class="dropdown-option${selected}" data-weight="${item.weight}" data-style="${item.style}">${item.label}</div>`;
    }).join('\n');

    return `                <div class="control-box">
                    <div class="custom-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">${styles[selectedIndex].label}</span>
                        </button>
                        <div class="dropdown-menu">
${options}
                        </div>
                    </div>
                </div>`;
}

/**
 * Render a custom dropdown menu
 * @param {Array} options - Array of option objects
 * @param {number} selectedIndex - Index of selected option
 * @returns {string} HTML string for custom dropdown
 */
function renderCustomDropdown(options, selectedIndex = 0) {
    const optionHtml = options.map((item, index) => {
        const selected = index === selectedIndex ? ' selected' : '';
        return `                            <div class="dropdown-option${selected}" data-value="${item.value}">${item.label}</div>`;
    }).join('\n');

    return `                <div class="control-box">
                    <div class="custom-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">${options[selectedIndex].label}</span>
                        </button>
                        <div class="dropdown-menu">
${optionHtml}
                        </div>
                    </div>
                </div>`;
}

/**
 * Render a typeface sample section
 * @param {Object} config - Typeface configuration from typefaces-data.js
 * @param {Object} detailConfig - Detail configuration from typeface-detail-data.js
 * @param {Object} sample - Sample configuration
 * @param {number} sampleIndex - Index of the sample
 * @returns {string} HTML string for sample section
 */
function renderSampleSection(config, detailConfig, sample, sampleIndex) {
    // Determine dropdown type based on config
    let dropdownHtml = '';
    let defaultWeight = sample.weight || 400;
    let defaultStretch = sample.stretch || 'normal';
    let defaultStyle = sample.style || 'normal';
    let targetId = `${config.id}-${sample.sampleId || sampleIndex}`;

    if (config.dropdownType === 'weight') {
        dropdownHtml = renderWeightDropdown(config.weights, config.weightLabels, 
            config.weights.indexOf(defaultWeight) >= 0 ? config.weights.indexOf(defaultWeight) : 0);
    } else if (config.dropdownType === 'weight-stretch') {
        const matchIndex = config.weights.findIndex(w => w.weight === defaultWeight && w.stretch === defaultStretch);
        dropdownHtml = renderWeightStretchDropdown(config.weights, matchIndex >= 0 ? matchIndex : 0);
    } else if (config.dropdownType === 'style') {
        const matchIndex = config.styles.findIndex(s => s.weight === defaultWeight && s.style === defaultStyle);
        dropdownHtml = renderStyleDropdown(config.styles, matchIndex >= 0 ? matchIndex : 0);
    } else if (config.dropdownType === 'custom') {
        const matchIndex = config.options.findIndex(o => o.value === defaultWeight);
        dropdownHtml = renderCustomDropdown(config.options, matchIndex >= 0 ? matchIndex : 0);
    } else if (config.isOneStyle) {
        dropdownHtml = `                <div class="control-box">
                    <span class="one-style-text">One style</span>
                </div>`;
    }

    // Build style attribute
    let styleAttr = `font-size: ${sample.fontSize}px; letter-spacing: 0em;`;
    if (sample.weight) styleAttr += ` font-weight: ${sample.weight};`;
    if (sample.stretch) styleAttr += ` font-stretch: ${sample.stretch};`;
    if (sample.style) styleAttr += ` font-style: ${sample.style};`;

    // OpenType dropdown (always empty here; script.js detects from font so only this typeface's features appear)
    const openTypeHtml = renderOpenTypeDropdown([]);

    return `        <!-- ${sample.sampleId || 'Sample'} Section -->
        <section class="typeface-section" data-font="${config.id}">
            <div class="typeface-controls-row">
${dropdownHtml}
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label control-icon control-icon-size" aria-label="font size">Aa</span>
                        <input type="range" class="font-size-slider" min="10" max="400" value="${sample.fontSize}" data-target="${targetId}">
                    </div>
                </div>
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label control-icon control-icon-tracking" aria-label="tracking">T</span>
                        <input type="range" class="letter-spacing-slider" min="-0.1" max="0.1" step="0.005" value="0" data-target="${targetId}">
                    </div>
                </div>
                <div class="control-box capitalize-btn-box">
                    <button type="button" class="capitalize-btn" aria-label="Capitalize text">A</button>
                </div>
${openTypeHtml}
            </div>
            <div class="typeface-sample" contenteditable="true" spellcheck="false" data-font="${config.id}" data-sample="${sample.sampleId || sampleIndex}" data-target-match="${targetId}" style="${styleAttr}">${sample.text}</div>
        </section>`;
}

/**
 * Render the typeface details section
 * @param {Object} details - Details object
 * @returns {string} HTML string for details section
 */
function renderDetailsSection(details, openTypeFeatures) {
    const unicodeRanges = details.unicodeRanges.map(range => range).join('<br>\n                            ');

    return `        <!-- Typeface Details Section -->
        <section class="typeface-details">
            <h2 class="typeface-pricing-title">Typeface Data</h2>
            <div class="typeface-details-content">
                <!-- Column 1: Data category (labels) -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-label">Designer</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Styles</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Glyphs</div>
                    </div>
                </div>
                <!-- Column 2: Data input (values) -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-value">${details.designer}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${details.styles}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${details.glyphs}</div>
                    </div>
                </div>
                <!-- Column 3: Right-side labels (Unicode Ranges, OT features, Formats) -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-label">Unicode ranges</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">OT features</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Formats</div>
                    </div>
                </div>
                <!-- Column 4: Right-side values -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-value unicode-ranges">
                            ${unicodeRanges}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value detail-value-ot-features">—</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${details.formats}</div>
                    </div>
                </div>
            </div>
        </section>`;
}

/**
 * Render the pricing section
 * @param {Array} pricing - Array of pricing objects
 * @returns {string} HTML string for pricing section
 */
function renderPricingSection(pricing) {
    const pricingRows = pricing.map(item => 
        `                <div class="typeface-controls-row">
                    <div class="control-box">
                        <div class="pricing-name">${item.name}</div>
                    </div>
                    <div class="control-box">
                        <div class="price">${item.price}</div>
                    </div>
                </div>`
    ).join('\n');

    return `        <!-- Available Styles and Pricing -->
        <section class="typeface-pricing">
            <h2 class="typeface-pricing-title">Pricing</h2>
            <div class="pricing-content">
${pricingRows}
            </div>
        </section>`;
}

/**
 * Render a complete typeface detail page
 * @param {string} typefaceId - ID of the typeface
 * @param {Object} config - Typeface config from typefaces-data.js
 * @param {Object} detailConfig - Detail config from typeface-detail-data.js
 * @returns {string} Complete HTML string for the page
 */
function renderTypefaceDetailPage(typefaceId, config, detailConfig) {
    const title = `${config.displayName} - Indigo Alphabets®`;
    const fontFile = TYPEFACE_FONT_PATHS[typefaceId] || null;
    const preloadLink = fontFile ? `    <link rel="preload" href="${fontFile}" as="font" type="font/woff2" crossorigin>\n` : '';

    // Render all sample sections
    const sampleSections = detailConfig.samples.map((sample, index) => 
        renderSampleSection(config, detailConfig, sample, index)
    ).join('\n\n');

    // Render details and pricing
    const detailsSection = renderDetailsSection(detailConfig.details);
    const pricingSection = renderPricingSection(detailConfig.pricing);

    // OpenType.js needed on all detail pages so dropdown can show/detect features
    const openTypeScript = `    <script src="https://cdn.jsdelivr.net/npm/opentype.js@latest/dist/opentype.min.js" defer></script>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})();</script>
    <link rel="icon" type="image/png" sizes="32x32" href="favicon.png">
    <link rel="shortcut icon" href="favicon.png">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
${preloadLink}    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body class="typeface-${typefaceId === 'heron2' ? 'heron' : typefaceId}">
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <a href="index.html" class="logo">Indigo Alphabets®</a>
            <nav class="nav">
                <a href="index.html">Home</a>
                <a href="about.html">About</a>
                <a href="contact.html">Contact</a>
                <button type="button" class="theme-toggle" aria-label="Toggle dark mode">Dark</button>
            </nav>
        </div>
    </header>

    <!-- Typeface Hero Section -->
    <section class="typeface-hero">
        <div class="typeface-hero-content">
            <h1 class="typeface-title" contenteditable="true" spellcheck="false">${config.displayName}</h1>
            <div class="typeface-description">
                <p>${detailConfig.description}</p>
            </div>
            <div class="typeface-hero-buttons">
                <button class="test-btn">Test ${toTitleCaseKeepINDG(config.displayName)}</button>
                <button class="buy-btn">Purchase ${toTitleCaseKeepINDG(config.displayName)}</button>
            </div>
        </div>
    </section>

    <!-- Typeface Sections -->
    <main class="typeface-detail-container">
${sampleSections}

${detailsSection}

${pricingSection}
    </main>

    <!-- Test and Buy Buttons -->
    <div class="typeface-hero-buttons">
        <button class="test-btn">Test ${toTitleCaseKeepINDG(config.displayName)}</button>
        <button class="buy-btn">Purchase ${toTitleCaseKeepINDG(config.displayName)}</button>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-top">
            <a href="#top" class="back-to-top"><span class="back-to-top-arrow">▲</span> To top</a>
            <a href="licensing.html" class="footer-link">Licensing</a>
            <h3 class="typeface-list-heading">Typefaces</h3>
        </div>
        <div class="footer-content">
            <div class="typeface-columns">
                <div class="typeface-column">
                    <div><a href="alvica.html" style="text-decoration: none;">Alvica</a></div>
                    <div><a href="actio.html" style="text-decoration: none;">Actio</a></div>
                    <div><a href="modus.html" style="text-decoration: none;">Modus</a></div>
                    <div><a href="luara.html" style="text-decoration: none;">Luara</a></div>
                </div>
                <div class="typeface-column">
                    <div><a href="zigrid.html" style="text-decoration: none;">Zigrid</a></div>
                    <div><a href="dale.html" style="text-decoration: none;">Dale</a></div>
                    <div><a href="peqat.html" style="text-decoration: none;">Peqat</a></div>
                    <div><a href="heron.html" style="text-decoration: none;">Heron</a></div>
                </div>
                <div class="typeface-column">
                    <div><a href="naora.html" style="text-decoration: none;">Naora</a></div>
                    <div><a href="sifora.html" style="text-decoration: none;">Sifora</a></div>
                    <div><a href="oequadrat.html" style="text-decoration: none;">OE Quadrat</a></div>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <div class="copyright">
                <p>©2026 Indigo Alphabets</p>
            </div>
            <div class="footer-email">
                <p>hi@indigoindigo.org</p>
            </div>
            <div class="footer-social">
                <a href="https://instagram.com/indigo______indigo" class="footer-link" target="_blank">Follow me on IG</a>
            </div>
        </div>
    </footer>

    <!-- Fixed Bottom Bar -->
    <div class="bottom-bar">
        <div class="bottom-bar-content">
            <span class="bottom-bar-item" id="cursor-coords">X 0000 px Y 0000 px</span>
            <span class="bottom-bar-item" id="current-date">01.01.2026</span>
            <span class="bottom-bar-item" id="current-time">00.00.00</span>
            <span class="bottom-bar-item">52.5034°N 13.4698°E</span>
        </div>
    </div>

    <script>window.__TYPEFACE_FONT_PATHS__ = ${JSON.stringify(TYPEFACE_FONT_PATHS)};</script>
${openTypeScript}    <script src="script.js" defer></script>
</body>
</html>`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderSampleSection,
        renderDetailsSection,
        renderPricingSection,
        renderTypefaceDetailPage,
        renderOpenTypeDropdown,
        renderWeightDropdown,
        renderWeightStretchDropdown,
        renderStyleDropdown
    };
}

