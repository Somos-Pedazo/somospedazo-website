/**
 * Hero v2 · las piezas sueltas encajan (src/components/hero-v2/HeroV2.astro).
 *
 * Tres capas de movimiento por pieza, para no cargar el hilo principal:
 *   1. Posición (.h2pieza): física de muelle en un bucle requestAnimationFrame que SOLO corre
 *      mientras algo cambia (scroll, cursor, inclinación) y se duerme cuando las piezas se asientan.
 *        objetivo = posición suelta × (1 − encaje) + empuje del cursor / scroll / inclinación
 *   2. Deriva orgánica (.h2pieza__deriva): Web Animations en bucle; la ejecuta el compositor, sin JS
 *      por fotograma. Su amplitud se escala con lo suelta que está la pieza (encajada → quieta).
 *   3. Entrada y «clic» (.h2pieza__in).
 * - Encaje: progreso del scroll (ScrollTrigger). Escritorio: escena fijada con sticky (220svh,
 *   1,2 pantallas de recorrido). Móvil: sin fijar, encajan mientras la composición entra en pantalla.
 *   Cada pieza tiene su turno (`data-orden`); la última hace «clic» al llegar (escala 1 → 1,04 → 1).
 * - Escritorio con puntero fino: las piezas se apartan del cursor (más sueltas, más se apartan).
 * - Móvil: reaccionan a la velocidad del scroll y, si el navegador la da sin pedir permiso
 *   (Android), a la inclinación del dispositivo.
 * - Con el hero fuera de pantalla (IntersectionObserver) o la pestaña oculta se para todo:
 *   bucle, deriva y aurora.
 */
import { MQ, escena } from '../motion/base';

