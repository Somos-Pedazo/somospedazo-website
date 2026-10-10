/**
 * Lista de países del selector de teléfono, tal como la usa el formulario (solo en build):
 * nombre en castellano, reglas de validación y un móvil de ejemplo en formato nacional.
 * Se publica como /telefono/paises.json (src/pages/telefono/paises.json.ts) y el país por
 * defecto va ya en el HTML (src/components/ui/CampoTelefono.astro).
 */
import { parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js';
import ejemplos from 'libphonenumber-js/mobile/examples';
import { PAISES_TELEFONO, PAIS_TELEFONO_DEFECTO, type PaisTelefono } from '../config/telefono';

export type PaisFormulario = PaisTelefono & { nombre: string; ejemplo: string };

const nombres = new Intl.DisplayNames(['es'], { type: 'region' });

/** Móvil de ejemplo en formato nacional («612 34 56 78»), como pista en el campo. */
function ejemplo(iso: string): string {
  const numero = (ejemplos as Record<string, string>)[iso];
  if (!numero) return '';
  try {
    return parsePhoneNumberWithError(numero, iso as CountryCode).formatNational();
  } catch {
    return numero;
  }
}

export const PAISES_FORMULARIO: PaisFormulario[] = Object.values(PAISES_TELEFONO)
  .map((p) => ({ ...p, nombre: nombres.of(p.iso) ?? p.iso, ejemplo: ejemplo(p.iso) }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

export const PAIS_FORMULARIO_DEFECTO = PAISES_FORMULARIO.find((p) => p.iso === PAIS_TELEFONO_DEFECTO)!;

/** Atributos data-* de cada <option>: de ahí lee las reglas la validación del navegador. */
export function atributosOpcion(p: PaisFormulario): Record<string, string | undefined> {
  return {
    'data-nombre': p.nombre,
    'data-prefijo': p.prefijo,
    'data-patron': p.patron,
    'data-prefijo-nacional': p.prefijoNacional,
    'data-transformacion': p.transformacion,
    'data-ejemplo': p.ejemplo,
    'data-principal': p.principal ? '' : undefined,
  };
}
