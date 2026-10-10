/**
 * Límite de envíos por IP: como mucho MAX_ENVIOS en VENTANA_MS (3 cada 10 minutos).
 *
 * Almacenamiento en memoria de la función: es por instancia de Vercel (cada instancia lleva su
 * propia cuenta y se pierde al reciclarse). Basta como freno ante abusos junto con Turnstile;
 * para un límite global habría que usar un almacén compartido (p. ej. Vercel KV / Upstash).
 */
const MAX_ENVIOS = 3;
const VENTANA_MS = 10 * 60 * 1000;
const MAX_IPS = 10_000; // tope de memoria: si se supera, se descartan las entradas más antiguas

const envios = new Map<string, number[]>();

function purgar(ahora: number): void {
  for (const [ip, marcas] of envios) {
    const vigentes = marcas.filter((t) => ahora - t < VENTANA_MS);
    if (vigentes.length) envios.set(ip, vigentes);
    else envios.delete(ip);
  }
  // Map conserva el orden de inserción: las primeras claves son las más antiguas.
  while (envios.size > MAX_IPS) envios.delete(envios.keys().next().value as string);
}

/**
 * Comprueba si la IP puede enviar y, si puede, registra el envío.
 * Devuelve los segundos que faltan para poder volver a enviar si se ha superado el límite.
 */
export function registrarEnvio(ip: string, ahora = Date.now()): { permitido: true } | { permitido: false; reintentarEn: number } {
  if (envios.size > MAX_IPS / 2) purgar(ahora);
  const marcas = (envios.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (marcas.length >= MAX_ENVIOS) {
    envios.set(ip, marcas);
    return { permitido: false, reintentarEn: Math.ceil((marcas[0]! + VENTANA_MS - ahora) / 1000) };
  }
  marcas.push(ahora);
  envios.delete(ip); // reinsertar para mantener el orden por actividad reciente
  envios.set(ip, marcas);
  return { permitido: true };
}