type Suelta = { x: number; y: number; r: number };
type Pieza = {
  el: HTMLElement;
  deriva: HTMLElement;
  interior: HTMLElement;
  i: number;
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
  /** Animación de deriva y la amplitud con la que se creó (0…1, en pasos de 0,1). */
  animDeriva?: Animation;
  libreDeriva: number;
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

/** Fotogramas de la deriva de una pieza: un lazo cerrado y distinto para cada una. */
function fotogramasDeriva(i: number, amplitud: number, giro: number): Keyframe[] {
  const s = (n: number) => Math.sin(i * 1.7 + n) * amplitud;
  const c = (n: number) => Math.cos(i * 2.3 + n) * amplitud;
  const g = (n: number) => Math.sin(i * 0.9 + n) * giro;
  return [
    { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
    { transform: `translate3d(${s(0).toFixed(1)}px, ${c(1).toFixed(1)}px, 0) rotate(${g(0).toFixed(1)}deg)` },
    { transform: `translate3d(${(-c(2)).toFixed(1)}px, ${s(3).toFixed(1)}px, 0) rotate(${(-g(2)).toFixed(1)}deg)` },
    { transform: `translate3d(${s(4).toFixed(1)}px, ${(-c(5)).toFixed(1)}px, 0) rotate(${g(4).toFixed(1)}deg)` },
    { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
  ];
}

escena('hero-v2', (gsap, ScrollTrigger) => {
  const escenaEl = document.querySelector<HTMLElement>('[data-hero2]');
  const seccion = escenaEl?.querySelector<HTMLElement>('[data-hero2-seccion]');
  const composicion = escenaEl?.querySelector<HTMLElement>('[data-hero2-composicion]');
  if (!escenaEl || !seccion || !composicion) return;
  const pista = escenaEl.querySelector<HTMLElement>('[data-hero2-pista]');

  const piezas: Pieza[] = [...composicion.querySelectorAll<HTMLElement>('[data-pieza]')].map((el, i) => ({
    el,
    deriva: el.querySelector<HTMLElement>('.h2pieza__deriva')!,
    interior: el.querySelector<HTMLElement>('.h2pieza__in')!,
    i,
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
    libreDeriva: -1,
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
    const amplitud = escritorio ? 16 : 9;
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

    /** Deriva con la amplitud que toca (en pasos de 0,1 para no recrear fotogramas a cada instante). */
    const ajustarDeriva = (p: Pieza, libre: number) => {
      const q = Math.round(libre * 10) / 10;
      if (q === p.libreDeriva) return;
      p.libreDeriva = q;
      if (!p.animDeriva) {
        p.animDeriva = p.deriva.animate(fotogramasDeriva(p.i, amplitud * q, 7 * q), {
          duration: 9000 + p.i * 1300,
          iterations: Infinity,
          easing: 'ease-in-out',
        });
        p.animDeriva.currentTime = p.i * 1700; // desfasadas entre sí
      } else {
        (p.animDeriva.effect as KeyframeEffect).setKeyframes(fotogramasDeriva(p.i, amplitud * q, 7 * q));
      }
      if (q === 0) p.animDeriva.pause();
      else if (visible && !document.hidden) p.animDeriva.play();
    };

    const clic = (p: Pieza) => {
      gsap
        .timeline()
        .to(p.interior, { scale: 1.04, duration: 0.12, ease: 'power2.out' })
        .to(p.interior, { scale: 1, duration: 0.9, ease: 'elastic.out(1.1, 0.35)' });
    };

    const paso = (ahora: number) => {
      const dt = Math.min((ahora - anterior) / 1000, 1 / 30);
      anterior = ahora;
      empujeScroll *= Math.pow(0.02, dt); // el empujón del scroll se disipa en ~1 s
      let enMovimiento = Math.abs(empujeScroll) > 0.05;

      for (const p of piezas) {
        const k = encaje(p, progreso);
        const libre = 1 - k;
        ajustarDeriva(p, libre);

        let tx = (p.dx + inclinacion.x) * libre;
        let ty = (p.dy + inclinacion.y) * libre + empujeScroll * (0.5 + (p.orden % 3) * 0.25) * libre;
        const tr = (escritorio ? p.suelta.r : p.sueltaMovil.r) * libre;

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
        if (Math.abs(tx - p.x) > 0.05 || Math.abs(ty - p.y) > 0.05 || Math.abs(tr - p.r) > 0.05 || Math.hypot(p.vx, p.vy, p.vr) > 0.05) {
          enMovimiento = true;
        }

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
      // Todo asentado: el bucle se duerme hasta la próxima entrada (scroll, cursor, inclinación).
      raf = enMovimiento ? requestAnimationFrame(paso) : 0;
    };

    const despertar = () => {
      if (raf || !visible || document.hidden) return;
      anterior = performance.now();
      raf = requestAnimationFrame(paso);
    };
    const pausar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      seccion.setAttribute('data-pausa', '');
      for (const p of piezas) p.animDeriva?.pause();
    };
    const reanudar = () => {
      seccion.removeAttribute('data-pausa');
      for (const p of piezas) if (p.libreDeriva > 0) p.animDeriva?.play();
      despertar();
    };

    // Estado inicial: cada pieza ya en su sitio suelto (sin vuelo desde la composición) y entrada
    // con Web Animations (escala + opacidad: compositor, sin JS por fotograma).
    medir();
    const st = escritorio
      ? ScrollTrigger.create({
          trigger: escenaEl,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            progreso = self.progress / 0.92; // el último 8 % es una pausa con todo encajado
            if (pista) pista.style.opacity = String(clamp(1 - self.progress * 8) * 0.85);
            despertar();
          },
        })
      : ScrollTrigger.create({
          trigger: composicion,
          start: 'top 85%',
          end: 'center 45%',
          onUpdate: (self) => {
            progreso = self.progress;
            empujeScroll = clamp(-self.getVelocity() * 0.012, -18, 18);
            despertar();
          },
        });
    progreso = escritorio ? st.progress / 0.92 : st.progress;
    for (const p of piezas) {
      const libre = 1 - encaje(p, progreso);
      p.x = p.dx * libre;
      p.y = p.dy * libre;
      p.r = (escritorio ? p.suelta.r : p.sueltaMovil.r) * libre;
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg)`;
      p.el.style.opacity = '1';
      ajustarDeriva(p, libre);
      p.interior.animate([{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)' }], {
        duration: 700,
        delay: p.i * 50,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // back.out
        fill: 'backwards',
      });
    }

    const alRefrescar = () => {
      medir();
      despertar();
    };
    ScrollTrigger.addEventListener('refresh', alRefrescar);

    const io = new IntersectionObserver(([entrada]) => {
      visible = Boolean(entrada?.isIntersecting);
      if (visible) reanudar();
      else pausar();
    });
    io.observe(seccion);
    const alCambiarVisibilidad = () => (document.hidden ? pausar() : reanudar());
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    // Escritorio: cursor (solo puntero fino). Móvil: inclinación, si no exige permiso (Android).
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const caja = seccion.getBoundingClientRect();
      puntero = { x: e.clientX - caja.left, y: e.clientY - caja.top };
      despertar();
    };
    const alSalir = () => {
      puntero = null;
      despertar();
    };
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const nueva = { x: clamp(e.gamma / 30, -1, 1) * 12, y: clamp((e.beta - 45) / 30, -1, 1) * 10 };
      // Solo cambios perceptibles: el sensor emite sin parar y el bucle debe poder dormir.
      if (Math.abs(nueva.x - inclinacion.x) + Math.abs(nueva.y - inclinacion.y) < 0.6) return;
      inclinacion = nueva;
      despertar();
    };
    const pidePermiso =
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
    if (escritorio && matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', alMover, { passive: true });
      document.documentElement.addEventListener('pointerleave', alSalir);
    } else if (!escritorio && !pidePermiso && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', alInclinar, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      seccion.removeAttribute('data-pausa');
      io.disconnect();
      st.kill();
      ScrollTrigger.removeEventListener('refresh', alRefrescar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('pointermove', alMover);
      document.documentElement.removeEventListener('pointerleave', alSalir);
      window.removeEventListener('deviceorientation', alInclinar);
      for (const p of piezas) {
        p.animDeriva?.cancel();
        p.animDeriva = undefined;
        p.libreDeriva = -1;
        p.el.style.transform = '';
        p.x = p.y = p.r = p.vx = p.vy = p.vr = 0;
      }
    };
  };

  mm.add(MQ.escritorio, () => crearEscena(true));
  mm.add(MQ.movil, () => crearEscena(false));
});
