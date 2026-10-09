/**
 * Controlador del formulario de contacto: valida, comprueba el captcha (Turnstile),
 * envía a /api/contact y muestra el resultado sin salir de la web.
 * El botón de envío solo se activa cuando Turnstile ha emitido un token.
 */
import { CAMPO_TURNSTILE } from '../../config/zoho';
import { enviarLead, type MotivoError } from './envio';
import { iniciarTurnstile } from './turnstile';
import { mostrarError, validar, type Control } from './validacion';

const MENSAJES_ERROR: Record<MotivoError, string> = {
  captcha: 'No hemos podido comprobar que eres una persona. Completa de nuevo la verificación y vuelve a enviar.',
  validacion: 'Hay datos que no hemos podido validar. Revisa los campos marcados y vuelve a enviar.',
  zoho: 'No hemos podido registrar tu mensaje. Inténtalo de nuevo en unos minutos.',
  servidor: 'Algo ha fallado de nuestro lado. Inténtalo de nuevo en unos minutos.',
  red: 'No hemos podido enviar el mensaje. Comprueba tu conexión y vuelve a intentarlo.',
  timeout: 'El envío está tardando demasiado. Comprueba tu conexión y vuelve a intentarlo.',
};

const AYUDA_CAPTCHA = {
  pendiente: 'El botón se activará cuando se complete la verificación de seguridad.',
  caducado: 'La verificación de seguridad ha caducado. Complétala de nuevo para activar el botón.',
  error: 'No se ha podido cargar la verificación de seguridad. Recarga la página e inténtalo de nuevo.',
};

function iniciar(form: HTMLFormElement): void {
  const controles = [...form.querySelectorAll<Control>('[data-etiqueta]')];
  const estado = form.querySelector<HTMLElement>('[data-estado]');
  const boton = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const exito = document.getElementById(form.dataset.exito ?? '');
  const contenedorCaptcha = form.querySelector<HTMLElement>('[data-turnstile]');
  const ayudaCaptcha = form.querySelector<HTMLElement>('[data-turnstile-ayuda]');
  let intentado = false;
  let token = '';
  let enviando = false;

  form.noValidate = true;

  const anunciar = (texto: string, tono: 'error' | 'info' = 'info') => {
    if (!estado) return;
    estado.textContent = texto;
    estado.dataset.tono = tono;
  };

  /** El botón solo está activo con token válido y sin envío en curso. */
  const actualizarBoton = () => {
    if (boton) boton.disabled = !token || enviando;
    if (ayudaCaptcha) ayudaCaptcha.hidden = Boolean(token);
  };

  const captcha = contenedorCaptcha
    ? iniciarTurnstile(contenedorCaptcha, CAMPO_TURNSTILE, {
        onToken: (t) => {
          token = t;
          actualizarBoton();
        },
        onSinToken: (motivo) => {
          token = '';
          if (ayudaCaptcha) ayudaCaptcha.textContent = AYUDA_CAPTCHA[motivo];
          actualizarBoton();
        },
      })
    : null;

  /** Los tokens de Turnstile son de un solo uso: tras cada envío hay que pedir otro. */
  const reiniciarCaptcha = () => {
    token = '';
    if (ayudaCaptcha) ayudaCaptcha.textContent = AYUDA_CAPTCHA.pendiente;
    actualizarBoton();
    captcha?.reset();
  };

  // Tras el primer intento, los errores se actualizan mientras se corrige.
  for (const control of controles) {
    const revalidar = () => intentado && mostrarError(control, validar(control));
    control.addEventListener(control.type === 'checkbox' ? 'change' : 'input', revalidar);
    control.addEventListener('blur', revalidar);
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando || !token) return;
    intentado = true;

    const errores = controles.filter((c) => {
      const mensaje = validar(c);
      mostrarError(c, mensaje);
      return mensaje !== null;
    });

    if (errores.length) {
      anunciar(errores.length === 1 ? 'Revisa el campo marcado.' : `Revisa los ${errores.length} campos marcados.`, 'error');
      errores[0]?.focus();
      return;
    }

    enviando = true;
    form.setAttribute('aria-busy', 'true');
    actualizarBoton();
    anunciar('Enviando…');

    const resultado = await enviarLead(form.action, new FormData(form));

    enviando = false;
    form.removeAttribute('aria-busy');
    reiniciarCaptcha();

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

    // Errores de validación detectados en el servidor: marcar esos campos.
    const invalidos = resultado.motivo === 'validacion' ? (resultado.campos ?? []) : [];
    if (invalidos.length) {
      const marcados = controles.filter((c) => c.name && invalidos.includes(c.name));
      for (const c of marcados) mostrarError(c, validar(c) ?? 'Revisa este campo.');
      marcados[0]?.focus();
    }

    anunciar(MENSAJES_ERROR[resultado.motivo], 'error');
  });

  // «Enviar otro mensaje» desde el panel de éxito.
  exito?.querySelector('[data-otro]')?.addEventListener('click', () => {
    exito.hidden = true;
    form.hidden = false;
    controles[0]?.focus();
  });

  actualizarBoton();
}

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-formulario-contacto]')) iniciar(form);
