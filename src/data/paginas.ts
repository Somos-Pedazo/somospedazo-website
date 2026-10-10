/**
 * Metadatos SEO por página. Títulos ≤ 60 caracteres y descripciones de
 * 120 a 160, únicos en todo el sitio. También alimentan las imágenes Open Graph.
 */
export type Pagina = {
  slug: string;
  path: string;
  /** Nombre corto para menú y migas de pan. */
  nombre: string;
  title: string;
  description: string;
  /** Texto grande de la imagen Open Graph. */
  ogTitulo: string;
  noindex?: boolean;
};

const definir = <T extends Record<string, Pagina>>(p: T) => p;

export const PAGINAS = definir({
  inicio: {
    slug: 'inicio',
    path: '/',
    nombre: 'Inicio',
    title: 'Somos Pedazo · Agencia de estrategia y growth',
    description:
      'Agencia de estrategia y growth: unimos estrategia, marketing y tecnología. Auditamos, planificamos y ejecutamos contigo para que tu negocio crezca.',
    ogTitulo: 'Tu negocio tiene piezas sueltas. Nosotros las encajamos.',
  },
  servicios: {
    slug: 'servicios',
    path: '/servicios',
    nombre: 'Servicios',
    title: 'Servicios: auditoría, PMO y ejecución · Somos Pedazo',
    description:
      'Elige tu escalón: auditoría y plan estratégico, seguimiento tipo PMO con tu equipo o ejecución completa del plan. Tú decides hasta dónde subimos.',
    ogTitulo: 'Elige tu escalón: diagnóstico, acompañamiento o ejecución.',
  },
  enfoque: {
    slug: 'enfoque',
    path: '/enfoque',
    nombre: 'Enfoque',
    title: 'Nuestro enfoque: estrategia clara y cercana · Somos Pedazo',
    description:
      'Así trabajamos: hablamos claro, priorizamos lo que mueve tu negocio y medimos resultados. Cada uno aporta su pedazo. Juntos, encajamos.',
    ogTitulo: 'Cada uno aporta su pedazo. Juntos, encajamos.',
  },
  contacto: {
    slug: 'contacto',
    path: '/contacto',
    nombre: 'Contacto',
    title: 'Contacto: cuéntanos tu proyecto · Somos Pedazo',
    description:
      'Cuéntanos tu proyecto y hablamos sin compromiso. Vemos juntos qué escalón te encaja: diagnóstico, acompañamiento o ejecución del plan.',
    ogTitulo: 'Cuéntanos tu proyecto. Hablamos.',
  },
  avisoLegal: {
    slug: 'aviso-legal',
    path: '/aviso-legal',
    nombre: 'Aviso legal',
    title: 'Aviso legal · Somos Pedazo',
    description: 'Aviso legal de Somos Pedazo: datos del titular del sitio web, condiciones de uso, propiedad intelectual, responsabilidad y legislación aplicable.',
    ogTitulo: 'Aviso legal',
  },
  privacidad: {
    slug: 'privacidad',
    path: '/privacidad',
    nombre: 'Política de privacidad',
    title: 'Política de privacidad · Somos Pedazo',
    description: 'Política de privacidad de Somos Pedazo: qué datos tratamos, con qué finalidad, durante cuánto tiempo y cómo ejercer tus derechos.',
    ogTitulo: 'Política de privacidad',
  },
  cookies: {
    slug: 'cookies',
    path: '/cookies',
    nombre: 'Política de cookies',
    title: 'Política de cookies · Somos Pedazo',
    description: 'Política de cookies de Somos Pedazo: qué cookies usamos, para qué sirven, cuánto duran y cómo cambiar o retirar tu consentimiento.',
    ogTitulo: 'Política de cookies',
  },
  noEncontrada: {
    slug: '404',
    path: '/404',
    nombre: 'Página no encontrada',
    title: 'Página no encontrada · Somos Pedazo',
    description: 'Esta página no existe o ha cambiado de sitio. Vuelve al inicio o descubre nuestros servicios de estrategia, growth, marketing y tecnología.',
    ogTitulo: 'Este pedazo no está aquí.',
    noindex: true,
  },
});

export type ClavePagina = keyof typeof PAGINAS;
