/**
 * Campos del formulario de contacto (compartido entre navegador y servidor).
 * Los nombres son los de Zoho CRM Web-to-Lead: respetar mayúsculas y espacios.
 * Los campos ocultos de Zoho (xnQsjsdp, xmIwtLD, actionType) solo existen en el
 * servidor: src/server/zoho.ts.
 */
export const CAMPOS = {
  nombre: { name: 'First Name', max: 40, obligatorio: true },
  apellidos: { name: 'Last Name', max: 80, obligatorio: true },
  email: { name: 'Email', max: 100, obligatorio: true },
  empresa: { name: 'Company', max: 200, obligatorio: false },
  telefono: { name: 'Phone', max: 30, obligatorio: false },
  mensaje: { name: 'Description', max: 5000, obligatorio: true },
} as const;

/** Honeypot de Zoho: debe llegar vacío. */
export const HONEYPOT = 'aG9uZXlwb3Q';

/**
 * Casillas de consentimiento. No son campos de Zoho: el servidor registra su valor, con fecha
 * y hora ISO 8601, en la línea técnica de «Description» (privacy_consent / newsletter_consent).
 */
export const CAMPO_PRIVACIDAD = 'privacidad';
export const CAMPO_NEWSLETTER = 'newsletter';

/**
 * Campo estándar «Lead Source» de Zoho (lista desplegable cerrada). Zoho descarta cualquier valor
 * que no coincida exactamente con la lista: los valores permitidos están en LEAD_SOURCE_ZOHO
 * (src/config/atribucion.ts).
 */
export const CAMPO_LEAD_SOURCE = 'Lead Source';

/**
 * Campo estándar «Email Opt Out» de Zoho (casilla). Es la negación del consentimiento de newsletter:
 *   newsletter marcada    → Email Opt Out = false (sí quiere recibir)
 *   newsletter sin marcar → Email Opt Out = true  (no quiere recibir)
 * En Description, newsletter_consent refleja lo que marcó la persona, sin invertir.
 */
export const CAMPO_EMAIL_OPT_OUT = 'Email Opt Out';

/**
 * Valores que se envían en el POST para cada estado de la casilla. El formulario web de Zoho
 * envía una casilla marcada como «on» (lo que manda un <input type="checkbox"> HTML); el valor
 * «true» no lo reconoció en las pruebas del PR #7 (los leads quedaron con Email Opt Out = false).
 * Si tu formulario de Zoho espera otro valor, cámbialo aquí.
 */
export const EMAIL_OPT_OUT_VALOR = { marcado: 'on', desmarcado: 'false' } as const;

/** Campo en el que Turnstile deja su token. */
export const CAMPO_TURNSTILE = 'cf-turnstile-response';

/** Formato de correo más estricto que el de type="email" (exige dominio con punto). */
export const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

/** Site key de Turnstile (pública). La variable de entorno tiene prioridad. */
export const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFScGVcpAqXY-59a';
