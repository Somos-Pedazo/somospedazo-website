import type { APIRoute } from 'astro';
import { imagenIcono } from '../utils/imagenes';

// PLACEHOLDER LOGO: sustituir por public/apple-touch-icon.png (180×180) con el símbolo final.
export const GET: APIRoute = async () => new Response(await imagenIcono(180), { headers: { 'Content-Type': 'image/png' } });
