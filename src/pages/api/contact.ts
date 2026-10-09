/**
 * POST /api/contact · Recibe el formulario de contacto, valida el captcha
 * (Cloudflare Turnstile) y los campos, y reenvía el lead a Zoho CRM.
 * Única ruta del sitio que se ejecuta en servidor (función de Vercel).
 *
 * Respuestas: 200 { ok: true } · 4xx/5xx { ok: false, error }
 *   error: 'captcha' | 'validacion' | 'zoho' | 'servidor'
 */
import type { APIContext, APIRoute } from 'astro';
import { CAMPOS, CAMPO_TURNSTILE, EMAIL_RE, HONEYPOT } from '../../config/zoho';
import { verificarTurnstile } from '../../server/turnstile';
import { enviarAZoho } from '../../server/zoho';

export const prerender = false;

type CodigoError = 'captcha' | 'validacion' | 'zoho' | 'servidor';

const json = (estado: number, cuerpo: { ok: true } | { ok: false; error: CodigoError; campos?: string[] }) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Primera IP de x-forwarded-for (la del visitante en Vercel); si falta, la que da el adaptador. */
function ipCliente(contexto: APIContext): string | undefined {
  const xff = contexto.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (xff) return xff;
  try {
    return contexto.clientAddress || undefined;
  } catch {
    return undefined; // el adaptador no expone la IP
  }
}

/** Normaliza y valida los campos visibles. Devuelve los datos para Zoho o la lista de campos no válidos. */
function validar(form: FormData): { ok: true; datos: Record<string, string> } | { ok: false; campos: string[] } {
  const datos: Record<string, string> = {};
  const invalidos: string[] = [];

  for (const { name, max, obligatorio } of Object.values(CAMPOS)) {
    const bruto = form.get(name);
    const valor = typeof bruto === 'string' ? bruto.trim() : '';
    if ((obligatorio && !valor) || valor.length > max) invalidos.push(name);
    else if (valor) datos[name] = valor;
  }

  const email = datos[CAMPOS.email.name];
  if (email && !EMAIL_RE.test(email)) invalidos.push(CAMPOS.email.name);

  return invalidos.length ? { ok: false, campos: invalidos } : { ok: true, datos };
}

export const POST: APIRoute = async (contexto) => {
  const { request } = contexto;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'validacion' });
  }

  // Honeypot relleno: casi seguro un bot. Respondemos como si todo fuera bien y no enviamos nada.
  const trampa = form.get(HONEYPOT);
  if (typeof trampa === 'string' && trampa !== '') return json(200, { ok: true });

  // 1. Captcha. Sin verificación correcta no se envía nada a Zoho.
  const token = form.get(CAMPO_TURNSTILE);
  try {
    const captcha = await verificarTurnstile(typeof token === 'string' ? token : '', ipCliente(contexto));
    if (!captcha.ok) return json(400, { ok: false, error: 'captcha' });
  } catch (e) {
    console.error('[contact] Error verificando Turnstile:', e instanceof Error ? e.message : e);
    return json(500, { ok: false, error: 'servidor' });
  }

  // 2. Campos.
  const validacion = validar(form);
  if (!validacion.ok) return json(400, { ok: false, error: 'validacion', campos: validacion.campos });

  // 3. Reenvío a Zoho.
  try {
    const zoho = await enviarAZoho(validacion.datos);
    if (!zoho.ok) {
      console.error(`[contact] Zoho respondió ${zoho.estado}`);
      return json(502, { ok: false, error: 'zoho' });
    }
  } catch (e) {
    console.error('[contact] Error enviando a Zoho:', e instanceof Error ? e.message : e);
    return json(502, { ok: false, error: 'zoho' });
  }

  return json(200, { ok: true });
};
