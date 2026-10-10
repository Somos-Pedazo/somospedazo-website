/**
 * Atribución de marketing en el navegador (se carga en todas las páginas).
 *
 * - Captura del aterrizaje: UTM y click IDs de la URL, landing_page (URL completa),
 *   referrer y first_seen (ISO 8601).
 * - Persistencia en localStorage durante 90 días. La primera atribución manda: un registro
 *   vigente nunca se sobrescribe en visitas posteriores.
 * - Consentimiento: si PERSISTENCIA.requiereConsentimiento, solo se guarda cuando el visitante
 *   acepta la categoría de Cookiebot configurada; si la retira, se borra. Sin consentimiento,
 *   el formulario envía la captura de la página actual, sin guardar nada.
 * - El servidor revalida todo y calcula el Lead Source (src/utils/atribucion.ts).
 */
import { CAMPOS_ATRIBUCION, CLICK_IDS, PERSISTENCIA, UTM, type Atribucion } from '../config/atribucion';

type Registro = { v: 1; expira: number; datos: Atribucion };

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
  datos.first_seen = new Date().toISOString();
  return datos;
})();

function almacen(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // almacenamiento bloqueado (modo privado, políticas del navegador…)
  }
}

function leer(): Atribucion | null {
  const ls = almacen();
  if (!ls) return null;
  try {
    const r = JSON.parse(ls.getItem(PERSISTENCIA.clave) ?? 'null') as Registro | null;
    if (!r || r.v !== 1 || typeof r.expira !== 'number' || !r.datos) return null;
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
  const registro: Registro = { v: 1, expira: Date.now() + PERSISTENCIA.caducidadDias * 86_400_000, datos };
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

/** Guarda la captura de esta visita si aún no hay registro vigente (la primera atribución manda). */
function persistirSiProcede(): void {
  if (hayConsentimiento() && !leer()) guardar(capturaActual);
}

/** Datos que se envían con el formulario: el registro persistido o, si no hay, la visita en curso. */
export function atribucionParaFormulario(): Atribucion {
  return leer() ?? capturaActual;
}

persistirSiProcede();
if (PERSISTENCIA.requiereConsentimiento) {
  // Cookiebot dispara estos eventos al cargar el consentimiento guardado y al aceptarlo/retirarlo.
  window.addEventListener('CookiebotOnConsentReady', persistirSiProcede);
  window.addEventListener('CookiebotOnAccept', persistirSiProcede);
  window.addEventListener('CookiebotOnDecline', () => {
    if (!hayConsentimiento()) almacen()?.removeItem(PERSISTENCIA.clave);
  });
}
