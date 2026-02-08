/**
 * Build script to generate HTML files from components
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

// Import components (we'll use eval to load them, or require if using modules)
// For now, we'll inline the functions since Node.js doesn't have ES modules by default

function renderHeader(activePage = null) {
    const pages = [
        { name: 'Home', href: 'index.html', key: 'home' },
        { name: 'About', href: 'about.html', key: 'about' },
        { name: 'Contact', href: 'contact.html', key: 'contact' }
    ];

    const navLinks = pages.map(page => {
        const activeClass = activePage === page.key ? ' class="active"' : '';
        return `                <a href="${page.href}"${activeClass}>${page.name}</a>`;
    }).join('\n');

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

function renderFooter(options = {}) {
    const { showAlvicaLink = false } = options;
    
    const alvicaLink = showAlvicaLink 
        ? '<div><a href="alvica.html" style="text-decoration: none; color: inherit;">Alvica</a></div>'
        : '<div>Alvica</div>';

    return `    <!-- Footer -->
    <footer class="footer">
        <div class="footer-top">
            <a href="#top" class="back-to-top">▲ Back to top</a>
            <a href="#licensing" class="footer-link">Licensing</a>
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

// Note: This is a simplified build script
// For full typeface generation, you'd load typefaces-renderer.js
console.log('Build script created. For now, we\'ll update HTML files directly.');
console.log('To use this build script in the future, you would:');
console.log('1. Read template HTML files');
console.log('2. Replace placeholders with component HTML');
console.log('3. Write output HTML files');

