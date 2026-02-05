/**
 * Initialize slider functionality
 * @param {string} selector - CSS selector for sliders
 * @param {string} styleProperty - CSS style property to update (e.g., 'fontSize', 'letterSpacing')
 * @param {string} defaultDefaultValue - Default value if not specified in HTML
 */
function initializeSliders(selector, styleProperty, defaultDefaultValue) {
    document.querySelectorAll(selector).forEach(slider => {
        const defaultValue = slider.getAttribute('value') || defaultDefaultValue;
        let previousValue = slider.value;
        let mouseDownTime = 0;
        let hasMoved = false;
        
        // Helper function to find the target sample element
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
                sample.style[styleProperty] = this.value + 'px';
            }
        });
        
        // Reset to default on track click (not thumb drag)
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
            // If it was a quick click (< 200ms) and value didn't change much, reset to default
            if (clickDuration < 200 && !hasMoved && Math.abs(this.value - previousValue) < 5) {
                const sample = findSample();
                if (sample) {
                    this.value = defaultValue;
                    sample.style[styleProperty] = defaultValue + 'px';
                }
            }
            mouseDownTime = 0;
            hasMoved = false;
        });
    });
}

// Initialize font size sliders
initializeSliders('.font-size-slider', 'fontSize', '120');

// Initialize letter spacing sliders
initializeSliders('.letter-spacing-slider', 'letterSpacing', '0');

// Custom dropdown functionality
document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const options = dropdown.querySelectorAll('.dropdown-option');
    const selectedText = dropdown.querySelector('.dropdown-selected');
    
    // Toggle dropdown
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        
        // Close all other dropdowns
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('open');
            }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('open', !isOpen);
        
        // If opening OpenType dropdown, update selected state in menu
        if (!isOpen && dropdown.classList.contains('opentype-dropdown')) {
            const section = dropdown.closest('.typeface-section');
            if (section) {
                const sample = section.querySelector('.typeface-sample');
                if (sample) {
                    updateOpenTypeSelectedText(dropdown, sample);
                }
            }
        }
    });
    
    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Don't close dropdown for OpenType features (they use checkboxes)
            const isOpenTypeDropdown = dropdown.classList.contains('opentype-dropdown');
            const isOpenTypeOption = this.classList.contains('opentype-option') || this.closest('.opentype-option');
            
            if (isOpenTypeDropdown || isOpenTypeOption) {
                // OpenType features are handled by checkbox handlers, don't close dropdown
                return;
            }
            
            // If it's a navigation dropdown with links, just close the dropdown
            // The link will handle navigation naturally
            if (dropdown.classList.contains('nav-dropdown')) {
                dropdown.classList.remove('open');
                return; // Let the link navigate naturally
            }
            
            // Remove selected class from all options
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update trigger text
            if (selectedText) {
                selectedText.textContent = this.textContent;
            }
            
            // Get the weight, stretch, and style values
            const weight = this.getAttribute('data-weight') || this.getAttribute('data-value');
            const stretch = this.getAttribute('data-stretch');
            const style = this.getAttribute('data-style');
            
            // Update font weight, stretch, and style on typeface sample
            const section = dropdown.closest('.typeface-section');
            const target = section ? section.getAttribute('data-font') : null;
            // Find the sample in the same section
            const sample = section ? section.querySelector(`.typeface-sample`) : null;
            if (sample) {
                if (weight) {
                    sample.style.fontWeight = weight;
                }
                if (stretch) {
                    sample.style.fontStretch = stretch;
                } else {
                    sample.style.fontStretch = 'normal';
                }
                if (style) {
                    sample.style.fontStyle = style;
                } else {
                    sample.style.fontStyle = 'normal';
                }
            }
            
            // Close dropdown
            dropdown.classList.remove('open');
        });
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
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

// ============================================================================
// Supabase Database Functions
// ============================================================================

