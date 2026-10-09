/** Paleta de marca (manual v2.0). Mantener sincronizada con src/styles/tokens.css. */
export const BRAND_COLORS = {
  navy: '#0F1B3B',
  crema: '#F5F1E6',
  sol: '#FFD500',
  chicle: '#FFBFBF',
  mandarina: '#FF8936',
  amarillo: '#F7C600',
  blanco: '#FFFFFF',
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;

/** Una pieza de la retícula de «pedazos» (posición y tamaño en celdas). */
export type Pieza = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 'hueco' dibuja una pieza vacía con borde discontinuo: el pedazo que falta. */
  color: BrandColor | 'hueco';
};

export type Composicion = { columnas: number; filas: number; piezas: Pieza[] };
