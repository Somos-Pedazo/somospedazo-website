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
 * Campo estándar «Email Opt Out» de Zoho (casilla). Lógica inversa a la newsletter:
 * sin newsletter → «true» (no enviar comunicaciones comerciales); con newsletter → no se envía
 * (casilla sin marcar, como hace un formulario HTML).
 * En Description, newsletter_consent refleja lo que marcó la persona, sin invertir.
 */
export const CAMPO_EMAIL_OPT_OUT = 'Email Opt Out';

/** Campo en el que Turnstile deja su token. */
export const CAMPO_TURNSTILE = 'cf-turnstile-response';

/** Formato de correo más estricto que el de type="email" (exige dominio con punto). */
export const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

/** Site key de Turnstile (pública). La variable de entorno tiene prioridad. */
export const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFScGVcpAqXY-59a';
