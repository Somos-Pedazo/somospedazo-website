/**
 * Verificación de tokens de Cloudflare Turnstile en el servidor, en CADA envío.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Se rechaza (no se envía nada a Zoho) si:
 *  - falta el token o no tiene un formato plausible;
 *  - siteverify responde con error o con success distinto de true;
 *  - el hostname de la respuesta no es uno de los permitidos (en producción, solo somospedazo.com);
 *  - en producción, la clave secreta configurada es una clave de test de Cloudflare.
 */
import { HOSTNAMES_TURNSTILE, esClaveTestTurnstile } from '../config/zoho';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Cloudflare: los tokens tienen como máximo 2048 caracteres. */
const MAX_TOKEN = 2048;

/** Respuesta de siteverify (campos que usamos). */
export type RespuestaSiteverify = {
  success?: boolean;
  hostname?: string;
  challenge_ts?: string;
  action?: string;
  'error-codes'?: string[];
};

export type Verificacion = { ok: true; datos: RespuestaSiteverify } | { ok: false; codigos: string[] };

/** Producción de Vercel (no previews ni local). Se lee en tiempo de ejecución. */
export function esProduccion(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Clave secreta. En el build, Astro sustituye import.meta.env por su valor;
 * process.env es el respaldo en tiempo de ejecución si no estaba disponible al compilar.
 */
function claveSecreta(): string | undefined {
  return import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || undefined;
}

/**
 * Hostnames aceptados en la respuesta de Cloudflare.
 * - Producción: solo somospedazo.com.
 * - Fuera de producción (local y previews) se admite además el de las claves de test
 *   (example.com) y localhost, para poder desarrollar y probar.
 */
function hostnamesPermitidos(secret: string): readonly string[] {
  if (esProduccion()) return HOSTNAMES_TURNSTILE;
  return [...HOSTNAMES_TURNSTILE, 'localhost', ...(esClaveTestTurnstile(secret) ? ['example.com'] : [])];
}

export async function verificarTurnstile(token: string, ip: string | undefined): Promise<Verificacion> {
  const secret = claveSecreta();
  if (!secret) throw new Error('Falta la variable de entorno TURNSTILE_SECRET_KEY');
  // Las claves de test aprueban cualquier token: jamás en producción.
  if (esProduccion() && esClaveTestTurnstile(secret)) {
    throw new Error('TURNSTILE_SECRET_KEY es una clave de test de Cloudflare: no se admite en producción');
  }
  if (!token) return { ok: false, codigos: ['missing-input-response'] };
  if (token.length > MAX_TOKEN) return { ok: false, codigos: ['invalid-input-response'] };

  const cuerpo = new URLSearchParams({ secret, response: token });
  if (ip) cuerpo.append('remoteip', ip);

  const res = await fetch(SITEVERIFY, { method: 'POST', body: cuerpo, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return { ok: false, codigos: [`http-${res.status}`] };

  const datos = (await res.json()) as RespuestaSiteverify;
  if (datos.success !== true) return { ok: false, codigos: datos['error-codes'] ?? ['success-false'] };

  const hostname = (datos.hostname ?? '').toLowerCase();
  if (!hostnamesPermitidos(secret).includes(hostname)) {
    return { ok: false, codigos: [`hostname-no-permitido:${hostname || 'vacío'}`] };
  }
  return { ok: true, datos };
}
