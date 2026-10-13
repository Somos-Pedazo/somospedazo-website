/**
 * Hero v2 · las piezas sueltas encajan (src/components/hero-v2/HeroV2.astro).
 *
 * Un único bucle requestAnimationFrame mueve las piezas con física de muelle, solo con transform:
 *   objetivo = (posición suelta + deriva orgánica) × (1 − encaje) + empuje del cursor/scroll/inclinación
 *   La velocidad tiende al objetivo como un muelle algo subamortiguado: movimiento blando, sin saltos.
 * - Encaje: progreso del scroll (ScrollTrigger). Escritorio: escena fijada con sticky (220svh,
 *   1,2 pantallas de recorrido). Móvil: sin fijar, encajan mientras la composición entra en pantalla.
 *   Cada pieza tiene su turno (`data-orden`); la última hace «clic» al llegar (escala 1 → 1,04 → 1).
 * - Escritorio con puntero fino: las piezas se apartan del cursor (más sueltas, más se apartan).
 * - Móvil: reaccionan a la velocidad del scroll y, si el navegador la da sin pedir permiso,
 *   a la inclinación del dispositivo.
 * - El bucle se para con el hero fuera de pantalla (IntersectionObserver) o la pestaña oculta,
 *   y entonces también se pausa la aurora.
 */
import { MQ, escena } from '../motion/base';

type Suelta = { x: number; y: number; r: number };
type Pieza = {
  el: HTMLElement;
  interior: HTMLElement;
  orden: number;
  ultima: boolean;
  suelta: Suelta;
  sueltaMovil: Suelta;
  /** Centro y tamaño de la pieza encajada, relativos a la sección del hero (sin transform). */
  cx: number;
  cy: number;
  ancho: number;
  /** Desplazamiento que la lleva a su posición suelta. */
  dx: number;
  dy: number;
  // Estado del muelle
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  vr: number;
  /** Fases y frecuencias de la deriva (pseudoaleatorias, estables por pieza). */
  f: [number, number, number, number];
};

const RIGIDEZ = 150;
const AMORTIGUACION = 2 * Math.sqrt(RIGIDEZ) * 0.55; // < 1 · crítica: un poco de rebote
const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const suave = (t: number) => 1 - Math.pow(1 - t, 3); // power3.out
const leer = (v?: string): Suelta => {
  const [x = 0, y = 0, r = 0] = (v ?? '').split(',').map(Number);
  return { x, y, r };
};

