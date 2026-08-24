/* Dark mode: apply saved theme before paint to reduce flash */
(function () {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

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

// Static tooltip above control box on hover (size slider, tracking slider, caps button), with fade in/out
(function () {
    var tooltip = null;

    function getTooltip() {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'control-hint-tooltip';
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }

    function getHintForElement(el) {
        if (!el) return null;
        var box = el.closest && el.closest('.control-box');
        if (!box) return null;
        var sizeSlider = box.querySelector('.font-size-slider');
        if (sizeSlider) return { text: 'Text size: ' + Math.round(sizeSlider.value), box: box };
        var trackingSlider = box.querySelector('.letter-spacing-slider');
        if (trackingSlider) return { text: 'Tracking: ' + parseFloat(trackingSlider.value).toFixed(3), box: box };
        var capsBtn = box.querySelector('.capitalize-btn');
        if (capsBtn) {
            var isActive = capsBtn.classList.contains('active');
            return { text: 'All caps: ' + (isActive ? 'on' : 'off'), box: box };
        }
        return null;
    }

    function showHint(text) {
        var el = getTooltip();
        el.textContent = text;
        el.classList.add('visible');
    }

    function hideHint() {
        if (tooltip) tooltip.classList.remove('visible');
    }

    document.addEventListener('mouseover', function (e) {
        var hint = getHintForElement(e.target);
        if (hint) {
            showHint(hint.text);
        }
    });

    // Update tooltip in real-time while dragging sliders
    document.addEventListener('input', function (e) {
        if (e.target.classList.contains('font-size-slider') || e.target.classList.contains('letter-spacing-slider')) {
            var hint = getHintForElement(e.target);
            if (hint && tooltip && tooltip.classList.contains('visible')) {
                showHint(hint.text);
            }
        }
    });

    document.addEventListener('mouseout', function (e) {
        var related = e.relatedTarget;
        if (!related || !document.body.contains(related)) {
            hideHint();
            return;
        }
        if (!getHintForElement(related)) hideHint();
    });
})();

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

    var isMobile = function() { return window.innerWidth <= 768; };

    /** OpenType dropdown: fixed positioning, aligned to control-box so it reaches the right margin. */
    function positionOpenTypeDropdownInPortal(menu, trigger, dropdown) {
        if (!menu || !trigger) return;
        var box = dropdown && dropdown.closest && dropdown.closest('.control-box');
        var r = box ? box.getBoundingClientRect() : trigger.getBoundingClientRect();
        menu.style.top = r.bottom + 'px';
        menu.style.left = r.left + 'px';
        menu.style.width = r.width + 'px';
    }

    function positionMenuInPortal(menu, trigger, dropdown) {
        if (!menu || !trigger || !dropdown) return;
        if (dropdown.classList.contains('opentype-dropdown')) {
            positionOpenTypeDropdownInPortal(menu, trigger, dropdown);
            return;
        }
        var type = getDropdownPortalType(dropdown);
        var c = DROPDOWN_PORTAL_ALIGN[type] || DROPDOWN_PORTAL_ALIGN.styleDetail;
        var box = dropdown.closest('.control-box');
        var r = (isMobile() && box) ? box.getBoundingClientRect() : trigger.getBoundingClientRect();
        var w = r.width + (c.widthDelta || 0);
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
        if (!currentOpen) return;
        var triggerRect = currentOpen.trigger.getBoundingClientRect();
        // If the trigger has scrolled entirely out of the viewport, the menu
        // has nothing left to stay visually anchored to. Rather than leave a
        // tall menu's tail end floating with no visible connection to
        // anything (looks "detached" — the actual reported bug), close it.
        if (triggerRect.bottom < 0 || triggerRect.top > window.innerHeight) {
            currentOpen.dropdown.classList.remove('open');
            closeTypefacePortal(true);
            return;
        }
        positionMenuInPortal(currentOpen.menu, currentOpen.trigger, currentOpen.dropdown);
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
        if (dropdown.classList.contains('no-ot-features')) return;
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
                applyFontVariantWithCrossfade(sample, weight, stretch, style);
            }
            
            if (isTypeface()) window.TypefaceDropdownPortal.close();
            dropdown.classList.remove('open');
        });
    });
});

