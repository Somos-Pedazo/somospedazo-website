/**
 * Atribución de marketing en el navegador (se carga en todas las páginas).
 *
 * - Captura de cada visita: UTM y click IDs de la URL, landing_page (URL completa),
 *   referrer y touch_ts (ISO 8601).
 * - Persistencia en localStorage durante 90 días desde el último toque guardado:
 *   · Visita con UTM o click IDs → reemplaza el registro y renueva los 90 días.
 *   · Visita sin parámetros (directa, orgánica o referida) → no toca un registro vigente;
 *     si no hay registro, se guarda.
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

/** ¿Trae esta visita UTM o click IDs? Solo estas visitas reemplazan un registro guardado. */
const tieneParametros = [...UTM, ...CLICK_IDS].some((p) => capturaActual[p] !== '');

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
  if (tieneParametros || !leer()) guardar(capturaActual);
  yaPersistida = true;
}

/**
 * Datos que se envían con el formulario, con la misma regla que la persistencia:
 * si esta visita trae parámetros, manda la visita; si no, el registro guardado (o, sin registro,
 * la visita en curso).
 */
export function atribucionParaFormulario(): Atribucion {
  if (tieneParametros) return capturaActual;
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