/** Posición de `el` relativa a `ancestro`, por la maquetación (ignora transforms). */
function offsetRelativo(el: HTMLElement, ancestro: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let nodo: HTMLElement | null = el;
  while (nodo && nodo !== ancestro) {
    x += nodo.offsetLeft;
    y += nodo.offsetTop;
    nodo = nodo.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

escena('hero-v2', (gsap, ScrollTrigger) => {
  const escenaEl = document.querySelector<HTMLElement>('[data-hero2]');
  const seccion = escenaEl?.querySelector<HTMLElement>('[data-hero2-seccion]');
  const composicion = escenaEl?.querySelector<HTMLElement>('[data-hero2-composicion]');
  if (!escenaEl || !seccion || !composicion) return;
  const pista = escenaEl.querySelector<HTMLElement>('[data-hero2-pista]');

  const piezas: Pieza[] = [...composicion.querySelectorAll<HTMLElement>('[data-pieza]')].map((el, i) => ({
    el,
    interior: el.firstElementChild as HTMLElement,
    orden: Number(el.dataset.orden ?? i),
    ultima: el.hasAttribute('data-ultima'),
    suelta: leer(el.dataset.suelta),
    sueltaMovil: leer(el.dataset.sueltaMovil),
    cx: 0,
    cy: 0,
    ancho: 0,
    dx: 0,
    dy: 0,
    x: 0,
    y: 0,
    r: 0,
    vx: 0,
    vy: 0,
    vr: 0,
    f: [0.31 + ((i * 0.137) % 0.3), 0.23 + ((i * 0.091) % 0.25), i * 1.7, i * 2.3],
  }));
  const total = Math.max(...piezas.map((p) => p.orden)) || 1;

  /** Grado de encaje de cada pieza para un progreso p (0 suelta → 1 encajada), con su turno. */
  const encaje = (p: Pieza, progreso: number) => {
    if (p.ultima) return suave(clamp((progreso - 0.62) / 0.3));
    const inicio = (p.orden / total) * 0.45;
    return suave(clamp((progreso - inicio) / 0.4));
  };

  const mm = gsap.matchMedia();

  const crearEscena = (escritorio: boolean) => {
    let progreso = 0;
    let visible = true;
    let raf = 0;
    let anterior = performance.now();
    let clicHecho = false;
    // Entradas externas
    let puntero: { x: number; y: number } | null = null;
    let empujeScroll = 0;
    let inclinacion = { x: 0, y: 0 };

    /** Geometría: centro de cada pieza encajada y su punto suelto. Solo lecturas de maquetación. */
    const medir = () => {
      const W = seccion.clientWidth;
      const H = seccion.clientHeight;
      const comp = offsetRelativo(composicion, seccion);
      const cw = composicion.clientWidth;
      const ch = composicion.clientHeight;
      for (const p of piezas) {
        const o = offsetRelativo(p.el, seccion);
        p.ancho = p.el.offsetWidth;
        p.cx = o.x + p.el.offsetWidth / 2;
        p.cy = o.y + p.el.offsetHeight / 2;
        const destino = escritorio
          ? { x: p.suelta.x * W, y: p.suelta.y * H }
          : { x: comp.x + p.sueltaMovil.x * cw, y: comp.y + p.sueltaMovil.y * ch };
        p.dx = destino.x - p.cx;
        p.dy = destino.y - p.cy;
      }
    };

    const clic = (p: Pieza) => {
      gsap
        .timeline()
        .to(p.interior, { scale: 1.04, duration: 0.12, ease: 'power2.out' })
        .to(p.interior, { scale: 1, duration: 0.9, ease: 'elastic.out(1.1, 0.35)' });
    };

    const paso = (ahora: number) => {
      raf = requestAnimationFrame(paso);
      const dt = Math.min((ahora - anterior) / 1000, 1 / 30);
      anterior = ahora;
      const t = ahora / 1000;
      const amplitud = escritorio ? 16 : 9;
      empujeScroll *= Math.pow(0.02, dt); // el empujón del scroll se disipa en ~1 s

      for (const p of piezas) {
        const k = encaje(p, progreso);
        const libre = 1 - k;
        const [f1, f2, a, b] = p.f;
        const derivaX = (Math.sin(t * f1 + a) * 0.7 + Math.sin(t * f2 * 1.7 + b) * 0.3) * amplitud;
        const derivaY = (Math.cos(t * f2 + b) * 0.7 + Math.sin(t * f1 * 1.3 + a) * 0.3) * amplitud;
        const derivaR = Math.sin(t * f1 * 0.8 + b) * 6;

        let tx = (p.dx + derivaX + inclinacion.x) * libre;
        let ty = (p.dy + derivaY + inclinacion.y) * libre + empujeScroll * (0.5 + (p.orden % 3) * 0.25) * libre;
        const tr = ((escritorio ? p.suelta.r : p.sueltaMovil.r) + derivaR) * libre;

        // Imán inverso: el cursor aparta las piezas (también encajadas, pero mucho menos).
        if (puntero) {
          const ddx = p.cx + p.x - puntero.x;
          const ddy = p.cy + p.y - puntero.y;
          const d = Math.hypot(ddx, ddy) || 1;
          const radio = 170 + p.ancho * 0.35;
          if (d < radio) {
            const fuerza = Math.pow(1 - d / radio, 2) * 70 * (0.18 + 0.82 * libre);
            tx += (ddx / d) * fuerza;
            ty += (ddy / d) * fuerza;
          }
        }

        p.vx += (RIGIDEZ * (tx - p.x) - AMORTIGUACION * p.vx) * dt;
        p.vy += (RIGIDEZ * (ty - p.y) - AMORTIGUACION * p.vy) * dt;
        p.vr += (RIGIDEZ * (tr - p.r) - AMORTIGUACION * p.vr) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        p.el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${p.r.toFixed(2)}deg)`;

        // «Clic» de la última pieza al quedar encajada (se rearma si vuelve a soltarse).
        if (p.ultima) {
          if (!clicHecho && k > 0.999 && Math.hypot(p.x, p.y) < 1.5 && Math.hypot(p.vx, p.vy) < 40) {
            clicHecho = true;
            clic(p);
          } else if (k < 0.9) {
            clicHecho = false;
          }
        }
      }
    };

    const arrancar = () => {
      if (raf || !visible || document.hidden) return;
      anterior = performance.now();
      raf = requestAnimationFrame(paso);
      seccion.removeAttribute('data-pausa');
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      seccion.setAttribute('data-pausa', '');
    };

    // Estado inicial: cada pieza ya en su sitio suelto (sin vuelo desde la composición).
    medir();
    for (const p of piezas) {
      p.x = p.dx;
      p.y = p.dy;
      p.r = escritorio ? p.suelta.r : p.sueltaMovil.r;
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg)`;
    }
    gsap.fromTo(piezas.map((p) => p.interior), { scale: 0.4 }, { scale: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.05 });
    gsap.to(
      piezas.map((p) => p.el),
      { opacity: 1, duration: 0.6, ease: 'power1.out', stagger: 0.05 },
    );

    const st = escritorio
      ? ScrollTrigger.create({
          trigger: escenaEl,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            progreso = self.progress / 0.92; // el último 8 % es una pausa con todo encajado
            if (pista) pista.style.opacity = String(clamp(1 - self.progress * 8) * 0.85);
          },
        })
      : ScrollTrigger.create({
          trigger: composicion,
          start: 'top 85%',
          end: 'center 45%',
          onUpdate: (self) => {
            progreso = self.progress;
            empujeScroll = clamp(-self.getVelocity() * 0.012, -18, 18);
          },
        });
    progreso = escritorio ? st.progress / 0.92 : st.progress;

    const alRefrescar = () => medir();
    ScrollTrigger.addEventListener('refresh', alRefrescar);

    const io = new IntersectionObserver(([entrada]) => {
      visible = Boolean(entrada?.isIntersecting);
      if (visible) arrancar();
      else parar();
    });
    io.observe(seccion);
    const alCambiarVisibilidad = () => (document.hidden ? parar() : arrancar());
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    // Escritorio: cursor (solo puntero fino). Móvil: inclinación, si no exige permiso (Android).
    const finoMq = matchMedia('(pointer: fine)');
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const caja = seccion.getBoundingClientRect();
      puntero = { x: e.clientX - caja.left, y: e.clientY - caja.top };
    };
    const alSalir = () => (puntero = null);
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      inclinacion = { x: clamp(e.gamma / 30, -1, 1) * 12, y: clamp((e.beta - 45) / 30, -1, 1) * 10 };
    };
    const pidePermiso =
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
    if (escritorio && finoMq.matches) {
      window.addEventListener('pointermove', alMover, { passive: true });
      document.documentElement.addEventListener('pointerleave', alSalir);
    } else if (!escritorio && !pidePermiso && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', alInclinar, { passive: true });
    }

    arrancar();

    return () => {
      parar();
      seccion.removeAttribute('data-pausa');
      io.disconnect();
      st.kill();
      ScrollTrigger.removeEventListener('refresh', alRefrescar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('pointermove', alMover);
      document.documentElement.removeEventListener('pointerleave', alSalir);
      window.removeEventListener('deviceorientation', alInclinar);
      for (const p of piezas) {
        p.el.style.transform = '';
        p.x = p.y = p.r = p.vx = p.vy = p.vr = 0;
      }
    };
  };

  mm.add(MQ.escritorio, () => crearEscena(true));
  mm.add(MQ.movil, () => crearEscena(false));
});
