/**
 * Envío del correo de confirmación con Resend (https://resend.com).
 * - Clave en RESEND_API_KEY (variable de entorno; nunca en el código).
 * - Un único intento, con tiempo máximo: si falla, se registra y no se reintenta.
 *   El lead ya está en Zoho, así que el usuario recibe éxito igualmente.
 */
import { Resend } from 'resend';
import { ASUNTO_CONFIRMACION, correoConfirmacion } from './email/confirmacion';

const REMITENTE = 'Somos Pedazo <hola@somospedazo.com>';
const RESPONDER_A = 'hola@somospedazo.com';
const TIMEOUT_MS = 8000;

/** Clave de Resend: inyectada en el build o, si no estaba, leída en tiempo de ejecución. */
function claveResend(): string | undefined {
  return import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || undefined;
}

export type ResultadoCorreo = { ok: true; id: string } | { ok: false; motivo: string };

export async function enviarConfirmacion(destinatario: string, nombre: string): Promise<ResultadoCorreo> {
  const clave = claveResend();
  if (!clave) {
    console.error('[confirmacion] Falta RESEND_API_KEY: no se envía el correo de confirmación');
    return { ok: false, motivo: 'sin-clave' };
  }

  const { html, text } = correoConfirmacion(nombre);
  const resend = new Resend(clave);

  try {
    const envio = resend.emails.send({
      from: REMITENTE,
      to: [destinatario],
      replyTo: RESPONDER_A,
      subject: ASUNTO_CONFIRMACION,
      html,
      text,
    });
    const limite = new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error('timeout')), TIMEOUT_MS));
    const { data, error } = await Promise.race([envio, limite]);
    if (error || !data) {
      console.error('[confirmacion] Resend rechazó el envío:', error?.name ?? 'sin-datos', error?.message ?? '');
      return { ok: false, motivo: error?.name ?? 'sin-datos' };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    console.error('[confirmacion] Error enviando con Resend:', e instanceof Error ? e.message : e);
    return { ok: false, motivo: e instanceof Error ? e.message : 'error' };
  }
}
