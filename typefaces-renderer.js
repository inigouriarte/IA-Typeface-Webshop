/**
 * Render typeface sections from configuration data
 */

var typefacesConfig = (function () {
    if (typeof require !== 'undefined') try { return require('./typefaces-data.js').typefacesConfig; } catch (e) {}
    if (typeof window !== 'undefined' && window.typefacesConfig) return window.typefacesConfig;
    return [];
})();

/**
 * Render a dropdown menu based on typeface configuration
 * @param {Object} typeface - Typeface configuration object
 * @returns {string} HTML string for dropdown menu
 */
function renderDropdownMenu(typeface) {
    if (typeface.isOneStyle) {
        return '<span class="one-style-text">One style</span>';
    }

    let options = '';
    let defaultLabel = '';

    if (typeface.dropdownType === 'weight') {
        typeface.weights.forEach((weight, index) => {
            const selected = index === typeface.defaultWeightIndex ? ' selected' : '';
            options += `<div class="dropdown-option${selected}" data-value="${weight}">${typeface.weightLabels[index]}</div>\n                            `;
            if (selected) defaultLabel = typeface.weightLabels[index];
        });
    } else if (typeface.dropdownType === 'weight-stretch') {
        typeface.weights.forEach((item, index) => {
            const selected = index === typeface.defaultStyleIndex ? ' selected' : '';
            options += `<div class="dropdown-option${selected}" data-weight="${item.weight}" data-stretch="${item.stretch}">${item.label}</div>\n                            `;
            if (selected) defaultLabel = item.label;
        });
    } else if (typeface.dropdownType === 'style') {
        typeface.styles.forEach((item, index) => {
            const selected = index === typeface.defaultStyleIndex ? ' selected' : '';
            const familyAttr = item.family ? ` data-family="${item.family}"` : '';
            options += `<div class="dropdown-option${selected}" data-weight="${item.weight}" data-style="${item.style}"${familyAttr}>${item.label}</div>\n                            `;
            if (selected) defaultLabel = item.label;
        });
    } else if (typeface.dropdownType === 'custom') {
        typeface.options.forEach((item, index) => {
            const selected = index === typeface.defaultOptionIndex ? ' selected' : '';
            options += `<div class="dropdown-option${selected}" data-value="${item.value}">${item.label}</div>\n                            `;
            if (selected) defaultLabel = item.label;
        });
    }

    return `<div class="custom-dropdown">
                        <button class="dropdown-trigger" type="button">
                            <span class="dropdown-arrow">▼</span>
                            <span class="dropdown-selected">${defaultLabel}</span>
                        </button>
                        <div class="dropdown-menu">
                            ${options.trim()}
                        </div>
                    </div>`;
}

/**
 * Render a typeface section
 * @param {Object} typeface - Typeface configuration object
 * @returns {string} HTML string for typeface section
 */
