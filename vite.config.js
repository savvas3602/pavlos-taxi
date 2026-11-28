// Vite config for GitHub Pages deployment
import path from 'node:path';
import {defineConfig, normalizePath} from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import {PHONE_DISPLAY, WHATSAPP_URL, TEL_HREF, MAILTO_HREF, SITE_URL, OG_IMAGE} from './src/config.js';
import {imagetools} from 'vite-imagetools'

// Adds tags worked out from each page to its <head>, at build time and in dev:
// - the canonical link: the page's one official address for search engines
//   (GitHub Pages also serves the homepage as .../index.html);
// - the link-preview tags (Open Graph) that WhatsApp, Telegram, Facebook etc.
//   read when someone shares the page. They're copied from the page's own
//   <title> and <meta name="description">, which stay plain HTML in each
//   source page: written once, and SonarQube/linters see a normal page.
//   X/Twitter falls back to the og:* tags; twitter:card only picks its
//   large-image layout.
// The page's address comes from its file path. The preview picture is made
// by scripts/generate-og-image.mjs.
function pageMetaTags() {
    let root;
    return {
        name: 'page-meta-tags',
        configResolved(config) {
            root = config.root;
        },
        transformIndexHtml(html, ctx) {
            const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim();
            const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1];
            if (!title || !description) {
                throw new Error(`[page-meta-tags] ${ctx.filename} needs a <title> and a <meta name="description" content="...">`);
            }
            // "services.html"; "" for the homepage; "ru/" for a future ru/index.html
            const pagePath = normalizePath(path.relative(root, ctx.filename)).replace(/(^|\/)index\.html$/, '$1');
            const pageUrl = SITE_URL + pagePath;
            const ogTags = [
                ['og:type', 'website'],
                ['og:site_name', "Paul's Airport Taxi"],
                ['og:title', title.replaceAll('"', '&quot;')], // text content -> attribute value
                ['og:description', description], // already escaped as an attribute value
                ['og:url', pageUrl],
                ['og:image', SITE_URL + OG_IMAGE.file],
                ['og:image:width', OG_IMAGE.width],
                ['og:image:height', OG_IMAGE.height],
                ['og:image:alt', "Paul's Airport Taxi logo: a yellow Mercedes taxi in front of Larnaca Airport's control tower"],
            ].map(([property, content]) => `<meta property="${property}" content="${content}"/>`);
            const tags = [
                `<link rel="canonical" href="${pageUrl}"/>`,
                ...ogTags,
                '<meta name="twitter:card" content="summary_large_image"/>',
            ];
            return html.replace('</head>', `    ${tags.join('\n    ')}\n</head>`);
        },
    };
}

export default defineConfig({
    base: '/pavlos-taxi/',
    plugins: [injectHTML(), imagetools(), pageMetaTags()],
    define: {
        // Config values that will substitute %VITE_*% placeholders
        'import.meta.env.VITE_PHONE_DISPLAY': JSON.stringify(PHONE_DISPLAY),
        'import.meta.env.VITE_WHATSAPP_URL': JSON.stringify(WHATSAPP_URL),
        'import.meta.env.VITE_TEL_HREF': JSON.stringify(TEL_HREF),
        'import.meta.env.VITE_MAILTO_HREF': JSON.stringify(MAILTO_HREF),
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: 'index.html',
                fleet: 'fleet.html',
                contact: 'contact.html',
                services: 'services.html',
                airport_transfers: 'airport-transfers.html'
            }
        }
    }
});
