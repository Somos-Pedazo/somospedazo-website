/**
 * Cookiebot (Usercentrics) · plataforma de gestión del consentimiento.
 * El identificador es público: aparece en el HTML de todas las páginas.
 *
 * - uc.js se carga como PRIMER elemento del <head> (BaseLayout) en modo de bloqueo
 *   automático: bloquea los scripts que instalan cookies hasta que hay consentimiento.
 * - No exceptúes del bloqueo las herramientas de analítica o marketing (p. ej. Google
 *   Analytics): Cookiebot debe gestionarlas.
 * - data-culture="ES": banner y declaración siempre en castellano (la web solo está en es-ES).
 * - Solo se exceptúa (data-cookieconsent="ignore") lo estrictamente necesario:
 *   Cloudflare Turnstile, sin el que no se puede enviar el formulario.
 */
export const COOKIEBOT_ID = '19bdea76-9992-4a04-ac09-8ec3d6c128fb';

export const COOKIEBOT_UC = 'https://consent.cookiebot.com/uc.js';
export const COOKIEBOT_DECLARACION = `https://consent.cookiebot.com/${COOKIEBOT_ID}/cd.js`;
