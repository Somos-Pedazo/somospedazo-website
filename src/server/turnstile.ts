/**
 * Verificación de tokens de Cloudflare Turnstile en el servidor.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Respuesta de siteverify (campos que usamos). */
export type RespuestaSiteverify = {
  success?: boolean;
  hostname?: string;
  challenge_ts?: string;
  action?: string;
  'error-codes'?: string[];
};

export type Verificacion = { ok: true; datos: RespuestaSiteverify } | { ok: false; codigos: string[] };

/**
 * Clave secreta. En el build, Astro sustituye import.meta.env por su valor;
 * process.env es el respaldo en tiempo de ejecución si no estaba disponible al compilar.
 */
function claveSecreta(): string | undefined {
  return import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || undefined;
}

export async function verificarTurnstile(token: string, ip: string | undefined): Promise<Verificacion> {
  const secret = claveSecreta();
  if (!secret) throw new Error('Falta la variable de entorno TURNSTILE_SECRET_KEY');
  if (!token) return { ok: false, codigos: ['missing-input-response'] };

  const cuerpo = new URLSearchParams({ secret, response: token });
  if (ip) cuerpo.append('remoteip', ip);

  const res = await fetch(SITEVERIFY, { method: 'POST', body: cuerpo, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return { ok: false, codigos: [`http-${res.status}`] };

  const datos = (await res.json()) as RespuestaSiteverify;
  return datos.success === true ? { ok: true, datos } : { ok: false, codigos: datos['error-codes'] ?? [] };
}
