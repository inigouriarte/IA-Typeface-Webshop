/**
 * Initialize slider functionality
 * @param {string} selector - CSS selector for sliders
 * @param {string} styleProperty - CSS style property to update (e.g., 'fontSize', 'letterSpacing')
 * @param {string} defaultDefaultValue - Default value if not specified in HTML
 * @param {string} [unit='px'] - Unit for the value (e.g. 'px', 'em'). Use 'em' for letterSpacing so it scales with font size.
 */
function initializeSliders(selector, styleProperty, defaultDefaultValue, unit) {
    var u = (unit === undefined || unit === null) ? 'px' : unit;
    document.querySelectorAll(selector).forEach(slider => {
        const defaultValue = slider.getAttribute('value') || defaultDefaultValue;
        let previousValue = slider.value;
        let mouseDownTime = 0;
        let hasMoved = false;
        
        function findSample() {
            const section = slider.closest('.typeface-section');
            let sample = section ? section.querySelector('.typeface-sample') : null;
            if (!sample) {
                const target = slider.getAttribute('data-target');
                sample = document.querySelector(`.typeface-sample[data-font="${target}"]`);
            }
            return sample;
        }
        
        slider.addEventListener('input', function() {
            const sample = findSample();
            if (sample) {
                sample.style[styleProperty] = this.value + u;
            }
        });
        
        slider.addEventListener('mousedown', function(e) {
            previousValue = this.value;
            mouseDownTime = Date.now();
            hasMoved = false;
        });
        
        slider.addEventListener('mousemove', function(e) {
            if (mouseDownTime > 0) {
                hasMoved = true;
            }
        });
        
        slider.addEventListener('mouseup', function(e) {
            const clickDuration = Date.now() - mouseDownTime;
            if (clickDuration < 200 && !hasMoved && Math.abs(parseFloat(this.value) - parseFloat(previousValue)) < (u === 'em' ? 0.02 : 5)) {
                const sample = findSample();
                if (sample) {
                    this.value = defaultValue;
                    sample.style[styleProperty] = defaultValue + u;
                }
            }
            mouseDownTime = 0;
            hasMoved = false;
        });
    });
}

// Initialize font size sliders
initializeSliders('.font-size-slider', 'fontSize', '120');

// Initialize letter spacing sliders (em = relative to font size)
initializeSliders('.letter-spacing-slider', 'letterSpacing', '0', 'em');

