/**
 * Enfoque · el texto clave se revela palabra a palabra con el scroll.
 *
 * Escritorio (escena fijada con sticky, scrub): las palabras aparecen una a una mientras
 * dos pedazos (chicle y sol) se acercan desde los lados; encajan, con el hueco crema entre
 * ellos, justo cuando termina la frase («Juntamos los dos pedazos…»).
 * Móvil (sin fijar, recorrido corto): mismo efecto, con trayectos más cortos.
 */
import { MQ, escena } from './base';

escena('manifiesto', (gsap) => {
  const raiz = document.querySelector<HTMLElement>('[data-manifiesto]');
  if (!raiz) return;
  const palabras = gsap.utils.toArray<HTMLElement>('[data-palabra]', raiz);
  const izq = raiz.querySelector<SVGRectElement>('[data-pedazo="izq"]');
  const der = raiz.querySelector<SVGRectElement>('[data-pedazo="der"]');

  const construir = (distancia: number, scrollTrigger: ScrollTrigger.Vars) => {
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger });
    tl.fromTo(
      palabras,
      { opacity: 0, y: '0.35em' },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.18, ease: 'power2.out' },
      0,
    );
    const total = tl.duration();
    const pedazo = { x: 0, rotation: 0, duration: total, ease: 'power2.inOut', transformOrigin: '50% 50%' };
    if (izq) tl.fromTo(izq, { x: -distancia, rotation: -14 }, pedazo, 0);
    if (der) tl.fromTo(der, { x: distancia, rotation: 14 }, pedazo, 0);
    tl.to({}, { duration: total * 0.15 }); // pausa con todo encajado
    return tl;
  };

  const mm = gsap.matchMedia();
  mm.add(MQ.escritorio, () => {
    construir(520, { trigger: raiz, start: 'top 60%', end: 'bottom bottom', scrub: 0.6 });
  });
  mm.add(MQ.movil, () => {
    construir(260, { trigger: raiz, start: 'top 75%', end: 'bottom 60%', scrub: 0.5 });
  });
});
