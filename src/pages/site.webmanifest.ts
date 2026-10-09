import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: SITE.name,
      short_name: SITE.name,
      description: SITE.description,
      lang: SITE.locale,
      start_url: '/',
      display: 'browser',
      background_color: '#F5F1E6',
      theme_color: SITE.themeColor,
      icons: [
        { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
