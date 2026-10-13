/**
 * Hilo conductor (src/components/hero-v2/Hilo.astro).
 * Un pedazo recorre, ligado al scroll, un trayecto suave que se calcula a partir de la página:
 *   sale de la cinta → junto a la entradilla de «Qué hacemos» → baja por el margen derecho
 *   junto a las tarjetas → cruza bajo ellas → llega a la escalera y se desvanece mientras
 *   la escalera se construye.
 * Los puntos se recalculan en cada refresco de ScrollTrigger (cambio de tamaño, fuentes…).
 */
import { MQ, escena } from '../motion/base';

escena('hilo', (gsap, ScrollTrigger) => {
  const hilo = document.querySelector<HTMLElement>('[data-hilo]');
  const pieza = hilo?.querySelector<HTMLElement>('[data-hilo-pieza]');
  const paso1 = document.querySelector<HTMLElement>('[data-hilo-paso="1"]');
  const paso2 = document.querySelector<HTMLElement>('[data-hilo-paso="2"]');
  const paso3 = document.querySelector<HTMLElement>('[data-hilo-paso="3"]');
  if (!hilo || !pieza || !paso1 || !paso2 || !paso3) return;

  // Puntos del trayecto, relativos al origen del hilo. Se mutan en el sitio al refrescar.
  const puntos = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }));

  const medir = () => {
    const origen = hilo.getBoundingClientRect();
    const rel = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - origen.left, right: r.right - origen.left, top: r.top - origen.top, bottom: r.bottom - origen.top };
    };
    const contenedor = rel(paso1.closest<HTMLElement>('.contenedor') ?? paso1);
    const borde = contenedor.right + Math.max((origen.width - contenedor.right) / 2, 24); // margen exterior derecho
    const intro = rel(paso1);
    const tarjetas = rel(paso2);
    const escalera = rel(paso3);
    const huecoBajo = (escalera.top - tarjetas.bottom) * 0.45;

    Object.assign(puntos[0]!, { x: borde - 40, y: 0 });
    Object.assign(puntos[1]!, { x: contenedor.right - 130, y: (intro.top + intro.bottom) / 2 });
    Object.assign(puntos[2]!, { x: borde, y: (tarjetas.top + tarjetas.bottom) / 2 });
    Object.assign(puntos[3]!, { x: contenedor.right - 260, y: tarjetas.bottom + huecoBajo });
    Object.assign(puntos[4]!, { x: contenedor.right - 140, y: (escalera.top + escalera.bottom) / 2 });
  };

  void import('gsap/MotionPathPlugin').then(({ MotionPathPlugin }) => {
    gsap.registerPlugin(MotionPathPlugin);
    const mm = gsap.matchMedia();

    mm.add(MQ.escritorio, () => {
      medir();
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hilo,
          start: 'top 70%',
          endTrigger: paso3,
          end: 'center 55%',
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefreshInit: medir,
        },
      });
      // fromCurrent: false → arranca en el primer punto, no en la posición actual del elemento.
      tl.to(pieza, { motionPath: { path: puntos, curviness: 1.3, autoRotate: true, fromCurrent: false }, duration: 1 }, 0)
        .fromTo(pieza, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.08, ease: 'power2.out' }, 0)
        .to(pieza, { opacity: 0, scale: 0.5, duration: 0.1, ease: 'power2.in' }, 0.9);
      ScrollTrigger.refresh();
    });
  });
});
