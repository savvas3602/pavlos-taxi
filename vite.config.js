// Vite config for GitHub Pages deployment
import {defineConfig} from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import {PHONE_DISPLAY, WHATSAPP_URL, TEL_HREF, MAILTO_HREF} from './src/config.js';

export default defineConfig({
    base: '/pavlos-taxi/',
    plugins: [injectHTML()],
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
