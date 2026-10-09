import type { APIRoute, GetStaticPaths } from 'astro';
import { imagenIcono } from '../utils/imagenes';

// Iconos del manifest (192 y 512). PLACEHOLDER LOGO.
export const getStaticPaths = (() => [{ params: { tamano: '192' } }, { params: { tamano: '512' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(await imagenIcono(Number(params.tamano)), { headers: { 'Content-Type': 'image/png' } });
