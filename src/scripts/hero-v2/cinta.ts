/**
 * Cinta de palabras (src/components/hero-v2/Cinta.astro).
 * Bucle requestAnimationFrame sin GSAP: avance constante hacia la izquierda + un extra
 * proporcional a la velocidad del scroll, y una inclinación (skewX) que crece al bajar rápido.
 * Solo transform. Se para fuera de pantalla y con la pestaña oculta. Sin `html.motion`
 * (reduced motion o fallo de JS) no hace nada: la cinta queda quieta.
 */
const BASE = 45; // px/s
const raiz = document.querySelector<HTMLElement>('[data-cinta]');
const pista = raiz?.querySelector<HTMLElement>('[data-cinta-pista]');
const grupo = raiz?.querySelector<HTMLElement>('[data-cinta-grupo]');

if (raiz && pista && grupo && document.documentElement.classList.contains('motion')) {
  let x = 0;
  let inclinacion = 0;
  let velocidadScroll = 0;
  let ultimoY = scrollY;
  let anterior = performance.now();
  let raf = 0;
  let visible = false;
  let anchoGrupo = grupo.offsetWidth;

  const paso = (ahora: number) => {
    raf = requestAnimationFrame(paso);
    const dt = Math.min((ahora - anterior) / 1000, 1 / 20);
    anterior = ahora;
    if (dt <= 0) return;
    // Velocidad del scroll (px/s), suavizada.
    const y = scrollY;
    velocidadScroll += ((y - ultimoY) / dt - velocidadScroll) * Math.min(dt * 8, 1);
    ultimoY = y;

    x -= (BASE + Math.min(Math.abs(velocidadScroll) * 0.35, 900)) * dt;
    if (x <= -anchoGrupo) x += anchoGrupo;
    const objetivo = Math.max(-9, Math.min(9, velocidadScroll * -0.006));
    inclinacion += (objetivo - inclinacion) * Math.min(dt * 6, 1);
    pista.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${inclinacion.toFixed(2)}deg)`;

    // Si ni el modo animado sigue activo (fallback de 5 s), volver al estado quieto.
    if (!document.documentElement.classList.contains('motion')) {
      cancelAnimationFrame(raf);
      pista.style.transform = '';
    }
  };

  const arrancar = () => {
    if (raf || !visible || document.hidden) return;
    anterior = performance.now();
    ultimoY = scrollY;
    raf = requestAnimationFrame(paso);
  };
  const parar = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  new IntersectionObserver(([e]) => {
    visible = Boolean(e?.isIntersecting);
    if (visible) arrancar();
    else parar();
  }).observe(raiz);
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));
  new ResizeObserver(() => (anchoGrupo = grupo.offsetWidth)).observe(grupo);
}
