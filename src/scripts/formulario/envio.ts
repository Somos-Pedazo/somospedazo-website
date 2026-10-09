/**
 * Envío del lead. ÚNICO punto que cambia en la fase 2.
 *
 * Fase 1 (actual): POST directo a Zoho Web-to-Lead en segundo plano.
 *   Zoho no envía cabeceras CORS, así que la petición va en modo `no-cors`:
 *   el navegador la entrega a Zoho, pero la respuesta es opaca. Solo podemos
 *   detectar fallos de red (sin conexión, bloqueo, timeout), no si Zoho
 *   rechazó el lead. Tras cualquier cambio de campos, haz un envío de prueba y
 *   comprueba que el lead aparece en Zoho CRM.
 *
 * Fase 2 (Turnstile + Vercel): cambia `enviarLead` para hacer
 *   fetch('/api/contacto', { method: 'POST', body: datos }) incluyendo el token
 *   `cf-turnstile-response` (Turnstile lo añade solo como campo del formulario).
 *   La función valida el token con Cloudflare, reenvía a Zoho desde el servidor
 *   y devuelve un estado real (200 / 4xx), que aquí ya se trata como Resultado.
 */
export type Resultado = { ok: true } | { ok: false; motivo: 'red' | 'timeout' };

const TIMEOUT_MS = 15000;

export async function enviarLead(endpoint: string, datos: FormData): Promise<Resultado> {
  // application/x-www-form-urlencoded: tipo «simple», permitido en no-cors y el que espera Zoho.
  const cuerpo = new URLSearchParams();
  for (const [clave, valor] of datos) if (typeof valor === 'string') cuerpo.append(clave, valor);

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      body: cuerpo,
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: control.signal,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e instanceof DOMException && e.name === 'AbortError' ? 'timeout' : 'red' };
  } finally {
    clearTimeout(temporizador);
  }
}
