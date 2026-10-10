/**
 * Base de las animaciones ligadas al scroll (GSAP + ScrollTrigger).
 *
 * Principios:
 * - El HTML y el CSS por defecto son el ESTADO FINAL: sin JS, con JS fallido o con
 *   prefers-reduced-motion: reduce, la página se ve completa y legible.
 * - Un script en línea mínimo (MOTION_INIT, en BaseLayout) añade la clase `motion` a <html>
 *   antes del primer pintado, solo si no hay reduced motion. El CSS bajo `html.motion`
 *   prepara los estados iniciales (sin saltos de layout: solo transform/opacity y alturas
 *   de escena decididas antes de pintar).
 * - Si GSAP no termina de inicializar en 5 s, el script en línea retira `motion` y se
 *   muestra el estado final.
 * - GSAP se importa de forma dinámica: con reduced motion ni siquiera se descarga.
 * - No se toca el scroll nativo: nada de smooth scroll artificial ni bloqueo de rueda.
 */
import type { gsap as GsapT } from 'gsap';
import type { ScrollTrigger as ScrollTriggerT } from 'gsap/ScrollTrigger';

declare global {
  interface Window {
    __motionListo?: boolean;
  }
}

export type Gsap = typeof GsapT;
export type ST = typeof ScrollTriggerT;

/** Media queries compartidas por todas las escenas (coinciden con las del CSS). */
export const MQ = {
  escritorio: '(min-width: 60rem) and (prefers-reduced-motion: no-preference)',
  movil: '(max-width: 59.98rem) and (prefers-reduced-motion: no-preference)',
} as const;

/** Script en línea que activa el modo animado. Va al principio de <body> (BaseLayout). */
export const MOTION_INIT = `(function(){var d=document.documentElement;if(!window.matchMedia||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');setTimeout(function(){if(!window.__motionListo)d.classList.remove('motion')},5000)})();`;

/**
 * Carga GSAP + ScrollTrigger y ejecuta la escena. Si el modo animado no está activo
 * (reduced motion, timeout de seguridad o JS deshabilitado), no hace nada.
 */
export async function escena(nombre: string, init: (gsap: Gsap, ScrollTrigger: ST) => void): Promise<void> {
  const html = document.documentElement;
  if (!html.classList.contains('motion')) return;
  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    // El timeout de seguridad pudo saltar mientras se descargaba GSAP: respetar el estado final.
    if (!html.classList.contains('motion')) return;
    gsap.registerPlugin(ScrollTrigger);
    init(gsap, ScrollTrigger);
    window.__motionListo = true;
  } catch (e) {
    html.classList.remove('motion');
    console.warn(`[motion] «${nombre}» no se ha podido iniciar; se muestra el estado final.`, e);
  }
}
