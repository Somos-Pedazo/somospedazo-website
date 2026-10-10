/**
 * Servicios · la escalera se construye escalón a escalón.
 *
 * Escritorio (scrub, sin fijar): al entrar la escalera, cada escalón cae desde arriba y
 * encaja en su peldaño (1 → 2 → 3). Después, en su peldaño aparecen uno a uno los pedazos
 * acumulados: el escalón 2 suma al 1 y el 3 suma a los dos anteriores.
 * Móvil (escalones apilados): cada escalón sube y encaja al entrar en pantalla, con una
 * animación corta que se reproduce una sola vez.
 */
import { MQ, escena } from './base';

escena('escalera', (gsap) => {
  const escalones = gsap.utils.toArray<HTMLElement>('[data-escalon]');
  if (!escalones.length) return;
  const escalera = escalones[0]!.closest('ol')!;
  const minis = (el: HTMLElement) => el.querySelectorAll<HTMLElement>('[data-mini]');

  const mm = gsap.matchMedia();

  mm.add(MQ.escritorio, () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: escalera, start: 'top 85%', end: 'top 20%', scrub: 0.6 },
    });
    escalones.forEach((el, i) => {
      const pos = i * 1.1;
      tl.fromTo(el, { y: -160, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'back.out(1.3)' }, pos);
      tl.fromTo(
        minis(el),
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, stagger: 0.12, ease: 'back.out(2.2)', transformOrigin: '50% 50%' },
        pos + 0.75,
      );
    });
  });

  mm.add(MQ.movil, () => {
    escalones.forEach((el) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' } });
      tl.fromTo(el, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
      tl.fromTo(
        minis(el),
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(2.2)', transformOrigin: '50% 50%' },
        '-=0.2',
      );
    });
  });
});