// --- Typeface dropdown: portal-based (menu rendered at body so never clipped, backdrop always works) ---
(function() {
    var portal = null;
    var currentOpen = null; // { dropdown, menu } when a typeface dropdown is open

    /**
     * Dropdown portal alignment – one config per style (font weight) type only. Edit here to tune alignment.
     * Opentype is positioned separately and not affected by this config.
     */
    var DROPDOWN_PORTAL_ALIGN = {
        styleHomepageFirst: { leftOffset: -1, widthDelta: 1, align: 'left' },
        styleHomepageRest:  { leftOffset: -1, widthDelta: 1, align: 'left' },
        styleDetail:        { leftOffset: 0, widthDelta: 0, align: 'left' }
    };

    function getPortal() {
        if (!portal) {
            portal = document.createElement('div');
            portal.id = 'dropdown-portal';
            document.body.appendChild(portal);
        }
        return portal;
    }

    function isTypefaceDropdown(dropdown) {
        return dropdown && dropdown.closest && dropdown.closest('.typeface-section') !== null;
    }

    function getDropdownPortalType(dropdown) {
        if (dropdown.classList.contains('opentype-dropdown')) return 'opentype';
        var main = dropdown.closest('main');
        var section = dropdown.closest('.typeface-section');
        var isHomepage = main && main.classList.contains('typefaces-container');
        var isFirstSection = main && section && section === main.querySelector('.typeface-section');
        if (isHomepage && isFirstSection) return 'styleHomepageFirst';
        if (isHomepage) return 'styleHomepageRest';
        return 'styleDetail';
    }

    /** OpenType dropdown: fixed positioning, detached from DROPDOWN_PORTAL_ALIGN. */
    function positionOpenTypeDropdownInPortal(menu, trigger) {
        if (!menu || !trigger) return;
        var r = trigger.getBoundingClientRect();
        var w = r.width - 1;
        menu.style.top = r.bottom + 'px';
        menu.style.width = (w + 2) + 'px';
        menu.style.left = (r.right - w - 2) + 'px';
    }

    function positionMenuInPortal(menu, trigger, dropdown) {
        if (!menu || !trigger || !dropdown) return;
        if (dropdown.classList.contains('opentype-dropdown')) {
            positionOpenTypeDropdownInPortal(menu, trigger);
            return;
        }
        var type = getDropdownPortalType(dropdown);
        var c = DROPDOWN_PORTAL_ALIGN[type] || DROPDOWN_PORTAL_ALIGN.styleDetail;
        var r = trigger.getBoundingClientRect();
        var w = r.width - 1 + (c.widthDelta || 0);
        menu.style.top = r.bottom + 'px';
        menu.style.width = w + 'px';
        menu.style.left = (r.left + (c.leftOffset || 0)) + 'px';
    }

    function openTypefaceInPortal(dropdown) {
        if (!isTypefaceDropdown(dropdown)) return;
        var trigger = dropdown.querySelector('.dropdown-trigger');
        var menu = dropdown.querySelector('.dropdown-menu');
        if (!trigger || !menu) return;
        closeTypefacePortal(true);
        getPortal().appendChild(menu);
        menu.classList.add('dropdown-menu--portal');
        positionMenuInPortal(menu, trigger, dropdown);
        currentOpen = { dropdown: dropdown, menu: menu, trigger: trigger };
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { menu.classList.add('dropdown-menu--portal-visible'); });
        });
    }

    function closeTypefacePortal(immediate) {
        if (!currentOpen) return;
        var dropdown = currentOpen.dropdown;
        var menu = currentOpen.menu;
        var trigger = currentOpen.trigger;
        currentOpen = null;
        if (immediate) {
            menu.style.top = '';
            menu.style.left = '';
            menu.style.width = '';
            menu.classList.remove('dropdown-menu--portal', 'dropdown-menu--portal-visible', 'dropdown-menu--portal-closing');
            dropdown.appendChild(menu);
            return;
        }
        menu.classList.remove('dropdown-menu--portal-visible');
        menu.classList.add('dropdown-menu--portal-closing');
        menu.addEventListener('transitionend', function onEnd(e) {
            if (e.target !== menu || e.propertyName !== 'opacity') return;
            menu.removeEventListener('transitionend', onEnd);
            menu.style.top = '';
            menu.style.left = '';
            menu.style.width = '';
            menu.classList.remove('dropdown-menu--portal', 'dropdown-menu--portal-visible', 'dropdown-menu--portal-closing');
            dropdown.appendChild(menu);
        });
    }

    function repositionPortalMenu() {
        if (currentOpen) positionMenuInPortal(currentOpen.menu, currentOpen.trigger, currentOpen.dropdown);
    }

    window.TypefaceDropdownPortal = {
        open: openTypefaceInPortal,
        close: closeTypefacePortal,
        isTypeface: isTypefaceDropdown,
        reposition: repositionPortalMenu
    };

    window.addEventListener('scroll', repositionPortalMenu, true);
    window.addEventListener('resize', repositionPortalMenu);
})();

