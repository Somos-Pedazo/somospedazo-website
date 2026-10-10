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
  /** Contacto para privacidad y ejercicio de derechos (política de privacidad y de cookies). */
  emailPrivacidad: 'dpo@somospedazo.com',
  /** Opcional. Si se rellena, se añade a los datos estructurados (formato +34 600 000 000). */
  telephone: undefined as string | undefined,
  /**
   * Datos del titular para los textos legales (LSSI art. 10 y RGPD art. 13).
   * Si NIF o registro quedan vacíos, su línea no se muestra y el build avisa.
   */
  legal: {
    nif: '', // TODO: NIF/CIF
    registro: '', // TODO: p. ej. «Inscrita en el Registro Mercantil de Madrid, Tomo X, Folio X, Hoja M-XXXXXX» (vacío si es persona física)
    /** Juzgados y tribunales competentes (aviso legal, apartado 9). */
    jurisdiccion: 'Madrid', // TODO: confirmar
    /** Fecha de «Última actualización» de los textos legales. */
    actualizado: '10/10/2026',
  },
  /**
   * Domicilio. Opcional: de momento no se publica. Si se rellena, se añade a los datos
   * estructurados (LocalBusiness). Formato:
   * { streetAddress: 'Calle…, 1', addressLocality: 'Madrid', addressRegion: 'Comunidad de Madrid', postalCode: '28001', addressCountry: 'ES' }
   */
  address: undefined as
    | undefined
    | { streetAddress: string; addressLocality: string; addressRegion: string; postalCode: string; addressCountry: string },
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
