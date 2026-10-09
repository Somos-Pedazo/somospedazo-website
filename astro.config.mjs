// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Dominio de producción. Mantener sincronizado con SITE.url en src/config/site.ts.
const SITE_URL = 'https://somospedazo.com';

// Páginas que no deben indexarse (también llevan <meta name="robots" content="noindex">).
const NOINDEX = ['/404'];

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  // Todo el sitio se genera estático. Solo las rutas con `export const prerender = false`
  // (src/pages/api/contact.ts) se ejecutan como función de servidor en Vercel.
  output: 'static',
  adapter: vercel(),
  build: {
    inlineStylesheets: 'always',
  },
  prefetch: false,
  vite: {
    build: {
      rolldownOptions: {
        treeshake: {
          // @astrojs/vercel 11.0.13: su entrypoint de servidor importa constantes de su
          // integración de build, que importa `rolldown` y `@vercel/routing-utils`. Como el
          // paquete no declara `sideEffects: false`, esas importaciones vacías quedaban en la
          // función y `rolldown` falla al cargar su binario nativo en Vercel
          // (FUNCTION_INVOCATION_FAILED). Se marcan sin efectos para que se eliminen.
          moduleSideEffects: (id, external) => !(external && (id === 'rolldown' || id === '@vercel/routing-utils')),
        },
      },
    },
  },
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
