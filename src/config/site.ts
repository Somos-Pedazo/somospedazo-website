/**
 * Fuente única de datos de la empresa.
 * Todo lo que aparece en SEO, JSON-LD y textos legales sale de aquí.
 * Los campos marcados con TODO están sin confirmar: complétalos antes de publicar.
 */
export const SITE = {
  name: 'Somos Pedazo',
  legalName: 'Somos Pedazo', // TODO: razón social completa (p. ej. «Somos Pedazo, S.L.»)
  url: 'https://somospedazo.com', // TODO: confirmar dominio (sincronizar con astro.config.mjs)
  locale: 'es-ES',
  ogLocale: 'es_ES',
  slogan: 'Cada uno aporta su pedazo. Juntos, encajamos.',
  /** Categoría que aparece en portada, títulos y datos estructurados. */
  categoria: 'Agencia de estrategia y growth',
  description:
    'Agencia de estrategia y growth. Unimos estrategia, marketing y tecnología para que tu negocio crezca con un plan claro.',
  /** No se muestra en Contacto ni en el pie; solo en textos legales y datos estructurados. */
  email: 'hola@somospedazo.com', // TODO: confirmar
  /** Opcional. Si se rellena, se añade a los datos estructurados (formato +34 600 000 000). */
  telephone: undefined as string | undefined,
  /**
   * Datos registrales exigidos por la LSSI (art. 10) en el aviso legal.
   * Si quedan vacíos, la línea correspondiente no se muestra y el build avisa.
   */
  legal: {
    nif: '', // TODO: NIF/CIF
    registro: '', // TODO: p. ej. «Registro Mercantil de Madrid, tomo X, folio Y, hoja M-Z»
  },
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
