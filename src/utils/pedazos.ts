import { BRAND_COLORS, type Pieza } from '../data/brand';

/** Unidad de celda y hueco crema entre piezas, en unidades del viewBox. */
export const U = 100;
export const HUECO = 14;

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  fill: string;
  hueco: boolean;
  cliente: boolean;
};

/**
 * Convierte piezas en celdas a rectángulos SVG con extremos en medio círculo.
 * Cada pieza se insetea HUECO/4 y lleva un trazo crema de HUECO/2: entre dos
 * piezas vecinas queda siempre un hueco crema de HUECO unidades.
 */
export function piezasARects(piezas: Pieza[]): Rect[] {
  return piezas.map((p) => {
    const width = p.w * U - HUECO / 2;
    const height = p.h * U - HUECO / 2;
    return {
      x: p.x * U + HUECO / 4,
      y: p.y * U + HUECO / 4,
      width,
      height,
      rx: Math.min(width, height) / 2,
      fill: p.color === 'hueco' ? 'none' : BRAND_COLORS[p.color],
      hueco: p.color === 'hueco',
      cliente: Boolean(p.cliente),
    };
  });
}

/**
 * Marcado SVG (solo los <rect>). Cada pieza lleva `data-pieza` (su índice) para poder
 * animarla; el hueco lleva `data-hueco` y la pieza del cliente, `data-cliente`.
 */
export function rectsASvg(rects: Rect[]): string {
  return rects
    .map((r, i) =>
      r.hueco
        ? `<rect data-hueco="" x="${r.x + HUECO / 2}" y="${r.y + HUECO / 2}" width="${r.width - HUECO}" height="${r.height - HUECO}" rx="${r.rx - HUECO / 2}" fill="none" stroke="${BRAND_COLORS.navy}" stroke-width="4" stroke-dasharray="14 12" stroke-linecap="round"/>`
        : `<rect data-pieza="${i}"${r.cliente ? ' data-cliente=""' : ''} x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${r.rx}" fill="${r.fill}" stroke="${BRAND_COLORS.crema}" stroke-width="${HUECO / 2}"/>`,
    )
    .join('');
}
