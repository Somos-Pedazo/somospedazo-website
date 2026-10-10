/**
 * POST /api/contact · Recibe el formulario de contacto, valida el captcha
 * (Cloudflare Turnstile) y los campos, y reenvía el lead a Zoho CRM.
 * Única ruta del sitio que se ejecuta en servidor (función de Vercel).
 *
 * A Zoho llegan: los campos visibles, «Lead Source» (calculado aquí) y «Description»
 * compuesto aquí: línea técnica de atribución y consentimientos + línea en blanco + mensaje.
 *
 * Respuestas: 200 { ok: true } · 4xx/5xx { ok: false, error }
 *   error: 'captcha' | 'validacion' | 'zoho' | 'servidor'
 */
import type { APIContext, APIRoute } from 'astro';
import {
  CAMPOS,
  CAMPO_EMAIL_OPT_OUT,
  CAMPO_LEAD_SOURCE,
  EMAIL_OPT_OUT_VALOR,
  CAMPO_NEWSLETTER,
  CAMPO_PRIVACIDAD,
  CAMPO_TURNSTILE,
  EMAIL_RE,
  HONEYPOT,
} from '../../config/zoho';
import { CAMPO_SUBMISSION_URL } from '../../config/atribucion';
import { calcularLeadSource, componerDescription, leerAtribucion, limpiarUrl, resumenCaptcha } from '../../utils/atribucion';
import { verificarTurnstile, type RespuestaSiteverify } from '../../server/turnstile';
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

  // La casilla de privacidad es obligatoria también en el servidor.
  if (form.get(CAMPO_PRIVACIDAD) !== 'si') invalidos.push(CAMPO_PRIVACIDAD);

  return invalidos.length ? { ok: false, campos: invalidos } : { ok: true, datos };
}

/**
 * URL desde la que se envía: la cabecera Referer que pone el navegador (misma web) y, si falta,
 * el campo oculto del formulario. En ambos casos solo se acepta una URL del propio sitio.
 */
function urlDeEnvio(request: Request, form: FormData): string {
  const propio = new URL(request.url).host;
  for (const candidata of [request.headers.get('referer'), form.get(CAMPO_SUBMISSION_URL)]) {
    const url = limpiarUrl(candidata);
    if (url && new URL(url).host === propio) return url;
  }
  return '';
}

/** Lead Source y Description para Zoho a partir de los datos ya validados. */
function datosDeAtribucion(request: Request, form: FormData, captcha: RespuestaSiteverify, mensaje: string): Record<string, string> {
  const ahora = new Date().toISOString();
  const atribucion = leerAtribucion(form);
  const leadSource = calcularLeadSource(atribucion, new URL(request.url).hostname);
  const newsletter = form.get(CAMPO_NEWSLETTER) === 'si';

  const description = componerDescription(
    {
      submission_url: urlDeEnvio(request, form),
      ...atribucion,
      lead_source: leadSource,
      privacy_consent: `sí ${ahora}`,
      newsletter_consent: newsletter ? `sí ${ahora}` : 'no',
      captcha_verification: resumenCaptcha(captcha),
    },
    mensaje,
  );

  return {
    // Mismo valor que lead_source= de Description: siempre uno de la lista de Zoho.
    [CAMPO_LEAD_SOURCE]: leadSource,
    // Negación de la newsletter: con newsletter → Opt Out desmarcado (false); sin ella → marcado (true).
    [CAMPO_EMAIL_OPT_OUT]: newsletter ? EMAIL_OPT_OUT_VALOR.desmarcado : EMAIL_OPT_OUT_VALOR.marcado,
    [CAMPOS.mensaje.name]: description,
  };
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
  let captcha: RespuestaSiteverify;
  try {
    const verificacion = await verificarTurnstile(typeof token === 'string' ? token : '', ipCliente(contexto));
    if (!verificacion.ok) return json(400, { ok: false, error: 'captcha' });
    captcha = verificacion.datos;
  } catch (e) {
    console.error('[contact] Error verificando Turnstile:', e instanceof Error ? e.message : e);
    return json(500, { ok: false, error: 'servidor' });
  }

  // 2. Campos.
  const validacion = validar(form);
  if (!validacion.ok) return json(400, { ok: false, error: 'validacion', campos: validacion.campos });

  // 3. Atribución y consentimientos → Lead Source + Description (se compone aquí, nunca en el cliente).
  const mensaje = validacion.datos[CAMPOS.mensaje.name] ?? '';
  const datos = { ...validacion.datos, ...datosDeAtribucion(request, form, captcha, mensaje) };

  // 4. Reenvío a Zoho.
  try {
    const zoho = await enviarAZoho(datos);
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
