/**
 * Países del selector de teléfono (solo servidor y build; el navegador lee las reglas del HTML).
 *
 * Fuente: metadatos de libphonenumber-js (los de Google libphonenumber), para no mantener a mano
 * 245 prefijos y patrones. Al actualizar la dependencia se actualizan los patrones.
 */
import metadatos from 'libphonenumber-js/metadata.min.json';
import type { ReglasTelefono } from '../utils/telefono';

/** Campos del formulario. Zoho recibe solo «Phone», compuesto en el servidor en formato E.164. */
export const CAMPO_TELEFONO_PAIS = 'telefono_pais';
export const CAMPO_TELEFONO_NUMERO = 'telefono_numero';

/** País seleccionado por defecto. */
export const PAIS_TELEFONO_DEFECTO = 'ES';

export type PaisTelefono = ReglasTelefono & {
  /** Código ISO 3166-1 alfa-2 (o territorio de libphonenumber, como AC o XK). */
  iso: string;
  /** País principal de su prefijo (+1 → US, +44 → GB…): el que se elige al escribir «+prefijo». */
  principal: boolean;
};

// Estructura de metadata.min.json: countries[ISO] = [prefijo, idd, patrón nacional, longitudes, formatos,
// prefijo nacional, regla de formato, patrón del prefijo nacional para analizar, regla de transformación, …]
type FilaMetadatos = [string, string, string, ...unknown[]];

const texto = (valor: unknown) => (typeof valor === 'string' && valor ? valor : undefined);
const escaparRegExp = (valor: string) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const { countries, country_calling_codes: porPrefijo } = metadatos as unknown as {
  countries: Record<string, FilaMetadatos>;
  country_calling_codes: Record<string, string[]>;
};

export const PAISES_TELEFONO: Record<string, PaisTelefono> = Object.fromEntries(
  Object.entries(countries).map(([iso, fila]) => {
    const [prefijo, , patron] = fila;
    // Igual que libphonenumber: sin patrón propio, el prefijo nacional literal («0», «1», «8»…).
    const literal = texto(fila[5]);
    const prefijoNacional = texto(fila[7]) ?? (literal ? escaparRegExp(literal) : undefined);
    return [
      iso,
      { iso, prefijo, patron, prefijoNacional, transformacion: texto(fila[8]), principal: porPrefijo[prefijo]?.[0] === iso },
    ];
  }),
);
