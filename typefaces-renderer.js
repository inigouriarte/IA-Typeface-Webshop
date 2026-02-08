/**
 * Render typeface sections from configuration data
 */

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
            options += `<div class="dropdown-option${selected}" data-weight="${item.weight}" data-style="${item.style}">${item.label}</div>\n                            `;
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
    const nameElement = typeface.hasLink
        ? `<h2 class="typeface-name"><a href="${typeface.linkUrl}" style="text-decoration: none; color: inherit;">${typeface.displayName}</a></h2>`
        : `<h2 class="typeface-name">${typeface.displayName}</h2>`;

    const dropdownHtml = renderDropdownMenu(typeface);

    // Build style attribute for typeface sample
    let styleAttr = `font-size: ${typeface.fontSize}px; letter-spacing: ${typeface.letterSpacing}px;`;
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

    const sampleText = typeface.displayName.replace('INDG ', '').replace('Old English ', '');

    return `        <!-- ${typeface.name} -->
        <section class="typeface-section" data-font="${typeface.id}"${typeface.id === 'alvica' ? ' id="alvica"' : typeface.id === 'modus' ? ' id="modus"' : typeface.id === 'luara' ? ' id="luara"' : typeface.id === 'zigrid' ? ' id="zigrid"' : typeface.id === 'dale' ? ' id="dale"' : typeface.id === 'peqat' ? ' id="peqat"' : typeface.id === 'heron2' ? ' id="heron"' : typeface.id === 'naora' ? ' id="naora"' : typeface.id === 'sifora' ? ' id="sifora"' : typeface.id === 'oequadrat' ? ' id="oequadrat"' : ''}>
            <div class="typeface-controls-row">
                <div class="control-box">
                    ${nameElement}
                </div>
                <div class="control-box">
                    ${dropdownHtml}
                </div>
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label">10</span>
                        <input type="range" class="font-size-slider" min="10" max="400" value="${typeface.fontSize}" data-target="${typeface.id}">
                        <span class="control-label">400</span>
                    </div>
                </div>
                <div class="control-box">
                    <div class="slider-container">
                        <span class="control-label">-10</span>
                        <input type="range" class="letter-spacing-slider" min="-10" max="10" value="${typeface.letterSpacing}" data-target="${typeface.id}">
                        <span class="control-label">+10</span>
                    </div>
                </div>
                <div class="control-box">
                    ${typeface.hasLink 
                        ? `<a href="${typeface.linkUrl}" class="more-btn" style="text-decoration: none; display: flex; align-items: center;">
                        <span class="play-icon">▶</span>
                        <span>Much more</span>
                    </a>`
                        : `<button class="more-btn">
                        <span class="play-icon">▶</span>
                        <span>Much more</span>
                    </button>`
                    }
                </div>
            </div>
            <div class="typeface-sample" contenteditable="true" spellcheck="false" data-font="${typeface.id}" style="${styleAttr}">${sampleText}</div>
        </section>`;
}

/**
 * Render all typeface sections
 * @returns {string} HTML string for all typeface sections
 */
function renderAllTypefaces() {
    return typefacesConfig.map(typeface => renderTypefaceSection(typeface)).join('\n\n');
}

