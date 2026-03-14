/**
 * Purchase Modal — 3-step checkout funnel
 * Step 1: License tier (company size)
 * Step 2: Style selection (multi-select)
 * Step 3: Embedded Stripe Checkout
 */
(function () {
    'use strict';

    // ── Configuration ──────────────────────────────────────────────

    var LICENSE_TIERS = [
        { id: 'tier-1', label: '1–3 employees', multiplier: 1 },
        { id: 'tier-2', label: '4–10 employees', multiplier: 1.5 },
        { id: 'tier-3', label: '11–25 employees', multiplier: 2 },
        { id: 'tier-4', label: '26–50 employees', multiplier: 3 },
        { id: 'tier-5', label: '51–100 employees', multiplier: 4 },
    ];

    var STEP_LABELS = ['Licensing', 'Style selection', 'Payment'];

    // ── State ───────────────────────────────────────────────────────

    var state = {
        step: 1,
        licenseTier: null,
        selectedProducts: [],  // multi-select array
        typefaceId: '',
        typefaceName: '',
        pricing: [],
    };

    var overlayEl = null;
    var embeddedCheckout = null;

    // ── Helpers ─────────────────────────────────────────────────────

    function parsePriceValue(str) {
        var m = str.match(/(\d+(?:[.,]\d+)?)/);
        return m ? parseFloat(m[1].replace(',', '.')) : 0;
    }

    function calcPrice(basePrice) {
        var tier = state.licenseTier ? state.licenseTier.multiplier : 1;
        return Math.round(basePrice * tier);
    }

    function calcTotal() {
        var total = 0;
        for (var i = 0; i < state.selectedProducts.length; i++) {
            total += calcPrice(state.selectedProducts[i].basePrice);
        }
        return total;
    }

    function fmt(amount) {
        return amount + '€';
    }

    function isSelected(name) {
        for (var i = 0; i < state.selectedProducts.length; i++) {
            if (state.selectedProducts[i].name === name) return true;
        }
        return false;
    }

    function toggleProduct(name, basePrice) {
        var idx = -1;
        for (var i = 0; i < state.selectedProducts.length; i++) {
            if (state.selectedProducts[i].name === name) { idx = i; break; }
        }
        if (idx >= 0) {
            state.selectedProducts.splice(idx, 1);
        } else {
            state.selectedProducts.push({ name: name, basePrice: basePrice });
        }
    }

    // ── Modal lifecycle ─────────────────────────────────────────────

    function openModal(typefaceId, typefaceName, pricing) {
        state.step = 1;
        state.licenseTier = null;
        state.selectedProducts = [];
        state.typefaceId = typefaceId;
        state.typefaceName = typefaceName;
        state.pricing = pricing;

        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.className = 'pm-overlay';
            overlayEl.addEventListener('click', function (e) {
                if (e.target === overlayEl) closeModal();
            });
            document.body.appendChild(overlayEl);
        }

        overlayEl.classList.add('pm-open');
        state._scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + state._scrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
        renderModal();
    }

    function closeModal() {
        if (embeddedCheckout) {
            embeddedCheckout.destroy();
            embeddedCheckout = null;
        }
        if (overlayEl) overlayEl.classList.remove('pm-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, state._scrollY || 0);
    }

    // ── Render ──────────────────────────────────────────────────────

    function renderModal() {
        var step = state.step;
        var canGoBack = step > 1;
        var isPayStep = step === 3;

        var nextLabel = step === 2 ? 'Checkout →' : 'Next →';
        var nextDisabled = '';
        if (step === 1 && !state.licenseTier) nextDisabled = ' disabled';
        if (step === 2 && !state.selectedProducts.length) nextDisabled = ' disabled';

        var totalHtml = '';
        if (state.selectedProducts.length) {
            totalHtml = 'Total: ' + fmt(calcTotal());
        }

        overlayEl.innerHTML =
            '<div class="pm-modal">' +
                '<div class="pm-drawer-handle"><span></span></div>' +
                '<div class="pm-header">' +
                    '<span class="pm-title">Purchase ' + state.typefaceName + '</span>' +
                    '<button class="pm-close" type="button">×</button>' +
                '</div>' +
                '<div class="pm-step-bar">' +
                    renderStepBar(step) +
                '</div>' +
                '<div class="pm-body">' +
                    renderStepContent(step) +
                '</div>' +
                (isPayStep ? '' :
                '<div class="pm-footer">' +
                    '<div class="pm-footer-left">' +
                        (canGoBack ? '<button class="pm-back" type="button">← Back</button>' : '') +
                    '</div>' +
                    '<div class="pm-footer-center">' + totalHtml + '</div>' +
                    '<div class="pm-footer-right">' +
                        '<button class="pm-next" type="button"' + nextDisabled + '>' + nextLabel + '</button>' +
                    '</div>' +
                '</div>') +
            '</div>';

        bindEvents();

        if (isPayStep) initStripeEmbed();
    }

    function renderStepBar(currentStep) {
        var html = '';
        for (var i = 0; i < STEP_LABELS.length; i++) {
            var cls = 'pm-step-item';
            if (i + 1 === currentStep) cls += ' pm-step-active';
            if (i + 1 < currentStep) cls += ' pm-step-done';
            html += '<div class="' + cls + '">' + (i + 1) + '. ' + STEP_LABELS[i] + '</div>';
        }
        return html;
    }

    function renderStepContent(step) {
        if (step === 1) return renderStep1();
        if (step === 2) return renderStep2();
        if (step === 3) return renderStep3();
        return '';
    }

    // ── Step 1: License Tier ────────────────────────────────────────

    function renderStep1() {
        var html = '<p class="pm-question">How many people work at your company?</p>';
        html += '<div class="pm-options">';
        for (var i = 0; i < LICENSE_TIERS.length; i++) {
            var t = LICENSE_TIERS[i];
            var sel = state.licenseTier && state.licenseTier.id === t.id ? ' pm-option-selected' : '';
            html +=
                '<div class="pm-option' + sel + '" data-tier-idx="' + i + '">' +
                    '<span class="pm-option-label">' + t.label + '</span>' +
                    '<span class="pm-option-value">' + (t.multiplier === 1 ? 'Standard' : t.multiplier + '×') + '</span>' +
                '</div>';
        }
        html += '</div>';
        html += '<p class="pm-contact-note">100+ employees? <a href="mailto:hi@indigoindigo.org">Contact us</a> for a custom quote.</p>';
        return html;
    }

    // ── Step 2: Style Selection (multi-select) ──────────────────────

    function renderStep2() {
        var pricing = state.pricing;
        if (!pricing || !pricing.length) return '<p>No pricing available.</p>';

        var html = '<p class="pm-question">Select styles</p>';
        html += '<div class="pm-options">';
        for (var i = 0; i < pricing.length; i++) {
            var p = pricing[i];
            var base = parsePriceValue(p.price);
            var adjusted = calcPrice(base);
            var sel = isSelected(p.name) ? ' pm-option-selected' : '';
            var isFamily = /family/i.test(p.name);
            html +=
                '<div class="pm-option' + sel + (isFamily ? ' pm-option-highlight' : '') + '" data-product-idx="' + i + '">' +
                    '<span class="pm-option-label">' + p.name + '</span>' +
                    '<span class="pm-option-value">' + fmt(adjusted) + '</span>' +
                '</div>';
        }
        html += '</div>';
        return html;
    }

    // ── Step 3: Stripe Embedded Checkout ────────────────────────────

    function renderStep3() {
        var itemsHtml = '';
        for (var i = 0; i < state.selectedProducts.length; i++) {
            var sp = state.selectedProducts[i];
            itemsHtml += '<div class="pm-summary-row"><span>' + sp.name + '</span><span>' + fmt(calcPrice(sp.basePrice)) + '</span></div>';
        }

        return '<div class="pm-checkout-container">' +
                   '<div class="pm-checkout-summary">' +
                       '<div class="pm-summary-row"><span>License</span><span>' + (state.licenseTier ? state.licenseTier.label : '–') + '</span></div>' +
                       itemsHtml +
                       '<div class="pm-summary-row pm-summary-total"><span>Total</span><span>' + fmt(calcTotal()) + '</span></div>' +
                   '</div>' +
                   '<div id="pm-stripe-embed"><div class="pm-loading">Loading payment form...</div></div>' +
                   '<button class="pm-back pm-back-payment" type="button">← Back</button>' +
               '</div>';
    }

    async function initStripeEmbed() {
        var container = document.getElementById('pm-stripe-embed');
        if (!container) return;

        try {
            // Fetch publishable key
            var keyRes = await fetch('/api/create-checkout-session');
            var keyData = await keyRes.json();
            if (!keyData.publishableKey) {
                container.innerHTML = '<p class="pm-error">Stripe is not configured.</p>';
                return;
            }

            // Build product name from selections
            var productName = state.selectedProducts.map(function (p) { return p.name; }).join(' + ');
            var totalPrice = calcTotal();

            var res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: productName,
                    priceAmount: totalPrice,
                    typefaceId: state.typefaceId,
                    embedded: true,
                    metadata: {
                        licenseTier: state.licenseTier ? state.licenseTier.label : '',
                    },
                }),
            });
            var data = await res.json();

            if (data.error) {
                container.innerHTML = '<p class="pm-error">' + data.error + '</p>';
                return;
            }

            // Mount embedded checkout
            var stripe = Stripe(keyData.publishableKey);
            embeddedCheckout = await stripe.initEmbeddedCheckout({
                clientSecret: data.clientSecret,
            });
            container.innerHTML = '';
            embeddedCheckout.mount('#pm-stripe-embed');

        } catch (err) {
            container.innerHTML = '<p class="pm-error">Could not load payment form. Please try again.</p>';
        }
    }

    // ── Event Binding ───────────────────────────────────────────────

    function bindEvents() {
        var modal = overlayEl.querySelector('.pm-modal');
        if (!modal) return;

        // Close
        modal.querySelector('.pm-close').addEventListener('click', closeModal);

        // Back
        var backBtn = modal.querySelector('.pm-back');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                if (embeddedCheckout) {
                    embeddedCheckout.destroy();
                    embeddedCheckout = null;
                }
                state.step--;
                renderModal();
            });
        }

        // Next
        var nextBtn = modal.querySelector('.pm-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                state.step++;
                renderModal();
            });
        }

        // Step 1: tier selection
        modal.querySelectorAll('[data-tier-idx]').forEach(function (el) {
            el.addEventListener('click', function () {
                var idx = parseInt(this.getAttribute('data-tier-idx'));
                state.licenseTier = LICENSE_TIERS[idx];
                renderModal();
            });
        });

        // Step 2: product multi-select
        modal.querySelectorAll('[data-product-idx]').forEach(function (el) {
            el.addEventListener('click', function () {
                var idx = parseInt(this.getAttribute('data-product-idx'));
                var p = state.pricing[idx];
                toggleProduct(p.name, parsePriceValue(p.price));
                renderModal();
            });
        });
    }

    // ── Keyboard ────────────────────────────────────────────────────

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlayEl && overlayEl.classList.contains('pm-open')) {
            closeModal();
        }
    });

    // ── Wire up buttons ─────────────────────────────────────────────

    function init() {
        // Hero "Purchase" buttons only
        document.querySelectorAll('.buy-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var typefaceId = window.__TYPEFACE_ID__ || '';
                var typefaceName = window.__TYPEFACE_NAME__ || '';
                var pricing = window.__TYPEFACE_PRICING__ || [];
                if (pricing.length) {
                    openModal(typefaceId, typefaceName, pricing);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
