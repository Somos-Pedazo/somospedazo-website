/**
 * Teléfono internacional: validación con expresiones regulares y paso a E.164.
 * Compartido entre navegador (src/scripts/formulario/) y servidor (src/pages/api/contact.ts),
 * así ambos aplican exactamente las mismas reglas. No contiene datos de países: las reglas de
 * cada país (prefijo, patrón nacional, prefijo troncal) llegan como parámetro.
 *   - Navegador: de los atributos data-* de cada <option> del selector de país.
 *   - Servidor: de src/config/telefono.ts (metadatos de libphonenumber-js).
 */

/** Reglas de un país. `patron` es la expresión regular del número nacional (sin prefijo). */
export type ReglasTelefono = {
  /** Código de llamada internacional, sin «+». Ej.: '34'. */
  prefijo: string;
  /** Patrón del número nacional significativo (libphonenumber), sin anclas. */
  patron: string;
  /**
   * Expresión regular del prefijo nacional que se marca dentro del país y no forma parte de E.164
   * (Reino Unido: «0»; Bielorrusia: «0|80?»…), sin anclas.
   */
  prefijoNacional?: string;
  /** Regla de transformación del número tras el prefijo nacional (Argentina: «9$1» para móviles). */
  transformacion?: string;
};

/** E.164: «+», código de país sin ceros iniciales y hasta 15 dígitos en total. */
export const E164_RE = /^\+[1-9]\d{6,14}$/;

/** Lo que se admite escribir: «+» opcional al principio y luego dígitos, espacios, puntos, guiones o paréntesis. */
export const TELEFONO_ESCRITO_RE = /^\+?[\d\s().\-]{4,30}$/;

/** Prefijo internacional escrito por la persona («+44…» o «0044…»), o null si es un número nacional. */
export function prefijoEscrito(numero: string): string | null {
  const limpio = numero.trim();
  if (limpio.startsWith('+')) return limpio.slice(1).replace(/\D/g, '');
  const digitos = limpio.replace(/\D/g, '');
  return /^\s*00/.test(limpio) && digitos.startsWith('00') ? digitos.slice(2) : null;
}

export type ResultadoTelefono =
  | { ok: true; e164: string }
  | { ok: false; motivo: 'caracteres' | 'prefijo' | 'formato' };

/**
 * Valida un número escrito para el país elegido y lo devuelve en E.164.
 * - Admite el número con o sin el prefijo internacional del país («+34 600…», «0034 600…», «600…»).
 * - Quita el prefijo nacional si el número lo lleva («07400 123456» → +447400123456).
 * - El número nacional resultante debe encajar entero en el patrón del país.
 */
export function aE164(numero: string, reglas: ReglasTelefono): ResultadoTelefono {
  const escrito = numero.trim();
  if (!TELEFONO_ESCRITO_RE.test(escrito)) return { ok: false, motivo: 'caracteres' };

  let nacional = escrito.replace(/\D/g, '');
  const internacional = prefijoEscrito(escrito);
  if (internacional !== null) {
    if (!internacional.startsWith(reglas.prefijo)) return { ok: false, motivo: 'prefijo' };
    nacional = internacional.slice(reglas.prefijo.length);
  }

  const patron = new RegExp(`^(?:${reglas.patron})$`);
  if (!patron.test(nacional)) {
    const sinPrefijo = quitarPrefijoNacional(nacional, reglas);
    if (sinPrefijo !== null && patron.test(sinPrefijo)) nacional = sinPrefijo;
  }
  if (!patron.test(nacional)) return { ok: false, motivo: 'formato' };

  const e164 = `+${reglas.prefijo}${nacional}`;
  return E164_RE.test(e164) ? { ok: true, e164 } : { ok: false, motivo: 'formato' };
}

/**
 * Quita el prefijo nacional como lo hace libphonenumber: si el patrón captura un grupo y hay regla
 * de transformación, se aplica («011 15 2345 6789» → «91123456789»); si no, se quita lo encajado.
 */
function quitarPrefijoNacional(nacional: string, { prefijoNacional, transformacion }: ReglasTelefono): string | null {
  if (!prefijoNacional) return null;
  const re = new RegExp(`^(?:${prefijoNacional})`);
  const encaje = re.exec(nacional);
  if (!encaje) return null;
  const ultimoGrupo = encaje.length > 1 ? encaje[encaje.length - 1] : undefined;
  return transformacion && ultimoGrupo ? nacional.replace(re, transformacion) : nacional.slice(encaje[0].length);
}
