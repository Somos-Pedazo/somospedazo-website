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
 * Casilla de newsletter (opcional). No es un campo de Zoho: el servidor registra su valor,
 * con fecha y hora, al final de «Description» del lead como prueba del consentimiento.
 * Si se crea un campo propio en Zoho, pon aquí su nombre de API en ZOHO_CAMPO_NEWSLETTER
 * y el servidor lo enviará también en ese campo.
 */
export const CAMPO_NEWSLETTER = 'newsletter';
export const ZOHO_CAMPO_NEWSLETTER: string | null = null;

/** Campo en el que Turnstile deja su token. */
export const CAMPO_TURNSTILE = 'cf-turnstile-response';

/** Formato de correo más estricto que el de type="email" (exige dominio con punto). */
export const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

/** Site key de Turnstile (pública). La variable de entorno tiene prioridad. */
export const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFScGVcpAqXY-59a';
