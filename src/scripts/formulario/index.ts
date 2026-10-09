/**
 * Controlador del formulario de contacto: valida, envía y muestra el resultado
 * sin salir de la web. Sin JS, el formulario hace un POST normal a Zoho
 * (validación nativa del navegador) y el lead llega igualmente.
 */
import { enviarLead } from './envio';
import { mostrarError, validar, type Control } from './validacion';

function iniciar(form: HTMLFormElement): void {
  const controles = [...form.querySelectorAll<Control>('[data-etiqueta]')];
  const estado = form.querySelector<HTMLElement>('[data-estado]');
  const boton = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const exito = document.getElementById(form.dataset.exito ?? '');
  const honeypot = form.querySelector<HTMLInputElement>('[data-honeypot]');
  let intentado = false;

  // Con JS tomamos el control de la validación para dar mensajes propios.
  form.noValidate = true;

  const anunciar = (texto: string, tono: 'error' | 'info' = 'info') => {
    if (!estado) return;
    estado.textContent = texto;
    estado.dataset.tono = tono;
  };

  // Tras el primer intento, los errores se actualizan mientras se corrige.
  for (const control of controles) {
    const revalidar = () => intentado && mostrarError(control, validar(control));
    control.addEventListener(control.type === 'checkbox' ? 'change' : 'input', revalidar);
    control.addEventListener('blur', revalidar);
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;
    intentado = true;

    const errores = controles.filter((c) => {
      const mensaje = validar(c);
      mostrarError(c, mensaje);
      return mensaje !== null;
    });

    if (errores.length) {
      anunciar(
        errores.length === 1 ? 'Revisa el campo marcado.' : `Revisa los ${errores.length} campos marcados.`,
        'error',
      );
      errores[0]?.focus();
      return;
    }

    form.setAttribute('aria-busy', 'true');
    if (boton) boton.disabled = true;
    anunciar('Enviando…');

    // Honeypot relleno: casi seguro un bot. Fingimos éxito y no enviamos nada.
    const resultado = honeypot?.value ? { ok: true as const } : await enviarLead(form.action, new FormData(form));

    form.removeAttribute('aria-busy');
    if (boton) boton.disabled = false;

    if (resultado.ok) {
      anunciar('');
      form.reset();
      intentado = false;
      form.hidden = true;
      if (exito) {
        exito.hidden = false;
        exito.focus();
      }
      return;
    }

    anunciar(
      resultado.motivo === 'timeout'
        ? 'El envío está tardando demasiado. Comprueba tu conexión y vuelve a intentarlo.'
        : 'No hemos podido enviar el mensaje. Comprueba tu conexión y vuelve a intentarlo, o escríbenos por correo.',
      'error',
    );
  });

  // «Enviar otro mensaje» desde el panel de éxito.
  exito?.querySelector('[data-otro]')?.addEventListener('click', () => {
    exito.hidden = true;
    form.hidden = false;
    controles[0]?.focus();
  });
}

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-formulario-contacto]')) iniciar(form);
