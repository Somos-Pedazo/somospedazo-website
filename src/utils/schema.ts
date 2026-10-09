import { SITE, absoluteUrl } from '../config/site';
import type { Pagina } from '../data/paginas';

type Nodo = Record<string, unknown>;

export const IDS = {
  organization: absoluteUrl('/#organization'),
  localBusiness: absoluteUrl('/#localbusiness'),
  website: absoluteUrl('/#website'),
  logo: absoluteUrl('/#logo'),
};

/** Teléfono en formato E.164, solo si está configurado. */
const telefono = SITE.telephone ? { telephone: SITE.telephone.replace(/[^\d+]/g, '') } : {};

export function organization(): Nodo {
  return {
    '@type': 'Organization',
    '@id': IDS.organization,
    name: SITE.name,
    legalName: SITE.legalName,
    url: absoluteUrl('/'),
    description: SITE.description,
    slogan: SITE.slogan,
    email: SITE.email,
    ...telefono,
    // PLACEHOLDER LOGO: sustituir por el PNG/SVG definitivo (mín. 112×112 px).
    logo: {
      '@type': 'ImageObject',
      '@id': IDS.logo,
      url: absoluteUrl('/logo.png'),
      contentUrl: absoluteUrl('/logo.png'),
      width: 512,
      height: 512,
      caption: SITE.name,
    },
    image: { '@id': IDS.logo },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: SITE.email,
      ...telefono,
      areaServed: 'ES',
      availableLanguage: ['es'],
    },
    knowsAbout: ['Estrategia de negocio', 'Growth marketing', 'Marketing digital', 'Transformación digital', 'Gestión de proyectos (PMO)'],
    ...(SITE.foundingDate ? { foundingDate: SITE.foundingDate } : {}),
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function localBusiness(): Nodo {
  return {
    '@type': 'ProfessionalService',
    '@id': IDS.localBusiness,
    name: SITE.name,
    url: absoluteUrl('/'),
    description: SITE.description,
    image: absoluteUrl('/og/inicio.png'),
    logo: { '@id': IDS.logo },
    email: SITE.email,
    ...telefono,
    priceRange: SITE.priceRange,
    address: { '@type': 'PostalAddress', ...SITE.address },
    ...(SITE.geo ? { geo: { '@type': 'GeoCoordinates', ...SITE.geo } } : {}),
    openingHours: SITE.openingHours,
    areaServed: { '@type': 'Country', name: SITE.areaServed },
    parentOrganization: { '@id': IDS.organization },
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function website(): Nodo {
  return {
    '@type': 'WebSite',
    '@id': IDS.website,
    url: absoluteUrl('/'),
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.locale,
    publisher: { '@id': IDS.organization },
  };
}

export function webPage(pagina: Pagina, tipo = 'WebPage'): Nodo {
  const url = absoluteUrl(pagina.path);
  return {
    '@type': tipo,
    '@id': `${url}#webpage`,
    url,
    name: pagina.title,
    description: pagina.description,
    inLanguage: SITE.locale,
    isPartOf: { '@id': IDS.website },
    about: { '@id': IDS.organization },
    primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl(`/og/${pagina.slug}.png`) },
    ...(pagina.path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  };
}

export function breadcrumb(pagina: Pagina): Nodo | null {
  if (pagina.path === '/') return null;
  const url = absoluteUrl(pagina.path);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: pagina.nombre, item: url },
    ],
  };
}

/** Serializa un @graph de forma segura para incrustarlo en <script>. */
export function grafo(nodos: (Nodo | null)[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodos.filter(Boolean) }).replace(/</g, '\\u003c');
}
