/**
 * Widget de Cloudflare Turnstile con renderizado explícito.
 * El script de Cloudflare se carga con async/defer en FormularioContacto.astro y,
 * al terminar, llama a window.onTurnstileListo (definida en línea antes del script),
 * que marca window.__turnstileListo y emite el evento «turnstile:listo».
 * El modo (Managed) se configura en el panel de Cloudflare, asociado a la site key.
 */
type OpcionesRender = {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  size?: 'normal' | 'flexible' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
  'response-field-name'?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (codigo: string) => boolean | void;
  'timeout-callback'?: () => void;
};

type Turnstile = {
  render: (contenedor: HTMLElement, opciones: OpcionesRender) => string | undefined;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
    __turnstileListo?: boolean;
    onTurnstileListo?: () => void;
  }
}

export type Captcha = { reset: () => void };

export function iniciarTurnstile(
  contenedor: HTMLElement,
  campo: string,
  eventos: { onToken: (token: string) => void; onSinToken: (motivo: 'caducado' | 'error') => void },
): Captcha {
  let widgetId: string | undefined;

  const render = () => {
    if (!window.turnstile || widgetId !== undefined) return;
    widgetId = window.turnstile.render(contenedor, {
      sitekey: contenedor.dataset.sitekey ?? '',
      theme: 'light',
      language: 'es',
      // «flexible» ocupa el ancho del formulario (mín. 300 px); en pantallas muy estrechas, compacto.
      size: contenedor.clientWidth < 300 ? 'compact' : 'flexible',
      appearance: 'always',
      'response-field-name': campo,
      callback: eventos.onToken,
      'expired-callback': () => eventos.onSinToken('caducado'),
      'timeout-callback': () => eventos.onSinToken('caducado'),
      'error-callback': () => {
        eventos.onSinToken('error');
        return true; // gestionado: Cloudflare no lanza la excepción a la consola
      },
    });
  };

  if (window.__turnstileListo) render();
  else document.addEventListener('turnstile:listo', render, { once: true });

  return {
    reset: () => {
      if (window.turnstile && widgetId !== undefined) window.turnstile.reset(widgetId);
    },
  };
}