/**
 * Apply a weight/stretch/style change as a true crossfade instead of an
 * abrupt jump. Each weight is a separate static font file (not a variable
 * font), so the browser can't interpolate glyph shapes between them — a
 * fade+blur is the closest achievable substitute. A snapshot of the current
 * appearance (a ghost clone) overlays the live sample and fades+blurs out
 * while the live sample — already switched to the new weight — simultaneously
 * fades+blurs in, both over the same 1s, so the two overlap rather than
 * playing one after the other.
 */
function applyFontVariantWithCrossfade(sample, weight, stretch, style) {
    if (!sample) return;
    var parent = sample.parentElement;
    if (!parent) {
        if (weight) sample.style.fontWeight = weight;
        sample.style.fontStretch = stretch || 'normal';
        sample.style.fontStyle = style || 'normal';
        return;
    }

    // Snapshot the current appearance to overlay and fade out.
    var ghost = sample.cloneNode(true);
    ghost.removeAttribute('contenteditable');
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.classList.add('typeface-sample-ghost');
    ghost.style.top = sample.offsetTop + 'px';
    ghost.style.left = sample.offsetLeft + 'px';
    ghost.style.width = sample.offsetWidth + 'px';
    ghost.style.opacity = '1';
    ghost.style.filter = 'blur(0px)';
    parent.insertBefore(ghost, sample.nextSibling);

    // Jump the live sample straight to its new appearance, but starting
    // invisible/blurred — transition suppressed for this one frame so it
    // doesn't animate FROM the old look TO invisible first.
    sample.style.transition = 'none';
    sample.style.opacity = '0';
    sample.style.filter = 'blur(8px)';
    if (weight) sample.style.fontWeight = weight;
    sample.style.fontStretch = stretch || 'normal';
    sample.style.fontStyle = style || 'normal';

    // Chromium can fail to re-shape glyphs for a contenteditable element when
    // only a font-style/font-weight property changes on it — confirmed via
    // testing (including a completely independent Canvas 2D render of the
    // same font, which was always correct) that the font itself loads fine;
    // the DOM/CSS text-layout path just doesn't always pick it up. This
    // happened even with the font pre-warmed, so it isn't only a loading-
    // timing issue. A full remove+reinsert forces a genuinely fresh layout —
    // done here, while still invisible, so there's no visible flash.
    var nextSibling = sample.nextSibling;
    parent.removeChild(sample);
    void parent.offsetHeight;
    parent.insertBefore(sample, nextSibling);
    void sample.offsetHeight; // flush the above before re-enabling transitions

    requestAnimationFrame(function () {
        sample.style.transition = '';
        sample.style.opacity = '1';
        sample.style.filter = 'blur(0px)';
        // Start the ghost's fade-out on the same frame as the sample's
        // fade-in, so both genuinely overlap for the full 1s.
        ghost.style.opacity = '0';
        ghost.style.filter = 'blur(8px)';
    });

    setTimeout(function () {
        ghost.remove();
        sample.style.opacity = '';
        sample.style.filter = '';
    }, 1050);
}

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
        applyFontVariantWithCrossfade(sample, weight, null, null);
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

