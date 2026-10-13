/**
 * Hero v2 · «las piezas sueltas».
 *
 * Composición final (retícula de 6 × 5 celdas, sin huecos): es lo que se ve sin JS y con
 * prefers-reduced-motion. Cada pieza ocupa celdas enteras con extremos en medio círculo.
 * Sobre fondo navy no hay piezas navy; los colores vecinos nunca se repiten.
 *
 * Posiciones sueltas (punto donde flota el centro de cada pieza antes de encajar):
 *   - `suelta`: fracciones del ancho y alto del hero en escritorio (evitan la columna del texto).
 *   - `sueltaMovil`: fracciones de la caja de la composición en móvil.
 *   - `r`: giro en grados.
 * `orden` decide el turno de encaje; la pieza `ultima` (la del cliente) llega la última
 * y hace «clic».
 */
export type ColorPieza = 'sol' | 'chicle' | 'mandarina' | 'amarillo' | 'crema';
type Suelta = { x: number; y: number; r: number };

export type PiezaHero = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: ColorPieza;
  orden: number;
  suelta: Suelta;
  sueltaMovil: Suelta;
  ultima?: boolean;
};

export const RETICULA_HERO = { columnas: 6, filas: 5 } as const;

export const PIEZAS_HERO: PiezaHero[] = [
  { x: 0, y: 0, w: 4, h: 1, color: 'sol', orden: 0, suelta: { x: 0.6, y: 0.13, r: -14 }, sueltaMovil: { x: 0.22, y: 0.0, r: -12 } },
  { x: 4, y: 0, w: 2, h: 1, color: 'chicle', orden: 3, suelta: { x: 0.93, y: 0.2, r: 24 }, sueltaMovil: { x: 0.92, y: 0.06, r: 20 } },
  { x: 0, y: 1, w: 1, h: 3, color: 'mandarina', orden: 1, suelta: { x: 0.585, y: 0.72, r: 32 }, sueltaMovil: { x: 0.04, y: 0.56, r: 28 } },
  { x: 1, y: 1, w: 3, h: 1, color: 'crema', orden: 5, suelta: { x: 0.84, y: 0.88, r: -20 }, sueltaMovil: { x: 0.64, y: 1.16, r: -16 } },
  { x: 4, y: 1, w: 1, h: 2, color: 'mandarina', orden: 7, suelta: { x: 0.975, y: 0.52, r: -28 }, sueltaMovil: { x: 1.0, y: 0.42, r: -24 } },
  { x: 5, y: 1, w: 1, h: 3, color: 'sol', orden: 2, suelta: { x: 0.68, y: 0.44, r: 18 }, sueltaMovil: { x: 0.6, y: 0.34, r: 16 } },
  { x: 1, y: 2, w: 2, h: 1, color: 'chicle', orden: 6, suelta: { x: 0.36, y: 0.95, r: 12 }, sueltaMovil: { x: 0.16, y: 1.1, r: 10 } },
  { x: 3, y: 2, w: 1, h: 1, color: 'sol', orden: 10, ultima: true, suelta: { x: 0.47, y: 0.1, r: 0 }, sueltaMovil: { x: 0.46, y: -0.06, r: 0 } },
  { x: 1, y: 3, w: 4, h: 1, color: 'crema', orden: 4, suelta: { x: 0.62, y: 0.94, r: 8 }, sueltaMovil: { x: 0.32, y: 0.8, r: 9 } },
  { x: 0, y: 4, w: 2, h: 1, color: 'amarillo', orden: 8, suelta: { x: 0.97, y: 0.9, r: -34 }, sueltaMovil: { x: 0.96, y: 1.0, r: -30 } },
  { x: 2, y: 4, w: 4, h: 1, color: 'chicle', orden: 9, suelta: { x: 0.8, y: 0.06, r: 6 }, sueltaMovil: { x: 0.74, y: 0.64, r: 7 } },
];

/** Palabras de la cinta entre secciones, separadas por pedazos de colores. */
export const PALABRAS_CINTA = ['Estrategia', 'Marketing', 'Tecnología', 'Growth', 'Datos', 'Automatización', 'Campañas', 'Web'];
