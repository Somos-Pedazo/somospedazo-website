/**
 * Atribución de marketing en el navegador (se carga en todas las páginas).
 *
 * - Captura de cada visita: UTM y click IDs de la URL, landing_page (URL completa),
 *   referrer y touch_ts (ISO 8601).
 * - Persistencia en localStorage durante 90 días desde el último toque guardado:
 *   · Visita con UTM, click IDs o referrer externo → reemplaza el registro y renueva los 90 días.
 *   · Visita directa (sin parámetros y sin referrer externo) → no toca un registro vigente;
 *     si no hay registro, se guarda. El referrer del propio dominio cuenta como directo, para
 *     que la navegación interna (Inicio → Contacto) no falsee el origen.
 *   · El registro no se borra al enviar el formulario.
 * - Consentimiento: si PERSISTENCIA.requiereConsentimiento, solo se guarda cuando el visitante
 *   acepta la categoría de Cookiebot configurada; si la retira, se borra. Sin consentimiento,
 *   el formulario envía la atribución que correspondería, sin guardar nada.
 * - El servidor revalida todo y calcula el Lead Source (src/utils/atribucion.ts).
 */
import { CAMPOS_ATRIBUCION, CLICK_IDS, PERSISTENCIA, UTM, type Atribucion } from '../config/atribucion';

type Registro = { v: 2; expira: number; datos: Atribucion };

declare global {
  interface Window {
    Cookiebot?: { consent?: Partial<Record<'necessary' | 'preferences' | 'statistics' | 'marketing', boolean>> };
  }
}

/** Captura de esta página vista (calculada una sola vez al cargar). */
const capturaActual: Atribucion = (() => {
  const params = new URLSearchParams(location.search);
  const datos = {} as Atribucion;
  for (const c of CAMPOS_ATRIBUCION) datos[c] = '';
  for (const p of [...UTM, ...CLICK_IDS]) datos[p] = (params.get(p) ?? '').trim();
  datos.landing_page = location.href;
  datos.referrer = document.referrer;
  datos.touch_ts = new Date().toISOString();
  return datos;
})();

/** Dominio sin «www.», para comparar el referrer con el propio sitio. */
const dominio = (host: string) => host.toLowerCase().replace(/^www\./, '');

/**
 * ¿El referrer es de otro dominio? El del propio sitio (incluidos www y subdominios) cuenta
 * como directo: navegar de Inicio a Contacto no es un nuevo origen.
 */
const referrerExterno = (() => {
  if (!capturaActual.referrer) return false;
  try {
    const ref = dominio(new URL(capturaActual.referrer).hostname);
    const propio = dominio(location.hostname);
    return ref !== propio && !ref.endsWith(`.${propio}`) && !propio.endsWith(`.${ref}`);
  } catch {
    return false;
  }
})();

/**
 * ¿Es un nuevo toque? Lo es si trae UTM, click IDs o un referrer externo. Solo la visita directa
 * (sin parámetros y sin referrer externo) deja intacto el registro guardado.
 */
const esNuevoToque = referrerExterno || [...UTM, ...CLICK_IDS].some((p) => capturaActual[p] !== '');

function almacen(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // almacenamiento bloqueado (modo privado, políticas del navegador…)
  }
}

/** Registros de la versión anterior (v1) usaban `first_seen`: se migran a `touch_ts`. */
function migrar(r: { v?: number; expira?: unknown; datos?: Record<string, string> } | null): Registro | null {
  if (!r || typeof r.expira !== 'number' || !r.datos) return null;
  if (r.v === 2) return r as Registro;
  if (r.v === 1) {
    const { first_seen, ...resto } = r.datos;
    return { v: 2, expira: r.expira, datos: { ...resto, touch_ts: first_seen ?? '' } as Atribucion };
  }
  return null;
}

function leer(): Atribucion | null {
  const ls = almacen();
  if (!ls) return null;
  try {
    const r = migrar(JSON.parse(ls.getItem(PERSISTENCIA.clave) ?? 'null'));
    if (!r) return null;
    if (Date.now() > r.expira) {
      ls.removeItem(PERSISTENCIA.clave);
      return null;
    }
    return r.datos;
  } catch {
    return null;
  }
}

function guardar(datos: Atribucion): void {
  const registro: Registro = { v: 2, expira: Date.now() + PERSISTENCIA.caducidadDias * 86_400_000, datos };
  try {
    almacen()?.setItem(PERSISTENCIA.clave, JSON.stringify(registro));
  } catch {
    /* sin espacio o bloqueado: se usará la captura de la visita en curso */
  }
}

function hayConsentimiento(): boolean {
  if (!PERSISTENCIA.requiereConsentimiento) return true;
  return window.Cookiebot?.consent?.[PERSISTENCIA.categoriaCookiebot] === true;
}

/**
 * Aplica las reglas de persistencia a esta visita. Se puede llamar varias veces (al cargar y
 * al aceptar cookies): como compara con la captura de esta misma visita, el resultado es el mismo.
 */
let yaPersistida = false;
function persistirSiProcede(): void {
  if (yaPersistida || !hayConsentimiento()) return;
  if (esNuevoToque || !leer()) guardar(capturaActual);
  yaPersistida = true;
}

/**
 * Datos que se envían con el formulario, con la misma regla que la persistencia:
 * si esta visita es un nuevo toque, manda la visita; si es directa, el registro guardado
 * (o, sin registro, la visita en curso).
 */
export function atribucionParaFormulario(): Atribucion {
  if (esNuevoToque) return capturaActual;
  return leer() ?? capturaActual;
}

persistirSiProcede();
if (PERSISTENCIA.requiereConsentimiento) {
  // Cookiebot dispara estos eventos al cargar el consentimiento guardado y al aceptarlo/retirarlo.
  window.addEventListener('CookiebotOnConsentReady', persistirSiProcede);
  window.addEventListener('CookiebotOnAccept', persistirSiProcede);
  window.addEventListener('CookiebotOnDecline', () => {
    if (!hayConsentimiento()) {
      almacen()?.removeItem(PERSISTENCIA.clave);
      yaPersistida = false;
    }
  });
}
