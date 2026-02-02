// Vite config for GitHub Pages deployment
import {defineConfig} from 'vite';

export default defineConfig({
    base: '/pavlos-taxi/',
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
