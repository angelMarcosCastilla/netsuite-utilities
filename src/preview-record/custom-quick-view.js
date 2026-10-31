/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define([], () => {
    class CustomQuickView extends HTMLElement {
        static elementName = 'custom-quick-view';

        static settings = {
            defaultEndpoint: 'XXXXXX',
            floatingUrl: 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7/+esm',
            openDelay: 200,
            closeDelay: 250,
            cacheTtl: 60000,
            placement: 'bottom-start',
            maxWidth: 480,
            maxHeight: 520,
        };

        static icons = {
            user:
                '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
                'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<circle cx="10" cy="7.5" r="3.5"/><path d="M3.5 20c0-3.6 3-6 6.5-6 1.2 0 2.3.3 3.2.8"/>' +
                '<path d="M15 18.5l2.2 2.2 4-4.3"/></svg>',
            pin:
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
                '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
        };

        static popoverCss = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .popover {
        --header-bg: #efeeec; --ink: #161513; --muted: #5f5b57; --line: #e3e0dc; --link: #00688c;
        position: relative; width: max-content; min-width: min(260px, 92vw); max-width: var(--max-width, min(92vw, 480px));
        font: 14px/1.4 "Oracle Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
        color: var(--ink);
      }
      .arrow { position: absolute; z-index: 0; width: 12px; height: 12px; transform: rotate(45deg); background: #fff; }
      .popover[data-side="bottom"] .arrow { background: var(--header-bg); }
      .card {
        position: relative; z-index: 1; background: #fff; border-radius: 8px; overflow-x: hidden; overflow-y: auto;
        box-shadow: 0 0 0 1px rgba(22,21,19,.08), 0 10px 28px rgba(22,21,19,.22);
      }
      .header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: var(--header-bg); border-bottom: 1px solid var(--line); }
      .header svg { flex: none; }
      .header h2 { margin: 0; font-size: 20px; line-height: 1.2; font-weight: 700; overflow-wrap: anywhere; }
      .body { display: grid; grid-template-columns: fit-content(200px) minmax(0, 1fr); column-gap: 16px; padding: 2px 18px 4px; }
      .row { display: contents; }
      .label, .value { padding: 10px 0; border-bottom: 1px solid var(--line); min-height: 44px; overflow-wrap: anywhere; }
      .row:last-child > * { border-bottom: 0; }
      .label { color: var(--muted); }
      .link { color: var(--link); text-decoration: none; }
      .link:hover { text-decoration: underline; }
      .map { display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; }
      .footer { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 18px 16px; }
      .button {
        display: inline-block; padding: 6px 16px; border: 1px solid #8d8984; border-radius: 6px;
        background: #fff; color: var(--ink); text-decoration: none; font: inherit; cursor: pointer;
      }
      .button:hover { background: #f4f3f1; }
      a:focus-visible, .button:focus-visible { outline: 2px solid var(--link); outline-offset: 2px; border-radius: 4px; }
      .error { padding: 16px 18px; }
      .error p { margin: 0; overflow-wrap: anywhere; }
      .skeleton { height: 14px; border-radius: 4px; background: linear-gradient(90deg,#ececea 25%,#f6f5f4 40%,#ececea 60%); background-size: 400% 100%; animation: shimmer 1.3s ease-in-out infinite; }
      .skeleton-title { height: 22px; width: 58%; }
      .skeleton-label { width: 110px; }
      .skeleton-value { width: 100%; min-width: 120px; }
      @keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
      .popover[data-side="bottom"] { --enter-y: -6px; }
      .popover[data-side="top"] { --enter-y: 6px; }
      .popover.is-visible { animation: popover-in 140ms ease-out; }
      .card.is-loaded .body, .card.is-loaded .footer { animation: fade-in 140ms ease-out; }
      @keyframes popover-in {
        from { opacity: 0; transform: translateY(var(--enter-y, -6px)) scale(.98); }
        to { opacity: 1; transform: none; }
      }
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .skeleton, .popover.is-visible, .card.is-loaded .body, .card.is-loaded .footer { animation: none; }
      }
    `;

        static responseCache = new Map();
        static floatingPromise = null;
        static activeInstance = null;
        // El skeleton conserva el tamaño anterior para evitar saltos al posicionar.
        static lastCardHeight = 440;
        static lastCardWidth = 380;

        static get observedAttributes() {
            return ['record', 'record-id', 'href'];
        }

        static register() {
            if (!customElements.get(CustomQuickView.elementName)) {
                customElements.define(CustomQuickView.elementName, CustomQuickView);
            }
            // La apertura usa una posición alternativa si falla esta precarga.
            CustomQuickView.loadFloatingUI().catch(() => {});
        }

        /** Escapa texto para insertarlo con seguridad dentro de HTML. */
        static escapeHtml(value) {
            const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return String(value ?? '').replace(/[&<>"']/g, (character) => replacements[character]);
        }

        /** Devuelve la URL absoluta solo si es http, https, mailto o tel. Si no, ''. */
        static toSafeUrl(value) {
            if (!value) return '';
            try {
                const parsed = new URL(value, window.location.href);
                const allowed = ['http:', 'https:', 'mailto:', 'tel:'];
                return allowed.includes(parsed.protocol) ? parsed.href : '';
            } catch (error) {
                return '';
            }
        }

        static getFieldHref(field, text) {
            if (field.link) return field.link;
            if (!text) return '';
            if (field.type === 'email') return `mailto:${text}`;
            if (field.type === 'phone') return `tel:${text.replace(/[^\d+]/g, '')}`;
            if (field.type === 'url') return /^https?:/i.test(text) ? text : `https://${text}`;
            return '';
        }

        /** Carga Floating UI con import dinámico (no choca con el define de NetSuite). */
        static loadFloatingUI() {
            if (!CustomQuickView.floatingPromise) {
                const url = window.CQV_FLOATING_URL || CustomQuickView.settings.floatingUrl;
                CustomQuickView.floatingPromise = import(url).catch(() => {
                    CustomQuickView.floatingPromise = null; // permite reintentar
                    throw new Error('No se pudo cargar Floating UI.');
                });
            }
            return CustomQuickView.floatingPromise;
        }

        constructor() {
            super();

            const shadow = this.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
        <style>
          :host { display: inline; }
          a { color: var(--cqv-link, #00688c); text-decoration: none; cursor: pointer; }
          a:hover { text-decoration: underline; }
          a:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 2px; }
        </style>
        <a part="link"><slot><span id="fallback"></span></slot></a>`;
            this.anchor = shadow.querySelector('a');
            this.fallbackText = shadow.getElementById('fallback');

            this.popoverHost = null;
            this.popoverEl = null;
            this.arrowEl = null;
            this.card = null;
            this.requestController = null;
            this.stopAutoUpdate = null;
            this.runId = 0;
            this.reservedHeight = 0;
            this.openTimer = 0;
            this.closeTimer = 0;
            this.supportsTopLayer = typeof HTMLElement.prototype.showPopover === 'function';

            this.onEnter = () => this.scheduleOpen();
            this.onLeave = () => this.scheduleClose();
            this.onKeydown = (event) => {
                if (event.key === 'Escape') this.close();
            };
            this.anchor.addEventListener('click', (event) => {
                if (!this.anchor.getAttribute('href')) event.preventDefault();
            });
        }

        connectedCallback() {
            this.addEventListener('mouseenter', this.onEnter);
            this.addEventListener('mouseleave', this.onLeave);
            this.addEventListener('focusin', this.onEnter);
            this.addEventListener('focusout', this.onLeave);
            this.syncLink();
        }

        disconnectedCallback() {
            this.removeEventListener('mouseenter', this.onEnter);
            this.removeEventListener('mouseleave', this.onLeave);
            this.removeEventListener('focusin', this.onEnter);
            this.removeEventListener('focusout', this.onLeave);
            this.close();
        }

        attributeChangedCallback() {
            this.syncLink();
        }

        syncLink() {
            const safeHref = CustomQuickView.toSafeUrl(this.getAttribute('href'));
            if (safeHref) this.anchor.setAttribute('href', safeHref);
            else this.anchor.removeAttribute('href');

            this.fallbackText.textContent = `${this.getAttribute('record') || ''} #${this.getAttribute('record-id') || ''}`;
        }

        /** Lee un límite numérico (px) de un atributo; si no es válido usa el valor por defecto. */
        getLimit(attributeName, fallback) {
            const value = Number(this.getAttribute(attributeName));
            return Number.isFinite(value) && value > 0 ? value : fallback;
        }

        /** URL del Suitelet: atributo → window.CQV_ENDPOINT → valor por defecto. */
        getEndpoint() {
            return this.getAttribute('endpoint') || window.CQV_ENDPOINT || CustomQuickView.settings.defaultEndpoint;
        }

        getCacheKey() {
            return `${this.getEndpoint()}|${this.getAttribute('record')}|${this.getAttribute('record-id')}`;
        }

        getCachedData() {
            const hit = CustomQuickView.responseCache.get(this.getCacheKey());
            const isFresh = hit && Date.now() - hit.time < CustomQuickView.settings.cacheTtl;
            return isFresh ? hit.data : null;
        }

        async requestData(signal) {
            const record = this.getAttribute('record');
            const recordId = this.getAttribute('record-id');
            if (!record || !recordId) throw new Error('Faltan los atributos record y record-id.');

            const cachedData = this.getCachedData();
            if (cachedData) return cachedData;

            const requestUrl = new URL(this.getEndpoint(), window.location.href);
            requestUrl.searchParams.set('recordType', record);
            requestUrl.searchParams.set('recordId', recordId);

            const response = await fetch(requestUrl, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                signal,
            });
            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            if (!data || data.ok === false) throw new Error((data && data.error) || 'Respuesta inválida');

            CustomQuickView.responseCache.set(this.getCacheKey(), { time: Date.now(), data });
            return data;
        }

        async loadData(signal) {
            const data = await this.requestData(signal);

            if (!this.hasAttribute('href') && data.url) {
                const safeHref = CustomQuickView.toSafeUrl(data.url);
                if (safeHref) this.anchor.setAttribute('href', safeHref);
            }
            if (!this.textContent.trim() && data.title) this.fallbackText.textContent = data.title;
            return data;
        }

        get isOpen() {
            return this.popoverHost !== null;
        }

        scheduleOpen() {
            this.cancelClose();
            if (this.isOpen) return;
            clearTimeout(this.openTimer);
            this.openTimer = setTimeout(() => this.open(), CustomQuickView.settings.openDelay);
        }

        scheduleClose() {
            clearTimeout(this.openTimer);
            clearTimeout(this.closeTimer);
            this.closeTimer = setTimeout(() => this.close(), CustomQuickView.settings.closeDelay);
        }

        cancelClose() {
            clearTimeout(this.closeTimer);
        }

        async open() {
            const active = CustomQuickView.activeInstance;
            if (active && active !== this) active.close();
            CustomQuickView.activeInstance = this;

            const currentRun = ++this.runId;
            if (this.requestController) this.requestController.abort();
            this.requestController = new AbortController();

            if (!this.isOpen) this.createPopover();

            // Reservar el tamaño anterior permite posicionar el skeleton como la tarjeta final.
            const cachedData = this.getCachedData();
            if (cachedData) this.showData(cachedData);
            else this.showSkeleton();
            const dataPromise = this.loadData(this.requestController.signal);
            dataPromise.catch(() => {});

            try {
                await this.placePopover(currentRun).catch(() => this.placeWithoutFloating());

                const data = await dataPromise;
                if (currentRun !== this.runId) return;

                if (!data || data.ok === false) {
                    throw new Error((data && data.error) || 'Respuesta inválida');
                }
                if (!cachedData) this.showData(data);
            } catch (error) {
                if (error.name === 'AbortError' || currentRun !== this.runId) return;
                this.showError(error);
            }
        }

        close() {
            clearTimeout(this.openTimer);
            clearTimeout(this.closeTimer);
            this.runId++;

            if (this.requestController) this.requestController.abort();
            if (this.stopAutoUpdate) this.stopAutoUpdate();
            this.stopAutoUpdate = null;

            document.removeEventListener('keydown', this.onKeydown);
            if (this.popoverHost) this.popoverHost.remove();
            this.popoverHost = null;
            this.popoverEl = null;
            this.arrowEl = null;
            this.card = null;

            if (CustomQuickView.activeInstance === this) CustomQuickView.activeInstance = null;
        }

        createPopover() {
            const host = document.createElement('div');
            host.style.cssText =
                'position:fixed;left:0;top:0;right:auto;bottom:auto;margin:0;padding:0;border:0;' +
                'background:transparent;overflow:visible;width:max-content;max-width:none;height:auto;' +
                'z-index:2147483000;visibility:hidden;';

            if (this.supportsTopLayer) host.setAttribute('popover', 'manual');
            else host.style.display = 'none';

            const maxWidth = this.getLimit('max-width', CustomQuickView.settings.maxWidth);
            host.style.setProperty('--max-width', `min(92vw, ${maxWidth}px)`);

            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
        <style>${CustomQuickView.popoverCss}</style>
        <div class="popover" role="dialog" aria-live="polite">
          <div class="arrow"></div>
          <div class="card"></div>
        </div>`;

            host.addEventListener('mouseenter', () => this.cancelClose());
            host.addEventListener('mouseleave', () => this.scheduleClose());
            host.addEventListener('focusin', () => this.cancelClose());
            host.addEventListener('focusout', () => this.scheduleClose());
            document.addEventListener('keydown', this.onKeydown);

            document.body.appendChild(host);

            this.popoverHost = host;
            this.popoverEl = shadow.querySelector('.popover');
            this.arrowEl = shadow.querySelector('.arrow');
            this.card = shadow.querySelector('.card');
        }

        showHost() {
            if (this.supportsTopLayer) {
                if (!this.popoverHost.matches(':popover-open')) this.popoverHost.showPopover();
            } else {
                this.popoverHost.style.display = 'block';
            }
        }

        async placePopover(currentRun) {
            const floating = await CustomQuickView.loadFloatingUI();
            if (currentRun !== this.runId || !this.popoverHost) return;
            if (this.stopAutoUpdate) this.stopAutoUpdate();

            const host = this.popoverHost;
            host.style.visibility = 'hidden';
            this.showHost();

            let isFirstPosition = true;

            const updatePosition = async () => {
                if (!this.popoverHost) return;

                const result = await floating.computePosition(this, host, {
                    strategy: 'fixed',
                    placement: this.getAttribute('placement') || CustomQuickView.settings.placement,
                    middleware: [
                        floating.offset(10),
                        floating.flip({ padding: 8, fallbackAxisSideDirection: 'start' }),
                        floating.shift({ padding: 8 }),
                        floating.size({
                            padding: 8,
                            apply: ({ availableHeight }) => {
                                if (!this.card) return;
                                const limit = this.getLimit('max-height', CustomQuickView.settings.maxHeight);
                                const maxHeight = Math.max(160, Math.min(Math.floor(availableHeight), limit));
                                this.card.style.maxHeight = `${maxHeight}px`;
                                if (this.reservedHeight) {
                                    this.card.style.minHeight = `${Math.min(this.reservedHeight, maxHeight)}px`;
                                }
                            },
                        }),
                        floating.arrow({ element: this.arrowEl, padding: 14 }),
                    ],
                });
                if (!this.popoverHost) return;

                host.style.left = `${result.x}px`;
                host.style.top = `${result.y}px`;
                this.positionArrow(result.placement, result.middlewareData.arrow);

                if (isFirstPosition) {
                    isFirstPosition = false;
                    host.style.visibility = 'visible';
                    this.popoverEl.classList.add('is-visible');
                }
            };

            this.stopAutoUpdate = floating.autoUpdate(this, host, () =>
                updatePosition().catch(() => {
                    if (!isFirstPosition) return;
                    isFirstPosition = false;
                    this.placeWithoutFloating();
                }),
            );
        }

        positionArrow(placement, arrowData = {}) {
            const side = placement.split('-')[0];
            const oppositeSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];

            this.popoverEl.dataset.side = side;
            Object.assign(this.arrowEl.style, {
                left: arrowData.x != null ? `${arrowData.x}px` : '',
                top: arrowData.y != null ? `${arrowData.y}px` : '',
                right: '',
                bottom: '',
                [oppositeSide]: '-6px',
            });
        }

        /** Posición simple (debajo del link) para cuando Floating UI no está disponible. */
        placeWithoutFloating() {
            if (!this.popoverHost) return;
            const rect = this.getBoundingClientRect();
            this.arrowEl.style.display = 'none';
            this.popoverHost.style.left = `${Math.max(8, rect.left)}px`;
            this.popoverHost.style.top = `${rect.bottom + 8}px`;
            this.showHost();
            this.popoverHost.style.visibility = 'visible';
            this.popoverEl.classList.add('is-visible');
        }

        showSkeleton() {
            const skeletonRow =
                '<div class="row"><div class="label"><div class="skeleton skeleton-label"></div></div>' +
                '<div class="value"><div class="skeleton skeleton-value"></div></div></div>';

            this.reservedHeight = CustomQuickView.lastCardHeight;
            this.card.style.minHeight = `${this.reservedHeight}px`;
            const maxWidth = Math.min(
                this.getLimit('max-width', CustomQuickView.settings.maxWidth),
                Math.floor(window.innerWidth * 0.92),
            );
            this.card.style.minWidth = `${Math.min(CustomQuickView.lastCardWidth, maxWidth)}px`;
            this.card.classList.remove('is-loaded');
            this.card.setAttribute('aria-busy', 'true');
            this.card.innerHTML = `
        <div class="header">${CustomQuickView.icons.user}<div class="skeleton skeleton-title"></div></div>
        <div class="body">${skeletonRow.repeat(6)}</div>`;
        }

        showError(error) {
            if (!this.card) return;
            const { escapeHtml } = CustomQuickView;

            this.reservedHeight = 0;
            this.card.style.minHeight = '';
            this.card.style.minWidth = '';
            this.card.classList.remove('is-loaded');
            this.card.removeAttribute('aria-busy');
            this.card.innerHTML = `
        <div class="error"><p>${escapeHtml(error.message || 'No se pudo cargar la información.')}</p></div>`;
        }

        showData(data) {
            if (!this.card) return;
            const { escapeHtml, toSafeUrl, icons } = CustomQuickView;

            const rows = (data.fields || [])
                .map(
                    (field) => `
            <div class="row">
              <div class="label">${escapeHtml(field.label)}</div>
              <div class="value">${this.renderFieldValue(field)}</div>
            </div>`,
                )
                .join('');

            const buttons = (data.actions || [])
                .map((action) => ({ label: action.label, href: toSafeUrl(action.url) }))
                .filter((action) => action.href)
                .map((action) => `<a class="button" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`)
                .join('');

            this.card.removeAttribute('aria-busy');
            this.card.innerHTML = `
        <div class="header">${icons.user}<h2>${escapeHtml(data.title)}</h2></div>
        <div class="body">${rows}</div>
        ${buttons ? `<div class="footer">${buttons}</div>` : ''}`;

            this.reservedHeight = 0;
            this.card.style.minHeight = '';
            this.card.style.minWidth = '';
            this.card.classList.add('is-loaded');
            CustomQuickView.lastCardHeight = this.card.scrollHeight;
            CustomQuickView.lastCardWidth = this.card.offsetWidth;
        }

        renderFieldValue(field) {
            const { escapeHtml, toSafeUrl, getFieldHref, icons } = CustomQuickView;
            const text = String(field.value ?? '');

            if (field.type === 'address') {
                const lines = text
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((line) => `<div>${escapeHtml(line)}</div>`)
                    .join('');
                const mapUrl = toSafeUrl(field.mapUrl);
                const mapLink = mapUrl
                    ? `<a class="link map" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener">${icons.pin}${escapeHtml(field.mapLabel || 'Mapa')}</a>`
                    : '';
                return lines + mapLink;
            }

            const href = toSafeUrl(getFieldHref(field, text));
            if (!href) return escapeHtml(text);

            const opensInNewTab = field.type === 'url' ? ' target="_blank" rel="noopener"' : '';
            return `<a class="link" href="${escapeHtml(href)}"${opensInNewTab}>${escapeHtml(text)}</a>`;
        }
    }

    function createQuickView() {
        CustomQuickView.register();
        return CustomQuickView;
    }

    return { createQuickView };
});
