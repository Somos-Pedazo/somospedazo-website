// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio de producción. Mantener sincronizado con SITE.url en src/config/site.ts.
const SITE_URL = 'https://somospedazo.com';

// Páginas que no deben indexarse (también llevan <meta name="robots" content="noindex">).
const NOINDEX = ['/404', '/aviso-legal', '/privacidad', '/cookies'];

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '') || '/';
        return !NOINDEX.includes(path);
      },
      changefreq: 'monthly',
    }),
  ],
});