function renderTypefaceSection(typeface) {
    const cleanUrl = typeface.linkUrl ? '/' + typeface.linkUrl.replace(/\.html$/, '') : '';
    const nameElement = typeface.hasLink
        ? `<h2 class="typeface-name"><a href="${cleanUrl}" style="text-decoration: none; color: inherit;">${typeface.displayName}</a></h2>`
        : `<h2 class="typeface-name">${typeface.displayName}</h2>`;

    const dropdownHtml = renderDropdownMenu(typeface);

    // Build style attribute for typeface sample
    let styleAttr = `font-size: ${typeface.fontSize}px; letter-spacing: ${typeface.letterSpacing}em;`;
    if (typeface.fontWeight) {
        styleAttr += ` font-weight: ${typeface.fontWeight};`;
    }
    if (typeface.defaultWeight) {
        styleAttr += ` font-weight: ${typeface.defaultWeight};`;
    } else if (typeface.dropdownType === 'weight-stretch' && typeface.weights[typeface.defaultStyleIndex]) {
        styleAttr += ` font-weight: ${typeface.weights[typeface.defaultStyleIndex].weight}; font-stretch: ${typeface.weights[typeface.defaultStyleIndex].stretch};`;
    } else if (typeface.dropdownType === 'style' && typeface.styles[typeface.defaultStyleIndex]) {
        styleAttr += ` font-weight: ${typeface.styles[typeface.defaultStyleIndex].weight}; font-style: ${typeface.styles[typeface.defaultStyleIndex].style};`;
    } else if (typeface.dropdownType === 'custom' && typeface.options[typeface.defaultOptionIndex]) {
        styleAttr += ` font-weight: ${typeface.options[typeface.defaultOptionIndex].value};`;
    }

    const sampleText = typeface.sampleText || typeface.displayName.replace('INDG ', '').replace('Old English ', '');

    // Mobile data attributes
    let mobileDataAttrs = '';
    if (typeface.fontSizeMobile) mobileDataAttrs += ` data-font-size-mobile="${typeface.fontSizeMobile}"`;
    if (typeface.letterSpacingMobile != null && typeface.letterSpacingMobile !== '') mobileDataAttrs += ` data-letter-spacing-mobile="${typeface.letterSpacingMobile}"`;

    return `        <!-- ${typeface.name} -->
        <section class="typeface-section" data-font="${typeface.id}"${typeface.id === 'alvica' ? ' id="alvica"' : typeface.id === 'modus' ? ' id="modus"' : typeface.id === 'luara' ? ' id="luara"' : typeface.id === 'zigrid' ? ' id="zigrid"' : typeface.id === 'dale' ? ' id="dale"' : typeface.id === 'peqat' ? ' id="peqat"' : typeface.id === 'heron2' ? ' id="heron"' : typeface.id === 'naora' ? ' id="naora"' : typeface.id === 'sifora' ? ' id="sifora"' : typeface.id === 'stycka' ? ' id="stycka"' : typeface.id === 'oequadrat' ? ' id="oequadrat"' : ''}>
            <div class="typeface-controls-row">
                <div class="control-box">
                    ${nameElement}
                </div>
                <div class="control-box">
                    ${dropdownHtml}
                </div>
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label control-icon control-icon-size" aria-label="font size">Aa</span>
                        <input type="range" class="font-size-slider" min="10" max="400" value="${typeface.fontSize}" data-target="${typeface.id}">
                    </div>
                </div>
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label control-icon control-icon-tracking" aria-label="tracking">T</span>
                        <input type="range" class="letter-spacing-slider" min="-0.1" max="0.1" step="0.005" value="${typeface.letterSpacing}" data-target="${typeface.id}">
                    </div>
                </div>
                <div class="control-box capitalize-btn-box">
                    <button type="button" class="capitalize-btn" aria-label="Capitalize text">Aa</button>
                </div>
                <div class="control-box">
                    ${typeface.hasLink
                        ? `<a href="${cleanUrl}" class="more-btn" draggable="false">
                        <span class="play-icon">▶</span>
                        <span class="more-btn-full">Explore ${typeface.displayName || typeface.name}</span><span class="more-btn-short">Explore</span>
                    </a>`
                        : `<button type="button" class="more-btn" draggable="false">
                        <span class="play-icon">▶</span>
                        <span class="more-btn-full">Explore ${typeface.displayName || typeface.name}</span><span class="more-btn-short">Explore</span>
                    </button>`
                    }
                </div>
            </div>
            <div class="typeface-sample" contenteditable="true" spellcheck="false" data-font="${typeface.id}"${mobileDataAttrs} style="${styleAttr}">${sampleText}</div>
        </section>`;
}

/**
 * Render all typeface sections
 * @param {Array} [config] - Optional typefaces config (uses typefacesConfig if not provided)
 * @returns {string} HTML string for all typeface sections
 */
function renderAllTypefaces(config) {
    const c = config || typefacesConfig;
    return c.map(typeface => renderTypefaceSection(typeface)).join('\n\n');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderTypefaceSection, renderAllTypefaces, renderDropdownMenu };
}

