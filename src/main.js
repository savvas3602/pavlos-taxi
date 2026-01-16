// Web Components for shared UI fragments with template caching
// Components are using light-dom as all are intended to be styled by global bootstrap CSS
const templateCache = new Map();

async function loadTemplate(path) {
    if (templateCache.has(path)) {
        return templateCache.get(path);
    }

    const res = await fetch(path, {credentials: 'same-origin'});
    if (!res.ok) {
        throw new Error(`Failed to load template: ${path} (${res.status})`);
    }

    const html = await res.text();
    templateCache.set(path, html);
    return html;
}

class HtmlFragmentElement extends HTMLElement {
    constructor(templatePath, useShadow = true) {
        super();
        this.templatePath = templatePath;
        this.useShadow = useShadow;
        this.root = useShadow
            ? this.attachShadow({mode: 'open'})
            : this;

        this._rendered = false;
    }

    async connectedCallback() {
        if (this._rendered) return;
        try {
            this.root.innerHTML = await loadTemplate(this.templatePath);
            this._rendered = true;
        } catch (e) {
            console.error(e);
        }
    }
}

class AppNavbar extends HtmlFragmentElement {
    constructor() {
        super('./src/navbar.html', false);
    }
}

class AppLanguageModal extends HtmlFragmentElement {
    constructor() {
        super('./src/language-modal.html', false);
    }
}

class AppFooter extends HtmlFragmentElement {
    constructor() {
        super('./src/footer.html', false);
    }
}

class AppWhatsappBubble extends HtmlFragmentElement {
    constructor() {
        super('./src/whatsapp-bubble.html', false);
    }
}

// Ensure components are only defined once in browsers custom elements registry
if (!customElements.get('app-navbar')) customElements.define('app-navbar', AppNavbar);
if (!customElements.get('app-language-modal')) customElements.define('app-language-modal', AppLanguageModal);
if (!customElements.get('app-footer')) customElements.define('app-footer', AppFooter);
if (!customElements.get('app-whatsapp-bubble')) customElements.define('app-whatsapp-bubble', AppWhatsappBubble);
