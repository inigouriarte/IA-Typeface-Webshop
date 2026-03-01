/**
 * Reusable HTML components for the website
 */

/**
 * Render the header component
 * @param {string} activePage - The active page ('home', 'about', 'contact', or null)
 * @returns {string} HTML string for the header
 */
function renderHeader(activePage = null) {
    const pages = [
        { name: 'Home', href: 'index.html', key: 'home' },
        { name: 'About', href: 'about.html', key: 'about' },
        { name: 'Contact', href: 'contact.html', key: 'contact' }
    ];

    const navLinks = pages.map(page => {
        const activeClass = activePage === page.key ? ' class="active"' : '';
        return `<a href="${page.href}"${activeClass}>${page.name}</a>`;
    }).join('\n                ');

    return `    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo">Indigo Alphabets®</div>
            <nav class="nav">
                ${navLinks}
            </nav>
        </div>
    </header>`;
}

/**
 * Render the footer component
 * @param {Object} options - Footer options
 * @param {boolean} options.showAlvicaLink - Whether to show link for Alvica in footer
 * @returns {string} HTML string for the footer
 */
function renderFooter(options = {}) {
    const { showAlvicaLink = false } = options;
    
    const alvicaLink = showAlvicaLink 
        ? '<div><a href="alvica.html" style="text-decoration: none; color: inherit;">Alvica</a></div>'
        : '<div>Alvica</div>';

    return `    <!-- Footer -->
    <footer class="footer">
        <div class="footer-top">
            <a href="#top" class="back-to-top"><span class="back-to-top-arrow">▲</span> Back to top</a>
            <a href="licensing.html" class="footer-link">Licensing</a>
            <h3 class="typeface-list-heading">Typefaces</h3>
        </div>
        <div class="footer-content">
            <div class="typeface-columns">
                <div class="typeface-column">
                    ${alvicaLink}
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
    </footer>`;
}

/**
 * Render the bottom bar component
 * @returns {string} HTML string for the bottom bar
 */
function renderBottomBar() {
    return `    <!-- Fixed Bottom Bar -->
    <div class="bottom-bar">
        <div class="bottom-bar-content">
            <span class="bottom-bar-item" id="cursor-coords">X 0000 px Y 0000 px</span>
            <span class="bottom-bar-item" id="current-date">01.01.2026</span>
            <span class="bottom-bar-item" id="current-time">00.00.00</span>
            <span class="bottom-bar-item">52.5034°N 13.4698°E</span>
        </div>
    </div>`;
}

/**
 * Initialize components on page load
 * @param {Object} options - Initialization options
 * @param {string} options.activePage - Active page key
 * @param {Object} options.footer - Footer options
 */
function initComponents(options = {}) {
    const { activePage = null, footer = {} } = options;
    
    // Insert header at the beginning of body
    const body = document.body;
    if (body) {
        body.insertAdjacentHTML('afterbegin', renderHeader(activePage));
    }
}

