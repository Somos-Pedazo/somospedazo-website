/**
 * Validación en cliente con mensajes propios en castellano.
 * Las reglas se leen de los atributos HTML (required, type, minlength, pattern),
 * así el marcado es la única fuente de verdad. El servidor repite las comprobaciones
 * esenciales (src/pages/api/contact.ts) con la misma expresión de correo.
 */
import { EMAIL_RE } from '../../config/zoho';

export type Control = HTMLInputElement | HTMLTextAreaElement;

/** Mensajes por campo (data-etiqueta) y tipo de error. */
const MENSAJES: Record<string, Partial<Record<'vacio' | 'formato' | 'corto', string>>> = {
  nombre: { vacio: 'Escribe tu nombre.' },
  apellidos: { vacio: 'Escribe tus apellidos.' },
  email: {
    vacio: 'Escribe tu correo electrónico.',
    formato: 'Revisa el correo: debe tener un formato como nombre@empresa.com.',
  },
  telefono: { formato: 'Revisa el teléfono: usa solo números, espacios, guiones o el signo +.' },
  mensaje: {
    vacio: 'Cuéntanos brevemente tu proyecto.',
    corto: 'Cuéntanos un poco más: escribe al menos 10 caracteres.',
  },
  privacidad: { vacio: 'Para poder responderte, necesitamos que aceptes la política de privacidad.' },
};

/** Devuelve el mensaje de error del control, o null si es válido. */
export function validar(control: Control): string | null {
  const clave = control.dataset.etiqueta ?? '';
  const m = MENSAJES[clave] ?? {};

  if (control instanceof HTMLInputElement && control.type === 'checkbox') {
    return control.required && !control.checked ? (m.vacio ?? 'Este campo es obligatorio.') : null;
  }

  const valor = control.value.trim();
  if (!valor) return control.required ? (m.vacio ?? 'Este campo es obligatorio.') : null;

  if (control.type === 'email' && (control.validity.typeMismatch || !EMAIL_RE.test(valor))) {
    return m.formato ?? 'Revisa el formato.';
  }
  if (control instanceof HTMLInputElement && control.pattern && !new RegExp(`^(?:${control.pattern})$`, 'v').test(valor)) {
    return m.formato ?? 'Revisa el formato.';
  }
  if (control.minLength > 0 && valor.length < control.minLength) {
    return m.corto ?? `Escribe al menos ${control.minLength} caracteres.`;
  }
  return null;
}

/** Pinta u oculta el error de un control de forma accesible (aria-invalid + texto asociado). */
export function mostrarError(control: Control, mensaje: string | null): void {
  const error = document.getElementById(`${control.id}-error`);
  if (!error) return;
  if (mensaje) {
    control.setAttribute('aria-invalid', 'true');
    error.textContent = mensaje;
    error.hidden = false;
  } else {
    control.removeAttribute('aria-invalid');
    error.textContent = '';
    error.hidden = true;
  }
}
