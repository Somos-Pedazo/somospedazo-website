/**
 * Selector de país del teléfono (src/components/ui/CampoTelefono.astro).
 *
 * Sustituye el <select> nativo por un botón con bandera y prefijo que abre un panel con buscador
 * (combobox) y lista de países (listbox). El <select>, oculto, sigue siendo el que se envía y el que
 * lleva las reglas de validación de cada país en sus <option>.
 * - El HTML solo trae el país por defecto: la lista completa (/telefono/paises.json) se pide en
 *   segundo plano cuando la página ha terminado de cargar, o antes si se toca el campo.
 * - Teclado: ↑/↓ y RePág/AvPág recorren la lista, Intro elige, Esc cierra y devuelve el foco al botón.
 * - Si se escribe el número con prefijo («+44…», «0044…»), se elige su país automáticamente.
 */
import { prefijoEscrito } from '../../utils/telefono';

type Pais = { iso: string; nombre: string; prefijo: string; principal: boolean; busqueda: string };
type EntradaJson = { iso: string; datos: Record<string, string> };

/** Minúsculas y sin tildes: «Japón» encaja con «japon». */
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const aPais = (opcion: HTMLOptionElement): Pais => {
  const { nombre = opcion.value, prefijo = '' } = opcion.dataset;
  return { iso: opcion.value, nombre, prefijo, principal: opcion.hasAttribute('data-principal'), busqueda: normalizar(`${nombre} ${opcion.value}`) };
};

