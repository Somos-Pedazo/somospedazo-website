/**
 * Atribución de marketing del formulario de contacto (Zoho Free: sin campos personalizados).
 * - Lead Source → campo estándar «Lead Source» de Zoho.
 * - El resto → línea técnica al principio de «Description».
 * Lógica en src/utils/atribucion.ts (servidor) y src/scripts/atribucion.ts (navegador).
 */

/** Parámetros de campaña que se leen de la URL de aterrizaje. */
export const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export const CLICK_IDS = ['gclid', 'fbclid', 'li_fat_id', 'ttclid', 'msclkid'] as const;

/** Datos que el navegador persiste y envía con el formulario (campos ocultos con estos `name`). */
export const CAMPOS_ATRIBUCION = ['landing_page', 'referrer', 'touch_ts', ...UTM, ...CLICK_IDS] as const;
export type CampoAtribucion = (typeof CAMPOS_ATRIBUCION)[number];
export type Atribucion = Record<CampoAtribucion, string>;

/** Campo oculto con la URL completa desde la que se envía el formulario. */
export const CAMPO_SUBMISSION_URL = 'submission_url';

/**
 * Persistencia en localStorage. Reglas (src/scripts/atribucion.ts):
 * - Visita con UTM, click IDs o referrer externo → reemplaza el registro (nuevos touch_ts,
 *   landing_page, referrer y parámetros) y renueva la caducidad de 90 días.
 * - Visita directa (sin parámetros y sin referrer externo) → no modifica un registro vigente;
 *   si no hay registro, se guarda. El referrer del propio dominio cuenta como directo.
 * - El registro no se borra tras enviar el formulario; solo caduca o se borra si se retira
 *   el consentimiento.
 */
export const PERSISTENCIA = {
  clave: 'sp_atribucion',
  caducidadDias: 90,
  /**
   * Guardar la atribución en el navegador es almacenamiento no necesario (LSSI art. 22.2):
   * solo se persiste si el visitante acepta esta categoría en Cookiebot. Sin consentimiento,
   * el formulario envía igualmente la atribución de la visita en curso, sin guardarla.
   * Clasifica la clave `sp_atribucion` como «Marketing» en el panel de Cookiebot.
   */
  requiereConsentimiento: true,
  categoriaCookiebot: 'marketing' as 'marketing' | 'statistics' | 'preferences',
};

/**
 * Valores de la lista desplegable «Lead Source» de Zoho, calcados (mayúsculas, espacios y
 * paréntesis). Zoho descarta cualquier valor que no coincida exactamente. «Manual creation»
 * existe en Zoho pero queda reservado a los leads creados a mano: la web nunca lo envía.
 */
export const LEAD_SOURCE_ZOHO = [
  'Campaign (UTM)',
  'Direct',
  'Facebook Ads',
  'Google Ads',
  'LinkedIn Ads',
  'Manual creation',
  'Microsoft Ads',
  'Organic',
  'Referral',
  'TikTok Ads',
] as const;

/** Valores que la web puede enviar: todos los de la lista salvo «Manual creation». */
export type LeadSource = Exclude<(typeof LEAD_SOURCE_ZOHO)[number], 'Manual creation'>;

/** Click ID → valor de Lead Source, en orden de prioridad. */
export const ORIGEN_POR_CLICK_ID: [(typeof CLICK_IDS)[number], LeadSource][] = [
  ['gclid', 'Google Ads'],
  ['fbclid', 'Facebook Ads'],
  ['msclkid', 'Microsoft Ads'],
  ['ttclid', 'TikTok Ads'],
  ['li_fat_id', 'LinkedIn Ads'],
];

/** Dominios de buscadores: un referrer de estos cuenta como «Organic». */
export const BUSCADORES = [
  'google.',
  'bing.com',
  'yahoo.',
  'duckduckgo.com',
  'ecosia.org',
  'yandex.',
  'baidu.com',
  'search.brave.com',
  'qwant.com',
  'startpage.com',
  'ask.com',
  'naver.com',
  'seznam.cz',
] as const;

/** Orden exacto de las claves de la línea técnica de «Description» (18 claves, siempre presentes). */
export const CLAVES_LINEA = [
  'submission_url',
  'landing_page',
  'referrer',
  'touch_ts',
  'lead_source',
  ...UTM,
  ...CLICK_IDS,
  'privacy_consent',
  'newsletter_consent',
  'captcha_verification',
] as const;
