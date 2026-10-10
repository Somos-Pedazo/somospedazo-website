/**
 * Hero · «Cada uno aporta su pedazo. Juntos, encajamos.»
 *
 * Escritorio (escena fijada con sticky, ~120vh de recorrido, scrub):
 *   1. Las piezas llegan desde fuera de pantalla, cada una desde su lado de la composición,
 *      girando, y encajan en la retícula (escalonadas).
 *   2. La última pieza, la del cliente, cae en el hueco discontinuo con un pequeño rebote.
 *   3. Desaparece la pista («Cada uno aporta su pedazo…») y aparecen el titular, la entradilla
 *      y las llamadas a la acción.
 * Móvil (sin fijar, recorrido corto): todas las piezas aparecen al entrar la ilustración;
 *   solo la mitad se desplaza, con trayectos cortos. El titular es visible desde el inicio.
 */
import { MQ, escena } from './base';

escena('hero', (gsap) => {
  const raiz = document.querySelector<HTMLElement>('[data-hero-escena]');
  const svg = raiz?.querySelector<SVGSVGElement>('svg.pedazos');
  if (!raiz || !svg) return;

  const piezas = gsap.utils.toArray<SVGRectElement>('[data-pieza]:not([data-cliente])', svg);
  const cliente = svg.querySelector<SVGRectElement>('[data-cliente]');
  const revela = gsap.utils.toArray<HTMLElement>('[data-hero-revela]', raiz);
  const pista = raiz.querySelector<HTMLElement>('[data-hero-pista]');

  // Centro de la composición, en unidades del viewBox.
  const vb = svg.viewBox.baseVal;
  const centro = { x: vb.width / 2, y: vb.height / 2 };

  /** Punto de partida de cada pieza: hacia fuera desde el centro, a `distancia` unidades. */
  const salida = (pieza: SVGRectElement, i: number, distancia: number) => {
    const b = pieza.getBBox();
    let dx = b.x + b.width / 2 - centro.x;
    let dy = b.y + b.height / 2 - centro.y;
    if (Math.hypot(dx, dy) < 60) {
      dx = i % 2 ? 1 : -1; // piezas centrales: entran por los lados
      dy = 0.35;
    }
    const n = Math.hypot(dx, dy);
    const giro = (i % 2 ? 1 : -1) * (16 + ((i * 7) % 26));
    return { x: (dx / n) * distancia, y: (dy / n) * distancia, rotation: giro };
  };

  const final = { x: 0, y: 0, rotation: 0, opacity: 1 };
  const mm = gsap.matchMedia();

  mm.add(MQ.escritorio, () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', transformOrigin: '50% 50%' },
      scrollTrigger: { trigger: raiz, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
    });

    piezas.forEach((p, i) => {
      tl.fromTo(p, { ...salida(p, i, 1100), opacity: 0 }, { ...final, duration: 1 }, i * 0.12);
    });

    if (cliente) {
      tl.fromTo(
        cliente,
        { y: -900, rotation: -120, opacity: 0 },
        { ...final, duration: 1, ease: 'back.out(1.7)' },
        '>-0.15',
      );
    }
    if (pista) tl.to(pista, { opacity: 0, y: -24, duration: 0.5, ease: 'power2.in' }, '>-0.1');
    tl.fromTo(revela, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.25 }, '>-0.2');
    tl.to({}, { duration: 0.5 }); // un instante con todo encajado antes de soltar la escena
  });

  mm.add(MQ.movil, () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', transformOrigin: '50% 50%' },
      scrollTrigger: { trigger: svg, start: 'top 95%', end: 'center 55%', scrub: 0.5 },
    });

    piezas.forEach((p, i) => {
      // Menos piezas en movimiento: solo las pares se desplazan; el resto solo aparece.
      const desde = i % 2 === 0 ? { ...salida(p, i, 160), rotation: 0 } : {};
      tl.fromTo(p, { ...desde, opacity: 0 }, { ...final, duration: 1 }, i * 0.08);
    });

    if (cliente) {
      tl.fromTo(cliente, { y: -220, opacity: 0 }, { ...final, duration: 0.8, ease: 'back.out(1.7)' }, '>-0.1');
    }
  });
});
