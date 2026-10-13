/**
 * Interruptor del sistema de movimiento v2 (hero vivo, cinta, hilo conductor, cursor y botones
 * magnéticos). Se decide en build con la variable de entorno PUBLIC_HERO_V2:
 *   - PUBLIC_HERO_V2=false → versión anterior del hero, sin cinta, hilo, cursor ni imanes.
 *   - cualquier otro valor, o sin definir → versión v2.
 * Para volver atrás: en Vercel, PUBLIC_HERO_V2=false y redesplegar (sin revertir código).
 */
export const HERO_V2 = import.meta.env.PUBLIC_HERO_V2 !== 'false';
