import type { APIRoute, GetStaticPaths } from 'astro';
import * as BANDERAS from 'country-flag-icons/string/3x2';
import { PAISES_TELEFONO } from '../../config/telefono';

/**
 * Banderas del selector de teléfono (/banderas/ES.svg…), generadas en build desde country-flag-icons
 * (3:2, MIT). Son archivos estáticos: el navegador solo pide las que se ven en pantalla.
 */
export const getStaticPaths = (() =>
  Object.keys(PAISES_TELEFONO).map((iso) => ({
    params: { iso },
    props: { svg: (BANDERAS as Record<string, string>)[iso] },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ svg: string | undefined }> = ({ props, params }) => {
  if (!props.svg) throw new Error(`Falta la bandera de ${params.iso}`);
  return new Response(props.svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
