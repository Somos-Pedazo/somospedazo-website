import type { APIRoute } from 'astro';
import { PAISES_FORMULARIO, atributosOpcion } from '../../data/paises-telefono';

/**
 * Países del selector de teléfono (generado en build). El formulario lo pide en segundo plano tras
 * cargar la página, para no engordar el HTML con 245 países que casi nadie despliega.
 * Cada entrada: código ISO + atributos data-* de su <option> (src/scripts/formulario/telefono.ts).
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(PAISES_FORMULARIO.map((p) => ({ iso: p.iso, datos: atributosOpcion(p) }))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
