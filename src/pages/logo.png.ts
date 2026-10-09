import type { APIRoute } from 'astro';
import { imagenLogo } from '../utils/imagenes';

// PLACEHOLDER LOGO: cuando llegue el logo final, borra este archivo y deja public/logo.png (512×512).
export const GET: APIRoute = async () => new Response(await imagenLogo(), { headers: { 'Content-Type': 'image/png' } });
