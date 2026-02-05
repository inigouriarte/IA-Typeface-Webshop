/**
 * Render typeface detail pages
 * Generates complete HTML for typeface detail pages
 */

/**
 * Render the OpenType features dropdown menu
 * @param {Array} features - Array of feature tags
 * @returns {string} HTML string for OpenType dropdown
 */
function renderOpenTypeDropdown(features = []) {
    if (!features || features.length === 0) {
        return '';
    }

    const options = features.map(feature => 
        `                            <div class="dropdown-option" data-feature="${feature}">${feature}</div>`
    ).join('\n');

    return `                <div class="control-box">
                    <div class="custom-dropdown opentype-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">Opentype Features</span>
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
    let styleAttr = `font-size: ${sample.fontSize}px; letter-spacing: 0px;`;
    if (sample.weight) styleAttr += ` font-weight: ${sample.weight};`;
    if (sample.stretch) styleAttr += ` font-stretch: ${sample.stretch};`;
    if (sample.style) styleAttr += ` font-style: ${sample.style};`;

    // OpenType dropdown
    const openTypeHtml = detailConfig.hasOpenType ? renderOpenTypeDropdown(detailConfig.openTypeFeatures) : '';

    return `        <!-- ${sample.sampleId || 'Sample'} Section -->
        <section class="typeface-section" data-font="${config.id}">
            <div class="typeface-controls-row">
${dropdownHtml}
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label">10</span>
                        <input type="range" class="font-size-slider" min="10" max="400" value="${sample.fontSize}" data-target="${targetId}">
                        <span class="control-label">400</span>
                    </div>
                </div>
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label">-10</span>
                        <input type="range" class="letter-spacing-slider" min="-10" max="10" value="0" data-target="${targetId}">
                        <span class="control-label">+10</span>
                    </div>
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
function renderDetailsSection(details) {
    const unicodeRanges = details.unicodeRanges.map(range => range).join('<br>\n                            ');

    return `        <!-- Typeface Details Section -->
        <section class="typeface-details">
            <div class="typeface-details-content">
                <!-- Column 1: Data category (labels) -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-label">Designer</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Version</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Formats</div>
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
                        <div class="detail-value">${details.version}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${details.formats}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${details.styles}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${details.glyphs}</div>
                    </div>
                </div>
                <!-- Column 3: "Unicode Ranges" title -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-label">Unicode Ranges</div>
                    </div>
                </div>
                <!-- Column 4: Unicode ranges content -->
                <div class="details-column">
                    <div class="detail-item">
                        <div class="detail-value unicode-ranges">
                            ${unicodeRanges}
                        </div>
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
    const fontFile = typefaceId === 'alvica' ? 'fonts/Alvica/INDGAlvica-Semibold.woff2' : 
                     typefaceId === 'actio' ? 'fonts/Actio/INDGActio-RegularNormal.woff2' :
                     typefaceId === 'modus' ? 'fonts/Modus/INDGModus-Grey.woff2' :
                     typefaceId === 'luara' ? 'fonts/Luara/INDG Luara.woff2' :
                     typefaceId === 'dale' ? 'fonts/Dale/INDGDale-Regular.woff2' :
                     typefaceId === 'peqat' ? 'fonts/Peqat/INDGPeqat-Norma.woff2' :
                     typefaceId === 'heron2' ? 'fonts/Heron/INDGHeron-ST.woff2' :
                     typefaceId === 'naora' ? 'fonts/Naora/INDG Naora.woff2' :
                     typefaceId === 'sifora' ? 'fonts/Sifora/INDGSifora-Regular.woff2' :
                     typefaceId === 'zigrid' ? 'fonts/Zigrid/INDG Zigrid.woff2' :
                     typefaceId === 'oequadrat' ? 'fonts/Old English Quadrat/Old-English-Quadrat.woff2' : null;

    const preloadLink = fontFile ? `    <link rel="preload" href="${fontFile}" as="font" type="font/woff2" crossorigin>\n` : '';

    // Render all sample sections
    const sampleSections = detailConfig.samples.map((sample, index) => 
        renderSampleSection(config, detailConfig, sample, index)
    ).join('\n\n');

    // Render details and pricing
    const detailsSection = renderDetailsSection(detailConfig.details);
    const pricingSection = renderPricingSection(detailConfig.pricing);

    // Determine if OpenType.js is needed
    const openTypeScript = detailConfig.hasOpenType ? 
        `    <!-- OpenType.js library for font feature detection -->
    <script src="https://cdn.jsdelivr.net/npm/opentype.js@latest/dist/opentype.min.js"></script>
    ` : '';

    // Determine if Supabase is needed (for now, all pages can have it)
    const supabaseScripts = `    <!-- Supabase client library -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <!-- Supabase configuration -->
    <script src="supabase-config.js"></script>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="favicon.png">
    <link rel="shortcut icon" href="favicon.png">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${preloadLink}    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo">Indigo Alphabets®</div>
            <nav class="nav">
                <a href="index.html">Home</a>
                <a href="about.html">About</a>
                <a href="contact.html">Contact</a>
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
                <button class="test-btn">TEST IT</button>
                <button class="buy-btn">BUY IT</button>
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
        <button class="test-btn">TEST IT</button>
        <button class="buy-btn">BUY IT</button>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-top">
            <a href="#top" class="back-to-top">▲ Back to top</a>
            <a href="#licensing" class="footer-link">Licensing</a>
            <h3 class="typeface-list-heading">Typefaces</h3>
        </div>
        <div class="footer-content">
            <div class="typeface-columns">
                <div class="typeface-column">
                    <div><a href="alvica.html" style="text-decoration: none; color: var(--color-text-light);">Alvica</a></div>
                    <div>Actio</div>
                    <div>Modus</div>
                    <div>Luara</div>
                </div>
                <div class="typeface-column">
                    <div>Zigrid</div>
                    <div>Dale</div>
                    <div>Peqat</div>
                    <div>Heron</div>
                </div>
                <div class="typeface-column">
                    <div>Naora</div>
                    <div>Sifora</div>
                    <div>OE Quadrat</div>
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

${openTypeScript}${supabaseScripts}    <script src="script.js"></script>
</body>
</html>`;
}