// Custom dropdown functionality
document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const options = dropdown.querySelectorAll('.dropdown-option');
    const selectedText = dropdown.querySelector('.dropdown-selected');
    const isTypeface = () => window.TypefaceDropdownPortal && window.TypefaceDropdownPortal.isTypeface(dropdown);
    
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const wasOpen = dropdown.classList.contains('open');
        
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== dropdown) {
                if (window.TypefaceDropdownPortal && window.TypefaceDropdownPortal.isTypeface(d)) window.TypefaceDropdownPortal.close(true);
                d.classList.remove('open');
            }
        });
        
        dropdown.classList.toggle('open', !wasOpen);
        
        if (!wasOpen) {
            if (isTypeface()) window.TypefaceDropdownPortal.open(dropdown);
            if (dropdown.classList.contains('opentype-dropdown')) {
                const section = dropdown.closest('.typeface-section');
                if (section) {
                    const sample = section.querySelector('.typeface-sample');
                    if (sample) updateOpenTypeSelectedText(dropdown, sample);
                }
            }
        } else {
            if (isTypeface()) window.TypefaceDropdownPortal.close();
        }
    });
    
    options.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (dropdown.classList.contains('opentype-dropdown') || this.classList.contains('opentype-option') || this.closest('.opentype-option')) return;
            if (dropdown.classList.contains('nav-dropdown')) {
                dropdown.classList.remove('open');
                return;
            }
            
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            if (selectedText) selectedText.textContent = this.textContent;
            
            const weight = this.getAttribute('data-weight') || this.getAttribute('data-value');
            const stretch = this.getAttribute('data-stretch');
            const style = this.getAttribute('data-style');
            const section = dropdown.closest('.typeface-section');
            const sample = section ? section.querySelector('.typeface-sample') : null;
            if (sample) {
                if (weight) sample.style.fontWeight = weight;
                sample.style.fontStretch = stretch || 'normal';
                sample.style.fontStyle = style || 'normal';
            }
            
            if (isTypeface()) window.TypefaceDropdownPortal.close();
            dropdown.classList.remove('open');
        });
    });
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown') && !e.target.closest('#dropdown-portal')) {
        if (window.TypefaceDropdownPortal) window.TypefaceDropdownPortal.close();
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
    }
});

// Legacy font weight selector functionality (for any remaining select elements)
document.querySelectorAll('.font-weight-select').forEach(select => {
    select.addEventListener('change', function() {
        const section = this.closest('.typeface-section');
        const target = section.getAttribute('data-font');
        const sample = document.querySelector(`.typeface-sample[data-font="${target}"]`);
        const weight = this.value;
        sample.style.fontWeight = weight;
    });
});

// Smooth scroll for back to top
document.querySelector('.back-to-top')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#top' && href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// "Much more" button functionality (can be extended)
document.querySelectorAll('.more-btn').forEach(button => {
    // Skip if it's an anchor tag (it will navigate naturally)
    if (button.tagName === 'A') {
        return;
    }
    button.addEventListener('click', function() {
        const section = this.closest('.typeface-section');
        const fontName = section.querySelector('.typeface-name').textContent;
        // This can be extended to show more details, purchase options, etc.
        console.log(`Show more details for ${fontName}`);
        // You can add a modal or expandable section here
    });
});

// Prevent font styling from being pasted into typeface samples
document.querySelectorAll('.typeface-sample').forEach(sample => {
    sample.addEventListener('paste', function(e) {
        e.preventDefault();
        
        // Get plain text from clipboard
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        
        if (!text) return;
        
        // Get current selection
        const selection = window.getSelection();
        
        // Create or get range
        let range;
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            range.deleteContents();
        } else {
            // No selection - create range at end of element
            range = document.createRange();
            range.selectNodeContents(this);
            range.collapse(false); // Collapse to end
        }
        
        // Insert plain text (will use the target element's styling)
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    });
});

// Bottom bar functionality: cursor coordinates, date, and time
function updateCursorCoordinates(e) {
    const coordsElement = document.getElementById('cursor-coords');
    if (coordsElement) {
        const x = String(Math.round(e.clientX)).padStart(4, '0');
        const y = String(Math.round(e.clientY)).padStart(4, '0');
        coordsElement.textContent = `X ${x} px Y ${y} px`;
    }
}

function updateDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        dateElement.textContent = `${day}.${month}.${year}`;
    }
}

