/**
 * Correo de confirmación al enviar el formulario de contacto (transaccional, no comercial).
 *
 * - HTML: plantilla confirmacion.html (tablas y estilos en línea), sin cambios de estructura.
 *   Lo único variable es el nombre, escapado como HTML.
 * - Por seguridad, el correo NO incluye el mensaje ni ningún otro texto escrito por el usuario,
 *   salvo el nombre: así el formulario no sirve para mandar contenido arbitrario a terceros.
 */
import plantilla from './confirmacion.html?raw';

export const ASUNTO_CONFIRMACION = 'Hemos recibido tu mensaje - Somos Pedazo';

/** Marcador del nombre en la plantilla (heredado del autoresponder de Zoho). */
const MARCADOR_NOMBRE = '${Leads.First Name}';

/** Escapa los caracteres con significado en HTML: & < > " ' */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Nombre apto para el correo: sin saltos de línea ni caracteres de control, y recortado. */
function limpiarNombre(nombre: string): string {
  return nombre.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
}

export function correoConfirmacion(nombre: string): { html: string; text: string } {
  const limpio = limpiarNombre(nombre);
  const html = plantilla.split(MARCADOR_NOMBRE).join(escaparHtml(limpio));

  const text = [
    `Hola ${limpio}, ya tenemos tu pedazo.`,
    '',
    'Gracias por contarnos tu proyecto. Tu mensaje ha llegado bien y ya está en manos del equipo.',
    '',
    'Lo va a leer una persona, no un robot, y te escribiremos en menos de 24 horas laborables para ver por dónde empezar.',
    '',
    'Si mientras tanto quieres añadir algo, responde a este correo y lo sumamos a la conversación.',
    '',
    'Ver cómo trabajamos: https://somospedazo.com/servicios',
    '',
    'Cada uno aporta su pedazo. Juntos, encajamos.',
    'El equipo de Somos Pedazo',
    '',
    '--',
    'Recibes este correo porque has enviado el formulario de contacto de somospedazo.com.',
    'Es un mensaje automático de confirmación; no te suscribe a ninguna comunicación comercial.',
    'Somos Pedazo · Política de privacidad: https://somospedazo.com/privacidad · dpo@somospedazo.com',
  ].join('\n');

  return { html, text };
}
