/**
 * Microinteracciones (src/components/hero-v2/Microinteracciones.astro). Sin GSAP: bucles
 * requestAnimationFrame cortos que se paran solos cuando todo está quieto. Solo transform.
 *
 * - Cursor-pedazo: un pedazo Sol que sigue al cursor con inercia, se estira en la dirección del
 *   movimiento y crece al pasar por enlaces y botones. El cursor nativo sigue visible siempre.
 * - Botones magnéticos ([data-magnetico]): al pasar el ratón se desplazan unos píxeles hacia el
 *   cursor y el texto interior le sigue con algo más de retardo.
 * Solo con (hover: hover) and (pointer: fine) y sin reduced motion.
 */
const ACTIVO = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const INTERACTIVOS = 'a[href], button, [role="button"], input, select, textarea, label, summary';

/** Interpolación exponencial independiente de los fps: `rapidez` alto = sigue más pegado. */
const acercar = (actual: number, objetivo: number, rapidez: number, dt: number) =>
  actual + (objetivo - actual) * (1 - Math.exp(-rapidez * dt));

function iniciarCursor(el: HTMLElement): void {
  let mx = 0;
  let my = 0;
  let x = 0;
  let y = 0;
  let escala = 1;
  let estiramiento = 0;
  let angulo = 0;
  let sobre = false;
  let raf = 0;
  let anterior = 0;
  let primera = true;

  const paso = (ahora: number) => {
    const dt = Math.min((ahora - anterior) / 1000, 1 / 30);
    anterior = ahora;
    const px = x;
    const py = y;
    x = acercar(x, mx, 16, dt);
    y = acercar(y, my, 16, dt);
    const vx = (x - px) / (dt || 1 / 60);
    const vy = (y - py) / (dt || 1 / 60);
    const rapidez = Math.hypot(vx, vy);
    if (rapidez > 30) angulo = Math.atan2(vy, vx);
    estiramiento = acercar(estiramiento, Math.min(rapidez / 1400, 0.9), 12, dt);
    escala = acercar(escala, sobre ? 2.4 : 1, 14, dt);
    el.style.transform =
      `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${angulo.toFixed(3)}rad) ` +
      `scale(${(escala * (1 + estiramiento)).toFixed(3)}, ${(escala * (1 - estiramiento * 0.35)).toFixed(3)})`;
    const quieto = Math.abs(mx - x) < 0.2 && Math.abs(my - y) < 0.2 && estiramiento < 0.005 && Math.abs(escala - (sobre ? 2.4 : 1)) < 0.005;
    raf = quieto ? 0 : requestAnimationFrame(paso);
  };
  const despertar = () => {
    if (raf) return;
    anterior = performance.now();
    raf = requestAnimationFrame(paso);
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      if (primera) {
        x = mx;
        y = my;
        primera = false;
      }
      const ahoraSobre = Boolean((e.target as Element | null)?.closest?.(INTERACTIVOS));
      if (ahoraSobre !== sobre) {
        sobre = ahoraSobre;
        el.toggleAttribute('data-sobre', sobre);
      }
      el.setAttribute('data-visible', '');
      despertar();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => el.removeAttribute('data-visible'));
  document.addEventListener('visibilitychange', () => document.hidden && el.removeAttribute('data-visible'));
}

function iniciarIman(boton: HTMLElement): void {
  const texto = boton.querySelector<HTMLElement>('.boton__texto');
  let objetivo = { x: 0, y: 0 };
  let b = { x: 0, y: 0 };
  let t = { x: 0, y: 0 };
  let raf = 0;
  let anterior = 0;

  const paso = (ahora: number) => {
    const dt = Math.min((ahora - anterior) / 1000, 1 / 30);
    anterior = ahora;
    b = { x: acercar(b.x, objetivo.x, 14, dt), y: acercar(b.y, objetivo.y, 14, dt) };
    // El texto llega más lejos y más tarde: sensación de profundidad.
    t = { x: acercar(t.x, objetivo.x * 0.6, 7, dt), y: acercar(t.y, objetivo.y * 0.6, 7, dt) };
    boton.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0)`;
    if (texto) texto.style.transform = `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, 0)`;
    const reposo = objetivo.x === 0 && objetivo.y === 0;
    const quieto = Math.hypot(b.x - objetivo.x, b.y - objetivo.y) < 0.05 && Math.hypot(t.x - objetivo.x * 0.6, t.y - objetivo.y * 0.6) < 0.05;
    if (quieto && reposo) {
      // De vuelta en reposo: se devuelve el control al CSS (hover y foco).
      boton.style.transform = '';
      if (texto) texto.style.transform = '';
      boton.removeAttribute('data-iman-activo');
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(paso);
  };
  const despertar = () => {
    boton.setAttribute('data-iman-activo', '');
    if (raf) return;
    anterior = performance.now();
    raf = requestAnimationFrame(paso);
  };

  boton.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = boton.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const limite = (v: number, max: number) => Math.max(-max, Math.min(max, v));
    objetivo = { x: limite(dx * 0.22, 10), y: limite(dy * 0.3, 7) };
    despertar();
  });
  boton.addEventListener('pointerleave', () => {
    objetivo = { x: 0, y: 0 };
    despertar();
  });
}

if (matchMedia(ACTIVO).matches) {
  const cursor = document.querySelector<HTMLElement>('[data-cursor-pedazo]');
  if (cursor) iniciarCursor(cursor);
  for (const boton of document.querySelectorAll<HTMLElement>('[data-magnetico]')) iniciarIman(boton);
}