// Prevent "Much more" button/link from being draggable (avoids pasting into typeface sample on drop)
document.querySelectorAll('.more-btn').forEach(btn => {
    btn.addEventListener('dragstart', function(e) {
        e.preventDefault();
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

// Toggle uppercase display (reversible) when capitalize button is clicked
document.addEventListener('click', function(e) {
    if (!e.target.closest('.capitalize-btn')) return;
    const btn = e.target.closest('.capitalize-btn');
    const section = btn.closest('.typeface-section');
    if (!section) return;
    section.classList.toggle('capitalize-active');
    btn.classList.toggle('active');
    btn.textContent = btn.classList.contains('active') ? 'AA' : 'Aa';
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
    let cursorVisible = false;
    let currentRotation = 0;

    // Mouse movement handler
    document.addEventListener('mousemove', function(e) {
        if (!cursorInitialized) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorX = mouseX;
            cursorY = mouseY;
            cursorInitialized = true;
        } else {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
        if (!cursorVisible) {
            cursor.style.opacity = '1';
            cursorVisible = true;
        }
    });

    // Hide cursor when mouse leaves the viewport
    document.addEventListener('mouseleave', function() {
        cursor.style.opacity = '0';
        cursorVisible = false;
    });
    document.addEventListener('mouseenter', function() {
        if (cursorInitialized) {
            cursor.style.opacity = '1';
            cursorVisible = true;
        }
    });

    // Click handler - random spin on click
    document.addEventListener('click', function(e) {
        if (!cursorInitialized) return;

        const rotationAngles = [90, 180, 270, 360];
        const randomAngle = rotationAngles[Math.floor(Math.random() * rotationAngles.length)];
        currentRotation += randomAngle;

        cursor.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
    });

    // Preserve cursor position when tab becomes visible again
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && cursorInitialized) {
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
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
        }
        requestAnimationFrame(animateCursor);
    }

    // Start hidden until first mousemove
    cursor.style.opacity = '0';
    animateCursor();
}

// Typeface details: keep table rows aligned – row height = max content height in row, rounded up to 50px
// On mobile, each box gets its own modular height independently (not synced across columns)
function syncTypefaceDetailRowHeights() {
    var container = document.querySelector('.typeface-details-content');
    if (!container) return;
    var columns = container.querySelectorAll('.details-column');
    if (columns.length === 0) return;
    var rowCount = columns[0].querySelectorAll('.detail-item').length;
    if (rowCount === 0) return;
    container.querySelectorAll('.detail-item').forEach(function (el) { el.style.height = ''; });

    var isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Mobile: let each item size to its content naturally
        container.querySelectorAll('.detail-item').forEach(function (el) {
            el.style.height = 'auto';
        });
        return;
    }

    // Desktop: auto height per row — find the tallest item in each row and match siblings
    for (var r = 0; r < rowCount; r++) {
        var maxH = 50; // minimum 50px
        for (var c = 0; c < columns.length; c++) {
            var item = columns[c].querySelectorAll('.detail-item')[r];
            if (item) {
                item.style.height = 'auto';
                var h = item.getBoundingClientRect().height;
                if (h > maxH) maxH = h;
            }
        }
        for (var c2 = 0; c2 < columns.length; c2++) {
            var item2 = columns[c2].querySelectorAll('.detail-item')[r];
            if (item2) item2.style.height = maxH + 'px';
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Remove inline styles from nav element to allow CSS to control it
    const nav = document.querySelector('.nav');
    if (nav) {
        nav.removeAttribute('style');
    }

    // Mobile: inject hamburger button; open menu is rendered in #dropdown-portal so it matches other dropdowns
    (function initMobileHeaderMenu() {
        const header = document.querySelector('.header');
        const headerContent = document.querySelector('.header-content');
        if (!header || !headerContent || !nav) return;
        if (document.querySelector('.header-menu-toggle')) return;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'header-menu-toggle';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span></span><span></span>';
        headerContent.insertBefore(toggle, nav);

        function getPortal() {
            var p = document.getElementById('dropdown-portal');
            if (!p) {
                p = document.createElement('div');
                p.id = 'dropdown-portal';
                document.body.appendChild(p);
            }
            return p;
        }

        function getMobilePanel() {
            return document.querySelector('#dropdown-portal .mobile-nav-panel');
        }

        function closeMenu() {
            var panel = getMobilePanel();
            if (panel) {
                while (panel.firstChild) nav.appendChild(panel.firstChild);
                panel.remove();
            }
            header.classList.remove('nav-open');
            toggle.setAttribute('aria-label', 'Open menu');
            toggle.setAttribute('aria-expanded', 'false');
        }

        function openMenu() {
            var portal = getPortal();
            var panel = document.createElement('div');
            panel.className = 'dropdown-menu dropdown-menu--portal dropdown-menu--portal-visible mobile-nav-panel';
            panel.style.top = (header.offsetHeight - 1) + 'px';
            panel.style.left = '0';
            panel.style.right = '0';
            panel.style.width = '100%';
            while (nav.firstChild) panel.appendChild(nav.firstChild);
            panel.querySelectorAll('a, .theme-toggle').forEach(function(el) {
                el.addEventListener('click', closeMenu);
            });
            portal.appendChild(panel);
            header.classList.add('nav-open');
            toggle.setAttribute('aria-label', 'Close menu');
            toggle.setAttribute('aria-expanded', 'true');
        }

        toggle.addEventListener('click', function() {
            if (header.classList.contains('nav-open')) closeMenu();
            else openMenu();
        });

        document.addEventListener('click', function(e) {
            if (!header.classList.contains('nav-open')) return;
            var panel = getMobilePanel();
            if (panel && !panel.contains(e.target) && !toggle.contains(e.target)) closeMenu();
            if (!panel && !header.contains(e.target)) closeMenu();
        });
    })();
    
    // Floating buttons: hide when pricing section buttons are visible (docking effect)
    (function initFloatingButtonsDock() {
        var floatingBar = document.querySelector('.typeface-hero-buttons-floating');
        var pricingRow = document.querySelector('.typeface-pricing .typeface-hero-buttons-row');
        if (!floatingBar || !pricingRow) return;

        function checkDock() {
            var rowRect = pricingRow.getBoundingClientRect();
            // Dock (hide floating): pricing row bottom is above the viewport bottom
            // i.e. the row is fully visible or above — user can see the static buttons
            // Undock (show floating): pricing row bottom is at or below viewport bottom
            // i.e. the row is leaving/left the screen downward — user needs floating buttons
            if (rowRect.bottom <= window.innerHeight) {
                floatingBar.classList.add('docked');
            } else {
                floatingBar.classList.remove('docked');
            }
        }
        window.addEventListener('scroll', checkDock, { passive: true });
        checkDock();
    })();

    // Initialize custom cursor
    initCustomCursor();
    
    // Update date and time immediately
    updateDate();
    updateTime();
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Update date every minute (in case day changes)
    setInterval(updateDate, 60000);
    
    // ASCII portrait: image-to-ASCII via canvas with live contrast animation
    (function initAsciiPortrait() {
        var el = document.getElementById('ascii-portrait');
        if (!el) return;

        var chars = ' .,:;-=+*?#%@';
        var cols = 100;
        var rows = 0;
        var pixelData = null;
        var contrast = 1.5;
        var contrastDir = 0.015;

        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            var aspect = img.height / img.width;
            rows = Math.round(cols * aspect * 0.55);
            var canvas = document.createElement('canvas');
            canvas.width = cols;
            canvas.height = rows;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, cols, rows);
            pixelData = ctx.getImageData(0, 0, cols, rows).data;
            render();
            setInterval(function () {
                // Oscillate contrast for a living, breathing feel
                contrast += contrastDir;
                if (contrast > 2.5 || contrast < 0.3) contrastDir *= -1;
                render();
            }, 120);
        };
        img.onerror = function () { el.style.display = 'none'; };
        img.src = '/images/Headshot.jpg';

        function render() {
            if (!pixelData) return;
            var lines = [];
            for (var r = 0; r < rows; r++) {
                var line = '';
                for (var c = 0; c < cols; c++) {
                    var i = (r * cols + c) * 4;
                    // Luminance
                    var lum = (pixelData[i] * 0.299 + pixelData[i + 1] * 0.587 + pixelData[i + 2] * 0.114) / 255;
                    // Apply contrast
                    var val = ((lum - 0.5) * contrast) + 0.5;
                    // Slight per-character jitter
                    val += (Math.random() - 0.5) * 0.04;
                    val = Math.max(0, Math.min(1, val));
                    // Map to character (dark=dense, light=sparse)
                    var idx = Math.floor((1 - val) * (chars.length - 1));
                    line += chars[idx];
                }
                lines.push(line);
            }
            el.textContent = lines.join('\n');
        }
    })();

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

    syncTypefaceDetailRowHeights();
    window.addEventListener('resize', syncTypefaceDetailRowHeights);
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
    'INDG Stycka': 'fonts/Stycka/INDG-Stycka.woff2',
    'Old English Quadrat': 'fonts/Old English Quadrat/Old-English-Quadrat.woff2',
    'INDIG Test': 'fonts/INDIG Test/INDGAlvica-Regular.woff2',
    'INDG DAJO': 'fonts/DAJO/INDGDracma-Naturalis.woff2',
    'INDG Stycka': 'fonts/Stycka/INDG-Stycka.woff2',
    'INDG Wovo': 'fonts/Wovo/INDGWovo-Regular.woff2'
};

// Cache for detected features
const fontFeaturesCache = {};

/**
 * Collect feature tags from a table object (GSUB or GPOS). Tries multiple shapes opentype.js may use.
 */
function collectFeatureTagsFromTable(table) {
    const tags = [];
    if (!table) return tags;
    const list = table.features || table.featureList || (Array.isArray(table) ? table : null);
    if (list) {
        list.forEach(function (entry) {
            const tag = entry.tag || entry.featureTag || (typeof entry === 'string' ? entry : null);
            if (tag && !tags.includes(tag)) tags.push(tag);
        });
    }
    return tags;
}

/**
 * Load a font with opentype.js (supports callback or Promise API).
 * opentype.js does not support WOFF2; use .woff or .ttf for detection.
 */
function loadFontForDetection(path) {
    return new Promise(function (resolve, reject) {
        opentype.load(path, function (err, font) {
            if (err) reject(err);
            else resolve(font);
        });
    });
}

/**
 * Extract feature tags from a loaded font (GSUB/GPOS). Handles opentype.js table shape.
 */
function extractFeaturesFromFont(font) {
    const features = [];
    if (font.tables) {
        collectFeatureTagsFromTable(font.tables.gsub).forEach(function (t) { if (!features.includes(t)) features.push(t); });
        collectFeatureTagsFromTable(font.tables.gpos).forEach(function (t) { if (!features.includes(t)) features.push(t); });
    }
    if (features.length === 0 && typeof font.toTables === 'function') {
        const tables = font.toTables();
        if (tables && tables.gsub) collectFeatureTagsFromTable(tables.gsub).forEach(function (t) { if (!features.includes(t)) features.push(t); });
        if (tables && tables.gpos) collectFeatureTagsFromTable(tables.gpos).forEach(function (t) { if (!features.includes(t)) features.push(t); });
    }
    return features;
}

/**
 * Detect OpenType features from a font file. opentype.js can't parse WOFF2,
 * so when given one, also try the same base filename as .woff/.ttf/.otf in
 * turn — whichever format actually exists alongside it — until one parses.
 * @param {string} fontPath - Path to the font file (e.g. .woff2 or .woff)
 * @returns {Promise<Array>} Array of feature tags
 */
async function detectOpenTypeFeatures(fontPath) {
    if (fontFeaturesCache[fontPath]) {
        return fontFeaturesCache[fontPath];
    }
    if (typeof opentype === 'undefined') {
        return [];
    }

    var candidates = [fontPath];
    if (/\.woff2$/i.test(fontPath)) {
        var base = fontPath.replace(/\.woff2$/i, '');
        candidates.push(base + '.woff', base + '.ttf', base + '.otf');
    }

    for (var i = 0; i < candidates.length; i++) {
        try {
            var font = await loadFontForDetection(candidates[i]);
            if (font) {
                var list = extractFeaturesFromFont(font);
                fontFeaturesCache[fontPath] = list;
                return list;
            }
        } catch (e) {}
    }
    return [];
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
        'stycka': 'INDG Stycka',
        'oequadrat': 'Old English Quadrat',
        'Test': 'INDIG Test',
        'dajo': 'INDG DAJO',
        'stycka': 'INDG Stycka',
        'wovo': 'INDG Wovo'
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
 * When showEmptyPlaceholder is true, adds a single "No features" item so the dropdown stays visible.
 */
function populateOpenTypeDropdown(dropdown, features, showEmptyPlaceholder = false) {
    const menu = dropdown.querySelector('.opentype-menu');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const selectedSpan = dropdown.querySelector('.dropdown-selected');
    const arrowSpan = dropdown.querySelector('.dropdown-arrow');
    if (!menu) return;

    menu.innerHTML = '';
    const list = features && features.length ? sortOpenTypeFeaturesList([...new Set(features)]) : [];
    const hasNoFeatures = list.length === 0 && showEmptyPlaceholder;

    if (hasNoFeatures) {
        dropdown.classList.add('no-ot-features');
        if (selectedSpan) selectedSpan.textContent = 'No OT features';
        if (arrowSpan) arrowSpan.style.display = 'none';
        if (trigger) trigger.setAttribute('disabled', 'disabled');
        const placeholder = document.createElement('div');
        placeholder.className = 'dropdown-option opentype-option opentype-empty-placeholder';
        placeholder.textContent = 'No features';
        placeholder.style.opacity = '0.7';
        placeholder.style.pointerEvents = 'none';
        menu.appendChild(placeholder);
    } else {
        dropdown.classList.remove('no-ot-features');
        if (selectedSpan) selectedSpan.textContent = 'OT features';
        if (arrowSpan) arrowSpan.style.display = '';
        if (trigger) trigger.removeAttribute('disabled');
        list.forEach(feature => {
            const option = document.createElement('div');
            option.className = 'dropdown-option opentype-option';
            option.setAttribute('data-feature', feature);
            option.textContent = feature;
            menu.appendChild(option);
        });

        menu.querySelectorAll('.opentype-option[data-feature]').forEach(option => {
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
 * On detail pages: uses window.__TYPEFACE_FONT_PATHS__[data-font] and detects from the font file
 * so only features present in that typeface appear. Waits for opentype.js to load before detecting.
 */
async function initializeOpenTypeDropdowns() {
    const opentypeDropdowns = document.querySelectorAll('.opentype-dropdown');
    const fontPathsByTypefaceId = typeof window !== 'undefined' ? window.__TYPEFACE_FONT_PATHS__ : null;

    for (const dropdown of opentypeDropdowns) {
        const menu = dropdown.querySelector('.opentype-menu');
        if (!menu) continue;

        const existingOptions = menu.querySelectorAll('.dropdown-option[data-feature]');
        if (existingOptions.length > 0) {
            attachOpenTypeDropdownBehavior(dropdown);
            const section = dropdown.closest('.typeface-section');
            const sample = section ? section.querySelector('.typeface-sample') : null;
            if (sample) updateOpenTypeSelectedText(dropdown, sample);
            continue;
        }

        const section = dropdown.closest('.typeface-section');
        if (!section) continue;

        let fontPath = null;
        const typefaceId = section.getAttribute('data-font');
        if (fontPathsByTypefaceId && typefaceId && fontPathsByTypefaceId[typefaceId]) {
            fontPath = fontPathsByTypefaceId[typefaceId];
        }
        if (!fontPath) {
            const fontFamily = getFontFamilyFromSection(section);
            if (fontFamily && fontFileMap[fontFamily]) fontPath = fontFileMap[fontFamily];
        }
        if (!fontPath) {
            populateOpenTypeDropdown(dropdown, [], true);
            continue;
        }

        let features = await detectOpenTypeFeatures(fontPath);
        if (features.length === 0) {
            // Live detection failed (e.g. font uploaded without a .woff/.ttf/
            // .otf fallback for opentype.js to parse) — fall back to the
            // admin panel's manually-entered feature list for this typeface,
            // if one was set.
            const manualSample = section.querySelector('.typeface-sample[data-manual-ot-features]');
            if (manualSample) {
                features = manualSample.dataset.manualOtFeatures.split(',').map(f => f.trim()).filter(Boolean);
            }
        }
        populateOpenTypeDropdown(dropdown, features, features.length === 0);
        applyDefaultOpenTypeFeatures(dropdown, section, features);
    }

    updateDetailsOTFeaturesRow(fontPathsByTypefaceId);
}

/**
 * Pre-select and enable any OpenType features the admin marked as "on by
 * default" for this sample (data-default-ot="liga,smcp" set from the Samples
 * editor in the admin panel), so visitors immediately see the typeface's
 * alternates/ligatures/etc. rather than always starting from plain text.
 * Only applies tags the font actually has (from `features`), so a stale or
 * mistyped default in the admin panel can't silently no-op or error.
 */
function applyDefaultOpenTypeFeatures(dropdown, section, features) {
    const sample = section ? section.querySelector('.typeface-sample') : null;
    if (!sample || !sample.dataset.defaultOt) return;
    const available = new Set((features || []).map(f => f.toLowerCase()));
    const menu = dropdown.querySelector('.opentype-menu');
    sample.dataset.defaultOt.split(',')
        .map(f => f.trim().toLowerCase())
        .filter(f => f && available.has(f))
        .forEach(feature => {
            toggleOpenTypeFeature(sample, feature, true);
            const option = menu && menu.querySelector(`.opentype-option[data-feature="${feature}"]`);
            if (option) option.classList.add('selected');
        });
    updateOpenTypeSelectedText(dropdown, sample);
}

/**
 * On typeface detail pages, fill the "OT features" row in the details section with features detected from the font.
 */
async function updateDetailsOTFeaturesRow(fontPathsByTypefaceId) {
    const el = document.querySelector('.detail-value-ot-features');
    if (!el || !fontPathsByTypefaceId) return;
    const section = document.querySelector('.typeface-section[data-font]');
    const typefaceId = section && section.getAttribute('data-font');
    if (!typefaceId || !fontPathsByTypefaceId[typefaceId]) return;
    const fontPath = fontPathsByTypefaceId[typefaceId];
    try {
        let features = await detectOpenTypeFeatures(fontPath);
        if (features.length === 0) {
            const manualSample = document.querySelector('.typeface-sample[data-manual-ot-features]');
            if (manualSample) {
                features = manualSample.dataset.manualOtFeatures.split(',').map(f => f.trim()).filter(Boolean);
            }
        }
        el.textContent = features.length ? sortOpenTypeFeaturesList(features).join(', ') : '—';
    } catch (e) {
        el.textContent = '—';
    }
    syncTypefaceDetailRowHeights();
}

/**
 * Wait for opentype.js to be available (it loads async), then init dropdowns.
 */
function runOpenTypeInitWhenReady() {
    if (typeof opentype !== 'undefined') {
        initializeOpenTypeDropdowns();
        return;
    }
    window.addEventListener('load', function onLoad() {
        window.removeEventListener('load', onLoad);
        if (typeof opentype !== 'undefined') {
            initializeOpenTypeDropdowns();
            return;
        }
        setTimeout(function retry() {
            initializeOpenTypeDropdowns();
        }, 300);
    });
    setTimeout(function earlyRetry() {
        if (typeof opentype !== 'undefined') initializeOpenTypeDropdowns();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOpenTypeInitWhenReady);
} else {
    runOpenTypeInitWhenReady();
}

// Dark mode toggle
(function () {
    function updateThemeToggleLabels() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            btn.textContent = isDark ? 'Light' : 'Dark';
            btn.setAttribute('aria-label', isDark ? 'Toggle light mode' : 'Toggle dark mode');
        });
    }
    function toggleTheme() {
        var html = document.documentElement;
        var isDark = html.getAttribute('data-theme') === 'dark';
        if (isDark) {
            html.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        updateThemeToggleLabels();
    }
    function initThemeToggle() {
        updateThemeToggleLabels();
        document.addEventListener('click', function (e) {
            if (e.target.closest('.theme-toggle')) toggleTheme();
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
})();

// Paste as plain text in contenteditable so section formatting is preserved
(function () {
    function onPaste(e) {
        var el = e.target;
        if (el.getAttribute('contenteditable') !== 'true') return;
        e.preventDefault();
        var data = (e.clipboardData || (window.clipboardData && window.clipboardData.getData && { getData: function (t) { return window.clipboardData.getData(t); } }));
        var text = data && data.getData('text/plain');
        if (text == null) return;
        if (document.execCommand && document.execCommand('insertText', false, text)) return;
        var sel = window.getSelection();
        if (!sel.rangeCount) return;
        sel.deleteFromDocument();
        var range = sel.getRangeAt(0);
        var textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    document.addEventListener('paste', onPaste, true);
})();

// Buy/Purchase button click handlers are now in purchase-modal.js

// Test button: download a trial ZIP with the currently selected style + license info
(function () {
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.test-btn');
        if (!btn) return;
        e.preventDefault();

        var typefaceId = window.__TYPEFACE_ID__ || '';
        if (!typefaceId) return;

        // Find the first typeface dropdown's selected style on detail pages
        var style = '';
        var section = document.querySelector('.typeface-detail-container .typeface-section');
        if (section) {
            var selected = section.querySelector('.custom-dropdown:not(.opentype-dropdown) .dropdown-option.selected');
            if (selected) style = selected.textContent.trim();
        }

        // For homepage, try the section closest to the button
        if (!style) {
            var homeSection = btn.closest('.typeface-section');
            if (homeSection) {
                var sel = homeSection.querySelector('.custom-dropdown:not(.opentype-dropdown) .dropdown-option.selected');
                if (sel) style = sel.textContent.trim();
            }
        }

        var url = '/api/test-download?id=' + encodeURIComponent(typefaceId);
        if (style) url += '&style=' + encodeURIComponent(style);
        window.location.href = url;
    });
})();

// Free download button handler
(function () {
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.free-download-btn');
        if (!btn) return;
        e.preventDefault();
        var typefaceId = window.__TYPEFACE_ID__ || '';
        if (!typefaceId) return;
        window.location.href = '/api/test-download?id=' + encodeURIComponent(typefaceId) + '&mode=free';
    });
})();

// Apply mobile-specific font sizes from data attributes
(function () {
    function applyMobileFontSizes() {
        var isMobile = window.matchMedia('(max-width: 768px)').matches;
        document.querySelectorAll('[data-font-size-mobile]').forEach(function (el) {
            if (isMobile) {
                el.style.fontSize = el.getAttribute('data-font-size-mobile') + 'px';
            }
        });
        document.querySelectorAll('[data-letter-spacing-mobile]').forEach(function (el) {
            if (isMobile) {
                el.style.letterSpacing = el.getAttribute('data-letter-spacing-mobile') + 'em';
            }
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMobileFontSizes);
    } else {
        applyMobileFontSizes();
    }
    window.addEventListener('resize', applyMobileFontSizes);
})();

// Preload every font variant the page offers so switching styles within a family is
// instant. Without this, non-default weights/widths are fetched on first selection and
// the browser briefly shows a fallback font (the FOUT seen on desktop but not mobile).
//
// Previously this rendered hidden <span> elements to trigger the browser's own font
// loading, then waited on document.fonts.ready to know when to clean them up. That's
// fragile: if any font on the page had already finished loading before this ran (always
// true — the default-weight fonts load immediately), .ready can already be a resolved
// promise, so .then() fires within milliseconds rather than waiting for these NEW loads.
// The cleanup then removed the triggering spans while their fetches were still in
// flight, and the browser abandoned them — leaving that variant stuck "unloaded"
// indefinitely (confirmed via document.fonts: status stayed "unloaded" even seconds
// later, for styles like italic that aren't anyone's default). Using the Font Loading
// API's own load() directly avoids all of this: no DOM tricks, and its promise only
// resolves once that specific font has actually finished loading.
(function () {
    function warmFontVariants() {
        if (!('fonts' in document)) return;
        var sections = document.querySelectorAll('.typeface-section');
        if (!sections.length) return;
        var seen = {};
        sections.forEach(function (section) {
            var sample = section.querySelector('.typeface-sample');
            if (!sample) return;
            var family = getComputedStyle(sample).fontFamily;
            section.querySelectorAll('.dropdown-option').forEach(function (opt) {
                if (opt.hasAttribute('data-feature')) return; // OpenType feature toggles, not font variants
                var weight = opt.getAttribute('data-weight') || opt.getAttribute('data-value') || '400';
                var stretch = opt.getAttribute('data-stretch') || 'normal';
                var style = opt.getAttribute('data-style') || 'normal';
                var key = family + '|' + weight + '|' + stretch + '|' + style;
                if (seen[key]) return;
                seen[key] = true;
                var styleKeyword = (style === 'italic' || style === 'oblique') ? style : 'normal';
                try {
                    document.fonts.load(styleKeyword + ' ' + weight + ' 40px ' + family).catch(function () {});
                } catch (e) {}
            });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', warmFontVariants);
    } else {
        warmFontVariants();
    }
})();

