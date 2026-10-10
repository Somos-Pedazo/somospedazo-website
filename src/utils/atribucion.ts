/**
 * Atribución en el servidor: limpia los datos que envía el navegador, calcula el Lead Source
 * y compone el campo «Description» para Zoho. Nunca se confía en valores calculados por el cliente:
 * aquí solo entran datos en bruto (URL, referrer, UTM, click IDs), que se validan uno a uno.
 */
import {
  BUSCADORES,
  CAMPOS_ATRIBUCION,
  CLAVES_LINEA,
  ORIGEN_POR_CLICK_ID,
  PERSISTENCIA,
  UTM,
  type Atribucion,
  type LeadSource,
} from '../config/atribucion';

const MAX_URL = 2000;
const MAX_PARAM = 255;

/** Quita pipes y saltos de línea (romperían las columnas de la línea técnica) y recorta. */
export function limpiarValor(valor: unknown, max = MAX_PARAM): string {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/[|\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

/** Solo URLs http(s) válidas; cualquier otra cosa se descarta. */
export function limpiarUrl(valor: unknown): string {
  const v = limpiarValor(valor, MAX_URL);
  if (!v) return '';
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:' ? limpiarValor(u.href, MAX_URL) : '';
  } catch {
    return '';
  }
}

/** Fecha ISO 8601 válida, no futura y dentro de la ventana de persistencia (con margen). */
export function limpiarFecha(valor: unknown, ahora = new Date()): string {
  const v = limpiarValor(valor, 40);
  if (!v || !/^\d{4}-\d{2}-\d{2}T/.test(v)) return '';
  const t = Date.parse(v);
  if (Number.isNaN(t)) return '';
  const maxAntiguedad = (PERSISTENCIA.caducidadDias + 1) * 86_400_000;
  if (t > ahora.getTime() + 5 * 60_000 || ahora.getTime() - t > maxAntiguedad) return '';
  return new Date(t).toISOString();
}

/** Lee y valida los datos de atribución enviados por el formulario. */
export function leerAtribucion(form: FormData, ahora = new Date()): Atribucion {
  const datos = {} as Atribucion;
  for (const campo of CAMPOS_ATRIBUCION) {
    const bruto = form.get(campo);
    datos[campo] =
      campo === 'landing_page' || campo === 'referrer'
        ? limpiarUrl(bruto)
        : campo === 'touch_ts'
          ? limpiarFecha(bruto, ahora)
          : limpiarValor(bruto);
  }
  return datos;
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
};

/**
 * Lead Source: siempre uno de los valores de la lista de Zoho (tipo LeadSource), nunca
 * «Manual creation». Primera regla que se cumpla:
 *   gclid → Google Ads · fbclid → Facebook Ads · msclkid → Microsoft Ads · ttclid → TikTok Ads ·
 *   li_fat_id → LinkedIn Ads · cualquier UTM → Campaign (UTM) · referrer de buscador → Organic ·
 *   otro referrer externo → Referral · sin referrer externo (o del propio dominio) → Direct.
 * El detalle de la campaña (utm_source, utm_medium…) queda en la línea técnica de Description.
 */
export function calcularLeadSource(a: Atribucion, hostPropio: string): LeadSource {
  for (const [id, origen] of ORIGEN_POR_CLICK_ID) if (a[id]) return origen;

  if (UTM.some((p) => a[p])) return 'Campaign (UTM)';

  const ref = host(a.referrer);
  const propio = hostPropio.toLowerCase().replace(/^www\./, '');
  if (!ref || ref === propio || ref.endsWith(`.${propio}`)) return 'Direct';
  if (BUSCADORES.some((b) => (b.endsWith('.') ? ref.startsWith(b) || ref.includes(`.${b}`) : ref === b || ref.endsWith(`.${b}`))))
    return 'Organic';
  return 'Referral';
}

/** Resume la respuesta de siteverify de Cloudflare en una cadena corta sin pipes. */
export function resumenCaptcha(r: { success?: boolean; hostname?: string; challenge_ts?: string; action?: string }): string {
  const partes = [`success=${r.success === true}`];
  if (r.hostname) partes.push(`hostname=${r.hostname}`);
  if (r.challenge_ts) partes.push(`challenge_ts=${r.challenge_ts}`);
  if (r.action) partes.push(`action=${r.action}`);
  return limpiarValor(partes.join('; '), 300);
}

/**
 * Description para Zoho:
 *   Parte 1: una línea técnica con las 18 claves en orden fijo, siempre presentes (valor vacío si no hay).
 *   Línea en blanco.
 *   Parte 2: «form_message=» y, en la línea siguiente, el mensaje tal cual.
 */
export function componerDescription(valores: Partial<Record<(typeof CLAVES_LINEA)[number], string>>, mensaje: string): string {
  const linea = CLAVES_LINEA.map((k) => `${k}=${limpiarValor(valores[k] ?? '', MAX_URL)}`).join(' | ');
  return `${linea}\n\nform_message=\n${mensaje}`;
}
