/**
 * Envío del formulario al endpoint propio (/api/contact), que valida el captcha
 * y reenvía el lead a Zoho desde el servidor. Aquí solo se traduce su respuesta.
 */
export type MotivoError = 'captcha' | 'validacion' | 'zoho' | 'servidor' | 'red' | 'timeout';
export type Resultado = { ok: true } | { ok: false; motivo: MotivoError; campos?: string[] };

const TIMEOUT_MS = 20000;
const CONOCIDOS: MotivoError[] = ['captcha', 'validacion', 'zoho', 'servidor'];

export async function enviarLead(endpoint: string, datos: FormData): Promise<Resultado> {
  const cuerpo = new URLSearchParams();
  for (const [clave, valor] of datos) if (typeof valor === 'string') cuerpo.append(clave, valor);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      body: cuerpo,
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return { ok: false, motivo: e instanceof DOMException && e.name === 'TimeoutError' ? 'timeout' : 'red' };
  }

  const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; campos?: string[] } | null;
  if (res.ok && json?.ok === true) return { ok: true };

  const motivo = CONOCIDOS.find((m) => m === json?.error) ?? 'servidor';
  return { ok: false, motivo, campos: json?.campos };
}
