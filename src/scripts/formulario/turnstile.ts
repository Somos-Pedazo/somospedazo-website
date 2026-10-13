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

/** Ancho mínimo del widget en tamaño «flexible», según Cloudflare. */
const ANCHO_MINIMO = 300;

export function iniciarTurnstile(
  contenedor: HTMLElement,
  campo: string,
  eventos: { onToken: (token: string) => void; onSinToken: (motivo: 'caducado' | 'error') => void },
): Captcha {
  let widgetId: string | undefined;

  /**
   * El tamaño «flexible» ocupa todo el ancho, pero Cloudflare no lo baja de 300 px. Si el hueco es
   * más estrecho (móviles pequeños), se escala con transform para que encaje justo en el ancho, en
   * lugar de pasar al modo compacto (cuadrado). Se recalcula si cambia el ancho.
   */
  const ajustarAncho = () => {
    const widget = contenedor.firstElementChild as HTMLElement | null;
    if (!widget) return;
    const escala = Math.min(1, contenedor.clientWidth / ANCHO_MINIMO);
    widget.style.transformOrigin = '0 0';
    widget.style.transform = escala < 1 ? `scale(${escala.toFixed(4)})` : '';
  };
  new ResizeObserver(ajustarAncho).observe(contenedor);
  new MutationObserver(ajustarAncho).observe(contenedor, { childList: true });

  const render = () => {
    if (!window.turnstile || widgetId !== undefined) return;
    widgetId = window.turnstile.render(contenedor, {
      sitekey: contenedor.dataset.sitekey ?? '',
      theme: 'light',
      language: 'es',
      // Siempre a todo el ancho del formulario (nunca el modo compacto, que es cuadrado).
      size: 'flexible',
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
