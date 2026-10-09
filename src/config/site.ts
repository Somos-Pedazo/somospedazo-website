/**
 * Fuente única de datos de la empresa.
 * Todo lo que aparece en SEO, JSON-LD, pie y contacto sale de aquí.
 * Los campos marcados con TODO son provisionales: confírmalos antes de publicar.
 */
export const SITE = {
  name: 'Somos Pedazo',
  legalName: 'Somos Pedazo', // TODO: razón social completa (S.L., etc.)
  url: 'https://somospedazo.com', // TODO: confirmar dominio (sincronizar con astro.config.mjs)
  locale: 'es-ES',
  ogLocale: 'es_ES',
  slogan: 'Cada uno aporta su pedazo. Juntos, encajamos.',
  description:
    'Agencia de estrategia digital. Unimos marketing, tecnología y estrategia para que tu negocio crezca con un plan claro.',
  email: 'hola@somospedazo.com', // TODO: confirmar
  telephone: '+34 600 000 000', // TODO: teléfono real (formato E.164 en JSON-LD)
  address: {
    // TODO: dirección real. Google necesita una dirección válida para LocalBusiness.
    streetAddress: 'Calle Ejemplo, 1',
    addressLocality: 'Madrid',
    addressRegion: 'Comunidad de Madrid',
    postalCode: '28001',
    addressCountry: 'ES',
  },
  geo: null as null | { latitude: number; longitude: number }, // TODO: coordenadas si se quieren
  openingHours: ['Mo-Fr 09:00-18:00'],
  priceRange: '€€',
  areaServed: 'España',
  foundingDate: undefined as string | undefined, // TODO: p. ej. '2024'
  sameAs: [
    // TODO: perfiles reales, p. ej. 'https://www.linkedin.com/company/somospedazo'
  ] as string[],
  twitterHandle: undefined as string | undefined, // TODO: p. ej. '@somospedazo'
  themeColor: '#0F1B3B',
} as const;

export type NavItem = { href: string; label: string };

export const NAV: NavItem[] = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/enfoque', label: 'Enfoque' },
  { href: '/contacto', label: 'Contacto' },
];

export const LEGAL_NAV: NavItem[] = [
  { href: '/aviso-legal', label: 'Aviso legal' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/cookies', label: 'Cookies' },
];

/** Construye una URL absoluta y canónica (sin barra final, salvo la raíz). */
export function absoluteUrl(path = '/'): string {
  const clean = path === '/' ? '/' : path.replace(/\/+$/, '');
  return new URL(clean, SITE.url).href;
}
