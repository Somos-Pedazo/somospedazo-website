import type { Composicion } from './brand';

/**
 * Composiciones de «pedazos» reutilizables. Retículas pequeñas y equilibradas:
 * la marca se reconoce sin recargar.
 */

/** Portada: piezas que encajan y un hueco libre, el pedazo del cliente. */
export const HERO: Composicion = {
  columnas: 6,
  filas: 6,
  piezas: [
    { x: 0, y: 0, w: 4, h: 1, color: 'sol' },
    { x: 4, y: 0, w: 1, h: 1, color: 'chicle' },
    { x: 5, y: 0, w: 1, h: 3, color: 'navy' },
    { x: 0, y: 1, w: 1, h: 3, color: 'mandarina' },
    { x: 1, y: 1, w: 3, h: 1, color: 'navy' },
    { x: 4, y: 1, w: 1, h: 2, color: 'amarillo' },
    { x: 1, y: 2, w: 2, h: 1, color: 'chicle' },
    { x: 3, y: 2, w: 1, h: 1, color: 'hueco' },
    { x: 1, y: 3, w: 1, h: 1, color: 'sol' },
    { x: 2, y: 3, w: 4, h: 1, color: 'chicle' },
    { x: 0, y: 4, w: 2, h: 2, color: 'navy' },
    { x: 2, y: 4, w: 1, h: 2, color: 'sol' },
    { x: 3, y: 4, w: 3, h: 1, color: 'mandarina' },
    { x: 3, y: 5, w: 1, h: 1, color: 'amarillo' },
    { x: 4, y: 5, w: 2, h: 1, color: 'navy' },
    // El pedazo del cliente: ocupa el hueco. En el estado final (sin animación) está encajado;
    // en el hero animado es el último en llegar.
    { x: 3, y: 2, w: 1, h: 1, color: 'mandarina', cliente: true },
  ],
};

/** Franja horizontal para cabeceras de página interior. */
export const FRANJA: Composicion = {
  columnas: 12,
  filas: 1,
  piezas: [
    { x: 0, y: 0, w: 5, h: 1, color: 'sol' },
    { x: 5, y: 0, w: 1, h: 1, color: 'navy' },
    { x: 6, y: 0, w: 3, h: 1, color: 'chicle' },
    { x: 9, y: 0, w: 1, h: 1, color: 'amarillo' },
    { x: 10, y: 0, w: 2, h: 1, color: 'mandarina' },
  ],
};

/** Tres piezas: estrategia, marketing y tecnología encajando. */
export const TRIO: Composicion = {
  columnas: 3,
  filas: 2,
  piezas: [
    { x: 0, y: 0, w: 2, h: 1, color: 'sol' },
    { x: 2, y: 0, w: 1, h: 2, color: 'mandarina' },
    { x: 0, y: 1, w: 2, h: 1, color: 'chicle' },
  ],
};