/**
 * Fetch all active products from Supabase
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchAllProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('family_name', { ascending: true })
            .order('font_weight', { ascending: true });

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchAllProducts:', error);
        return [];
    }
}

/**
 * Fetch products by family name
 * @param {string} familyName - The font family name (e.g., 'INDG Alvica')
 * @returns {Promise<Array>} Array of product objects for that family
 */
async function fetchProductsByFamily(familyName) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('family_name', familyName)
            .eq('is_active', true)
            .order('font_weight', { ascending: true });

        if (error) {
            console.error(`Error fetching products for ${familyName}:`, error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchProductsByFamily:', error);
        return [];
    }
}

/**
 * Fetch a single product by ID
 * @param {string} productId - The UUID of the product
 * @returns {Promise<Object|null>} Product object or null if not found
 */
async function fetchProductById(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in fetchProductById:', error);
        return null;
    }
}

/**
 * Find a product by font specifications
 * @param {string} familyName - Font family name
 * @param {number} fontWeight - Font weight (100-900)
 * @param {string} fontStyle - Font style ('normal', 'italic', 'oblique')
 * @param {string} fontStretch - Font stretch ('normal', 'expanded', etc.)
 * @returns {Promise<Object|null>} Product object or null if not found
 */
async function findProductBySpecs(familyName, fontWeight, fontStyle = 'normal', fontStretch = 'normal') {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('family_name', familyName)
            .eq('font_weight', fontWeight)
            .eq('font_style', fontStyle)
            .eq('font_stretch', fontStretch)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error finding product by specs:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in findProductBySpecs:', error);
        return null;
    }
}

/**
 * Get all unique font families
 * @returns {Promise<Array>} Array of unique family names
 */
async function getAllFontFamilies() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('family_name')
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching font families:', error);
            return [];
        }

        // Get unique family names
        const uniqueFamilies = [...new Set(data.map(item => item.family_name))];
        return uniqueFamilies.sort();
    } catch (error) {
        console.error('Error in getAllFontFamilies:', error);
        return [];
    }
}

// Example: Load products on page load (optional - uncomment to use)
// document.addEventListener('DOMContentLoaded', async function() {
//     const products = await fetchAllProducts();
//     console.log('Loaded products:', products);
//     
//     // You can now use the products data to populate your page
//     // For example, update prices, show product info, etc.
// });

// OpenType Feature Detection and Toggling
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
 * Populate OpenType dropdown with detected features
 * @param {Element} dropdown - The OpenType dropdown element
 * @param {Array} features - Array of feature tags
 */
function populateOpenTypeDropdown(dropdown, features) {
    const menu = dropdown.querySelector('.opentype-menu');
    if (!menu) return;
    
    // Clear existing options
    menu.innerHTML = '';
    
    // Remove duplicates and sort
    const uniqueFeatures = [...new Set(features)].sort();
    
    uniqueFeatures.forEach(feature => {
        const option = document.createElement('div');
        option.className = 'dropdown-option opentype-option';
        option.setAttribute('data-feature', feature);
        option.textContent = feature;
        menu.appendChild(option);
    });
    
    // Add click handler for options
    menu.querySelectorAll('.opentype-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const feature = this.getAttribute('data-feature');
            const section = dropdown.closest('.typeface-section');
            const sample = section ? section.querySelector('.typeface-sample') : null;
            
            if (sample && feature) {
                // Toggle selected class
                const isSelected = this.classList.contains('selected');
                this.classList.toggle('selected', !isSelected);
                
                // Toggle feature
                toggleOpenTypeFeature(sample, feature, !isSelected);
                
                // Update selected features display
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
 * Initialize OpenType dropdowns for all typeface sections
 */
async function initializeOpenTypeDropdowns() {
    const opentypeDropdowns = document.querySelectorAll('.opentype-dropdown');
    
    for (const dropdown of opentypeDropdowns) {
        const section = dropdown.closest('.typeface-section');
        if (!section) continue;
        
        const fontFamily = getFontFamilyFromSection(section);
        if (!fontFamily || !fontFileMap[fontFamily]) {
            // Use fallback features if font not in map
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