function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${hours}.${minutes}.${seconds}`;
    }
}

// Custom cursor functionality
function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    document.body.appendChild(cursor);
    
    // State variables
    let mouseX = null;
    let mouseY = null;
    let cursorX = null;
    let cursorY = null;
    let cursorInitialized = false;
    let currentRotation = 0;
    
    // Mouse movement handler
    document.addEventListener('mousemove', function(e) {
        if (!cursorInitialized) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorX = mouseX;
            cursorY = mouseY;
            cursorInitialized = true;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
        } else {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });
    
    // Click handler - random spin on click
    document.addEventListener('click', function(e) {
        if (!cursorInitialized) return;
        
        const rotationAngles = [90, 180, 270, 360];
        const randomAngle = rotationAngles[Math.floor(Math.random() * rotationAngles.length)];
        currentRotation += randomAngle;
        
        cursor.style.transition = 'transform 1s ease';
        cursor.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
    });
    
    // Preserve cursor position when tab becomes visible again
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && cursorInitialized) {
            // When tab becomes visible, keep current cursor position
            // Don't reset to origin
            cursorX = mouseX;
            cursorY = mouseY;
        }
    });
    
    // Also handle window focus to prevent reset
    window.addEventListener('focus', function() {
        if (cursorInitialized) {
            cursorX = mouseX;
            cursorY = mouseY;
        }
    });
    
    function animateCursor() {
        if (cursorInitialized && mouseX !== null && mouseY !== null) {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
        }
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Remove inline styles from nav element to allow CSS to control it
    const nav = document.querySelector('.nav');
    if (nav) {
        nav.removeAttribute('style');
    }
    
    // Initialize custom cursor
    initCustomCursor();
    
    // Update date and time immediately
    updateDate();
    updateTime();
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Update date every minute (in case day changes)
    setInterval(updateDate, 60000);
    
    // Update cursor coordinates on mouse move
    document.addEventListener('mousemove', updateCursorCoordinates);
    
    // Update dropdown position to align with header bottom
    function updateNavDropdownPosition() {
        const header = document.querySelector('.header');
        const navDropdown = document.querySelector('.nav-dropdown .dropdown-menu');
        
        if (header && navDropdown) {
            const headerHeight = header.offsetHeight;
            navDropdown.style.top = `${headerHeight}px`;
        }
    }
    
    // Update dropdown position on load and resize
    updateNavDropdownPosition();
    window.addEventListener('resize', updateNavDropdownPosition);
    
    // Update vertical line position for About and Contact pages
    function updateVerticalLine() {
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        const bottomBar = document.querySelector('.bottom-bar');
        
        if (header) {
            const headerHeight = header.offsetHeight;
            // Set CSS custom property for line start position
            document.documentElement.style.setProperty('--line-top', `${headerHeight}px`);
        }
        
        if (footer) {
            const footerRect = footer.getBoundingClientRect();
            const footerTop = footerRect.top;
            const viewportHeight = window.innerHeight;
            let bottomOffset = Math.max(0, viewportHeight - footerTop);
            
            // If footer is below the viewport, account for bottom bar height
            if (bottomBar && footerTop > viewportHeight) {
                const bottomBarHeight = bottomBar.offsetHeight;
                bottomOffset = bottomBarHeight;
            }
            
            // Set CSS custom property on document root
            document.documentElement.style.setProperty('--footer-bottom', `${bottomOffset}px`);
        }
    }
    
    // Update on load and resize
    if (document.querySelector('.about-section') || document.querySelector('.contact-section')) {
        updateVerticalLine();
        window.addEventListener('resize', updateVerticalLine);
        window.addEventListener('scroll', updateVerticalLine);
    }
});

// OpenType Feature Detection and Toggling
// Canonical order for OpenType features (same as typeface-detail-renderer.js)
var OPENTYPE_FEATURE_ORDER = [
    'liga', 'calt', 'clig', 'dlig',
    'smcp', 'c2sc',
    'onum', 'lnum', 'tnum', 'zero',
    'salt',
    'ss01', 'ss02', 'ss03', 'ss04', 'ss05', 'ss06', 'ss07', 'ss08', 'ss09', 'ss10', 'ss11', 'ss12', 'ss13', 'ss14', 'ss15', 'ss16', 'ss17', 'ss18', 'ss19', 'ss20'
];

function sortOpenTypeFeaturesList(features) {
    const order = OPENTYPE_FEATURE_ORDER;
    const orderIndex = function (tag) {
        const i = order.indexOf(tag);
        if (i >= 0) return i;
        const ss = /^ss(\d+)$/.exec(tag);
        if (ss) return 1000 + parseInt(ss[1], 10);
        return 2000;
    };
    return [...features].sort(function (a, b) {
        const ia = orderIndex(a);
        const ib = orderIndex(b);
        if (ia !== ib) return ia - ib;
        return String(a).localeCompare(b);
    });
}

// Font file mapping for feature detection
const fontFileMap = {
    'INDG Alvica': 'fonts/Alvica/INDGAlvica-Regular.woff2',
    'INDG Actio': 'fonts/Actio/INDGActio-RegularNormal.woff2',
    'INDG Modus': 'fonts/Modus/INDGModus-Grey.woff2',
    'INDG Luara': 'fonts/Luara/INDG Luara.woff2',
    'INDG Dale': 'fonts/Dale/INDGDale-Regular.woff2',
    'INDG Zigrid': 'fonts/Zigrid/INDG Zigrid.woff2',
    'INDG Heron': 'fonts/Heron/INDGHeron-ST.woff2',
    'INDG Naora': 'fonts/Naora/INDG Naora.woff2',
    'INDG Peqat': 'fonts/Peqat/INDGPeqat-Norma.woff2',
    'INDG Sifora': 'fonts/Sifora/INDGSifora-Regular.woff2',
    'Old English Quadrat': 'fonts/Old English Quadrat/Old-English-Quadrat.woff2'
};

// Cache for detected features
const fontFeaturesCache = {};

/**
 * Detect OpenType features from a font file
 * @param {string} fontPath - Path to the font file
 * @returns {Promise<Array>} Array of feature tags
 */
async function detectOpenTypeFeatures(fontPath) {
    if (fontFeaturesCache[fontPath]) {
        return fontFeaturesCache[fontPath];
    }

    try {
        if (typeof opentype === 'undefined') {
            console.warn('opentype.js not loaded, using fallback features');
            // Return common OpenType features as fallback
            return ['liga', 'calt', 'liga', 'dlig', 'ss01', 'ss02', 'ss03', 'ss04', 'ss05', 'ss06', 'ss07', 'smcp', 'onum', 'tnum', 'lnum', 'zero', 'salt'];
        }

        const font = await opentype.load(fontPath);
        const features = [];
        
        if (font.tables && font.tables.gsub && font.tables.gsub.features) {
            font.tables.gsub.features.forEach(feature => {
                if (feature.tag) {
                    features.push(feature.tag);
                }
            });
        }
        
        if (font.tables && font.tables.gpos && font.tables.gpos.features) {
            font.tables.gpos.features.forEach(feature => {
                if (feature.tag && !features.includes(feature.tag)) {
                    features.push(feature.tag);
                }
            });
        }

        // Also check for common features that might not be in GSUB/GPOS
        const commonFeatures = ['liga', 'calt', 'liga', 'dlig', 'ss01', 'ss02', 'ss03', 'ss04', 'ss05', 'ss06', 'ss07', 'smcp', 'onum', 'tnum', 'lnum', 'zero', 'salt'];
        commonFeatures.forEach(feat => {
            if (!features.includes(feat)) {
                // Try to detect if feature exists by checking font tables
                features.push(feat);
            }
        });

        // Filter out 'kern' feature
        const filteredFeatures = features.filter(feat => feat !== 'kern');
        
        fontFeaturesCache[fontPath] = filteredFeatures;
        return filteredFeatures;
    } catch (error) {
        console.error('Error detecting OpenType features:', error);
        // Return common features as fallback
        return ['liga', 'calt', 'liga', 'dlig', 'ss01', 'ss02', 'ss03', 'ss04', 'ss05', 'ss06', 'ss07', 'smcp', 'onum', 'tnum', 'lnum', 'zero', 'salt'];
    }
}

/**
 * Get font family from a typeface section
 * @param {Element} section - The typeface section element
 * @returns {string} Font family name
 */
function getFontFamilyFromSection(section) {
    const fontAttr = section.getAttribute('data-font');
    if (!fontAttr) return null;
    
    // Map data-font values to font family names
    const fontFamilyMap = {
        'alvica': 'INDG Alvica',
        'actio': 'INDG Actio',
        'modus': 'INDG Modus',
        'luara': 'INDG Luara',
        'dale': 'INDG Dale',
        'zigrid': 'INDG Zigrid',
        'heron': 'INDG Heron',
        'heron2': 'INDG Heron',
        'naora': 'INDG Naora',
        'peqat': 'INDG Peqat',
        'sifora': 'INDG Sifora',
        'oequadrat': 'Old English Quadrat'
    };
    
    return fontFamilyMap[fontAttr] || null;
}

/**
 * Attach click handlers to existing OpenType dropdown options (does not replace content).
 * Reorders options to match OPENTYPE_FEATURE_ORDER so the list is sensible.
 */
function attachOpenTypeDropdownBehavior(dropdown) {
    const menu = dropdown.querySelector('.opentype-menu');
    if (!menu) return;

    const options = Array.from(menu.querySelectorAll('.dropdown-option[data-feature]'));
    const features = options.map(function (el) { return el.getAttribute('data-feature'); });
    const sorted = sortOpenTypeFeaturesList(features);
    sorted.forEach(function (feature) {
        const option = options.find(function (el) { return el.getAttribute('data-feature') === feature; });
        if (option) menu.appendChild(option);
    });

    menu.querySelectorAll('.dropdown-option[data-feature]').forEach(option => {
        option.classList.add('opentype-option');
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const feature = this.getAttribute('data-feature');
            const section = dropdown.closest('.typeface-section');
            const sample = section ? section.querySelector('.typeface-sample') : null;
            if (sample && feature) {
                const isSelected = this.classList.contains('selected');
                this.classList.toggle('selected', !isSelected);
                toggleOpenTypeFeature(sample, feature, !isSelected);
                updateOpenTypeSelectedText(dropdown, sample);
            }
        });
    });
}

/**
 * Populate OpenType dropdown with a given list of features (replaces menu content).
 * Used only when the page has no pre-rendered features (e.g. fallback).
 */
function populateOpenTypeDropdown(dropdown, features) {
    const menu = dropdown.querySelector('.opentype-menu');
    if (!menu) return;

    menu.innerHTML = '';
    const uniqueFeatures = sortOpenTypeFeaturesList([...new Set(features)]);

    uniqueFeatures.forEach(feature => {
        const option = document.createElement('div');
        option.className = 'dropdown-option opentype-option';
        option.setAttribute('data-feature', feature);
        option.textContent = feature;
        menu.appendChild(option);
    });

    menu.querySelectorAll('.opentype-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const feature = this.getAttribute('data-feature');
            const section = dropdown.closest('.typeface-section');
            const sample = section ? section.querySelector('.typeface-sample') : null;
            if (sample && feature) {
                const isSelected = this.classList.contains('selected');
                this.classList.toggle('selected', !isSelected);
                toggleOpenTypeFeature(sample, feature, !isSelected);
                updateOpenTypeSelectedText(dropdown, sample);
            }
        });
    });
}

/**
 * Update the selected state of OpenType features in the dropdown
 * @param {Element} dropdown - The OpenType dropdown element
 * @param {Element} sample - The typeface sample element
 */
function updateOpenTypeSelectedText(dropdown, sample) {
    const currentSettings = sample.style.fontFeatureSettings || '';
    const activeFeatures = [];
    
    if (currentSettings && currentSettings !== 'normal') {
        currentSettings.split(',').forEach(setting => {
            const parts = setting.trim().split(/\s+/);
            if (parts.length >= 1) {
                const tag = parts[0].replace(/['"]/g, '');
                const value = parts.length > 1 ? parseInt(parts[1]) : 1;
                if (value > 0) {
                    activeFeatures.push(tag);
                }
            }
        });
    }
    
    // Update selected classes in dropdown menu
    const menu = dropdown.querySelector('.opentype-menu');
    if (menu) {
        menu.querySelectorAll('.opentype-option').forEach(option => {
            const feature = option.getAttribute('data-feature');
            if (activeFeatures.includes(feature)) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
}

/**
 * Toggle an OpenType feature on a sample element
 * @param {Element} sample - The typeface sample element
 * @param {string} feature - Feature tag (e.g., 'liga', 'ss01')
 * @param {boolean} enabled - Whether to enable or disable the feature
 */
function toggleOpenTypeFeature(sample, feature, enabled) {
    // Get current font-feature-settings
    const currentSettings = sample.style.fontFeatureSettings || '';
    
    // Parse existing settings
    const features = {};
    if (currentSettings && currentSettings !== 'normal') {
        currentSettings.split(',').forEach(setting => {
            const parts = setting.trim().split(/\s+/);
            if (parts.length >= 1) {
                const tag = parts[0].replace(/['"]/g, '');
                const value = parts.length > 1 ? parseInt(parts[1]) : 1;
                features[tag] = value;
            }
        });
    }
    
    // Update the feature
    if (enabled) {
        features[feature] = 1;
    } else {
        delete features[feature];
    }
    
    // Build new font-feature-settings string
    if (Object.keys(features).length === 0) {
        sample.style.fontFeatureSettings = 'normal';
    } else {
        const settings = Object.entries(features)
            .map(([tag, value]) => `"${tag}" ${value}`)
            .join(', ');
        sample.style.fontFeatureSettings = settings;
    }
    
    // Update the dropdown display
    const section = sample.closest('.typeface-section');
    if (section) {
        const dropdown = section.querySelector('.opentype-dropdown');
        if (dropdown) {
            updateOpenTypeSelectedText(dropdown, sample);
        }
    }
}

/**
 * Initialize OpenType dropdowns for all typeface sections.
 * Uses the features already in the DOM (from openTypeFeatures in typeface config) so each
 * typeface only shows its own features. Falls back to detection only when no options are present.
 */
async function initializeOpenTypeDropdowns() {
    const opentypeDropdowns = document.querySelectorAll('.opentype-dropdown');

    for (const dropdown of opentypeDropdowns) {
        const menu = dropdown.querySelector('.opentype-menu');
        if (!menu) continue;

        const existingOptions = menu.querySelectorAll('.dropdown-option[data-feature]');
        if (existingOptions.length > 0) {
            // Page already has per-typeface features from config; just attach behavior
            attachOpenTypeDropdownBehavior(dropdown);
            const section = dropdown.closest('.typeface-section');
            const sample = section ? section.querySelector('.typeface-sample') : null;
            if (sample) updateOpenTypeSelectedText(dropdown, sample);
            continue;
        }

        // No pre-rendered features: fallback to detection (e.g. legacy or index)
        const section = dropdown.closest('.typeface-section');
        if (!section) continue;

        const fontFamily = getFontFamilyFromSection(section);
        if (!fontFamily || !fontFileMap[fontFamily]) {
            populateOpenTypeDropdown(dropdown, ['liga', 'calt', 'dlig', 'ss01', 'ss02', 'ss03', 'ss04', 'ss05', 'ss06', 'ss07', 'smcp', 'zero', 'salt']);
            continue;
        }

        const fontPath = fontFileMap[fontFamily];
        const features = await detectOpenTypeFeatures(fontPath);
        populateOpenTypeDropdown(dropdown, features);
    }
}

// Initialize OpenType dropdowns when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOpenTypeDropdowns);
} else {
    // DOM already loaded
    initializeOpenTypeDropdowns();
}