export function iniciarTelefono(raiz: HTMLElement): void {
  const select = raiz.querySelector<HTMLSelectElement>('[data-telefono-select]');
  const boton = raiz.querySelector<HTMLButtonElement>('[data-telefono-boton]');
  const panel = raiz.querySelector<HTMLElement>('[data-telefono-panel]');
  const buscar = raiz.querySelector<HTMLInputElement>('[data-telefono-buscar]');
  const lista = raiz.querySelector<HTMLUListElement>('[data-telefono-lista]');
  const vacio = raiz.querySelector<HTMLElement>('[data-telefono-vacio]');
  const numero = raiz.querySelector<HTMLInputElement>('[data-telefono-numero]');
  const contenedor = raiz.querySelector<HTMLElement>('[data-telefono-pais]');
  if (!select || !boton || !panel || !buscar || !lista || !vacio || !numero || !contenedor) return;

  let paises: Pais[] = [...select.options].map(aPais);
  let porIso = new Map(paises.map((p) => [p.iso, p]));
  const items = new Map<string, HTMLLIElement>();
  let visibles: Pais[] = paises;
  let activo: string | null = null;
  let carga: Promise<boolean> | null = null;

  const actual = () => porIso.get(select.value) ?? paises[0]!;

  /** Añade al <select> los países del JSON, con sus reglas en atributos data-*. */
  const poblar = (entradas: EntradaJson[]) => {
    const defecto = select.options[0]?.value;
    const elegido = select.value;
    const fragmento = document.createDocumentFragment();
    for (const { iso, datos } of entradas) {
      const opcion = new Option(`${datos['data-nombre']} (+${datos['data-prefijo']})`, iso, iso === defecto, iso === elegido);
      for (const [atributo, valor] of Object.entries(datos)) opcion.setAttribute(atributo, valor);
      fragmento.append(opcion);
    }
    select.replaceChildren(fragmento);
    select.value = elegido;
    paises = [...select.options].map(aPais);
    porIso = new Map(paises.map((p) => [p.iso, p]));
    lista.replaceChildren();
    items.clear();
  };

  /** Pide la lista una sola vez; si falla, se puede reintentar (se queda el país por defecto). */
  const cargarPaises = () =>
    (carga ??= fetch(select.dataset.paises ?? '', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? (r.json() as Promise<EntradaJson[]>) : Promise.reject(new Error(String(r.status)))))
      .then((entradas) => {
        poblar(entradas);
        return true;
      })
      .catch(() => {
        carga = null;
        return false;
      }));

  /** La lista visual se construye la primera vez que se abre: no pesa en la carga de la página. */
  const construirLista = () => {
    if (items.size) return;
    const fragmento = document.createDocumentFragment();
    for (const p of paises) {
      const li = document.createElement('li');
      li.id = `telefono-op-${p.iso}`;
      li.setAttribute('role', 'option');
      li.dataset.iso = p.iso;
      const img = Object.assign(document.createElement('img'), {
        src: `/banderas/${p.iso}.svg`,
        alt: '',
        width: 24,
        height: 16,
        loading: 'lazy',
        decoding: 'async',
      });
      const nombre = Object.assign(document.createElement('span'), { textContent: p.nombre });
      const codigo = Object.assign(document.createElement('span'), { className: 'telefono__codigo', textContent: `+${p.prefijo}` });
      li.append(img, nombre, codigo);
      items.set(p.iso, li);
      fragmento.append(li);
    }
    lista.append(fragmento);
  };

  const marcarActivo = (iso: string | null) => {
    if (activo) items.get(activo)?.removeAttribute('data-activo');
    activo = iso;
    const li = iso ? items.get(iso) : undefined;
    if (li) {
      li.setAttribute('data-activo', '');
      buscar.setAttribute('aria-activedescendant', li.id);
      li.scrollIntoView({ block: 'nearest' });
    } else {
      buscar.removeAttribute('aria-activedescendant');
    }
  };

  /** Filtra por nombre, código ISO o prefijo («+34», «34»). */
  const filtrar = (consulta: string) => {
    const q = normalizar(consulta);
    const digitos = /^\+?\d+$/.test(q) ? q.replace('+', '') : null;
    visibles = paises.filter((p) => !q || (digitos !== null ? p.prefijo.startsWith(digitos) : p.busqueda.includes(q)));
    const enVista = new Set(visibles.map((p) => p.iso));
    for (const [iso, li] of items) li.hidden = !enVista.has(iso);
    vacio.textContent = visibles.length ? '' : 'No hay ningún país con ese nombre o prefijo.';
    marcarActivo(q ? (visibles[0]?.iso ?? null) : actual().iso);
  };

  /** Refleja el país elegido en el botón, en la lista y en el ejemplo del campo. */
  const pintar = () => {
    const p = actual();
    boton.querySelector<HTMLImageElement>('[data-telefono-bandera]')!.src = `/banderas/${p.iso}.svg`;
    boton.querySelector('[data-telefono-prefijo]')!.textContent = `+${p.prefijo}`;
    // El nombre accesible empieza por el texto visible («+34»), para quien maneja la web por voz.
    boton.setAttribute('aria-label', `+${p.prefijo} ${p.nombre}: cambiar el país del teléfono`);
    numero.placeholder = select.selectedOptions[0]?.dataset.ejemplo ?? '';
    for (const [iso, li] of items) li.setAttribute('aria-selected', String(iso === p.iso));
  };

  const elegir = (iso: string) => {
    if (!porIso.has(iso) || iso === select.value) return;
    select.value = iso;
    pintar();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const abierto = () => !panel.hidden;

  const abrir = async () => {
    panel.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    buscar.value = '';
    buscar.focus();
    if (!(await cargarPaises())) vacio.textContent = 'No se ha podido cargar la lista de países. Inténtalo de nuevo.';
    if (!abierto()) return; // se cerró mientras cargaba
    construirLista();
    pintar();
    filtrar(buscar.value);
  };

  const cerrar = (devolverFoco: boolean) => {
    if (!abierto()) return;
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    marcarActivo(null);
    if (devolverFoco) boton.focus();
  };

  const mover = (paso: number) => {
    if (!visibles.length) return;
    const i = visibles.findIndex((p) => p.iso === activo);
    const siguiente = Math.min(Math.max(i === -1 ? 0 : i + paso, 0), visibles.length - 1);
    marcarActivo(visibles[siguiente]!.iso);
  };

  /** Número escrito con prefijo de otro país → se elige ese país (el principal de su prefijo). */
  const paisPorPrefijo = async () => {
    const escrito = prefijoEscrito(numero.value);
    if (!escrito || escrito.startsWith(actual().prefijo)) return;
    await cargarPaises();
    const pais = paises.find((p) => p.principal && escrito.startsWith(p.prefijo));
    if (pais) elegir(pais.iso);
  };

  boton.addEventListener('click', () => (abierto() ? cerrar(true) : void abrir()));
  boton.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      void abrir();
    }
  });

  buscar.addEventListener('input', () => filtrar(buscar.value));
  buscar.addEventListener('keydown', (e) => {
    const pasos: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 };
    if (e.key in pasos) {
      e.preventDefault();
      mover(pasos[e.key]!);
    } else if (e.key === 'Enter') {
      e.preventDefault(); // nunca envía el formulario
      if (activo) elegir(activo);
      cerrar(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cerrar(true);
    }
  });

  // pointerdown + preventDefault: el foco se queda en el buscador mientras se elige con el ratón.
  lista.addEventListener('pointerdown', (e) => e.preventDefault());
  lista.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('[role="option"]');
    if (!li?.dataset.iso) return;
    elegir(li.dataset.iso);
    cerrar(true);
  });

  // Se cierra al salir con Tab o al pulsar fuera.
  contenedor.addEventListener('focusout', (e) => {
    if (!contenedor.contains(e.relatedTarget as Node | null)) cerrar(false);
  });
  document.addEventListener('pointerdown', (e) => {
    if (abierto() && !contenedor.contains(e.target as Node)) cerrar(false);
  });

  numero.addEventListener('input', () => void paisPorPrefijo());

  // form.reset() devuelve el <select> a su opción por defecto: actualizar el botón.
  select.form?.addEventListener('reset', () => setTimeout(pintar));

  // Lista completa: en cuanto se toca el campo o, si no, cuando el navegador esté libre tras la carga.
  raiz.addEventListener('focusin', () => void cargarPaises(), { once: true });
  boton.addEventListener('pointerenter', () => void cargarPaises(), { once: true });
  const enReposo = () => ('requestIdleCallback' in window ? requestIdleCallback(() => void cargarPaises()) : setTimeout(() => void cargarPaises(), 2000));
  if (document.readyState === 'complete') enReposo();
  else window.addEventListener('load', enReposo, { once: true });

  // Activar el desplegable con banderas.
  select.hidden = true;
  select.tabIndex = -1;
  boton.hidden = false;
  pintar();
}
