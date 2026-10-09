/**
 * Generación de imágenes de marca en build (Open Graph, logo e icono).
 * El texto se convierte a trazados con opentype.js para no depender de las
 * fuentes instaladas en el servidor de build (Vercel). sharp rasteriza a PNG.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { BRAND_COLORS as C } from '../data/brand';
import { HERO } from '../data/composiciones';
import { SITE } from '../config/site';
import { U, piezasARects, rectsASvg } from './pedazos';

type Fuente = ReturnType<typeof opentype.parse>;

const requerir = createRequire(join(process.cwd(), 'package.json'));
const cache = new Map<number, Fuente>();

/** Figtree estática (alternativa libre a Avenir) en el peso pedido. */
function fuente(peso: 600 | 800 | 900): Fuente {
  let f = cache.get(peso);
  if (!f) {
    const buf = readFileSync(requerir.resolve(`@fontsource/figtree/files/figtree-latin-${peso}-normal.woff`));
    f = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    cache.set(peso, f);
  }
  return f;
}

const n = (v: number) => Math.round(v * 10) / 10;

function texto(t: string, x: number, y: number, size: number, peso: 600 | 800 | 900, fill: string): string {
  // Serialización propia: toPathData() de opentype.js 2.0 genera NaN en algunas curvas.
  const d = fuente(peso)
    .getPath(t, x, y, size)
    .commands.map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${n(c.x)} ${n(c.y)}`;
        case 'Q':
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case 'C':
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        default:
          return 'Z';
      }
    })
    .join('');
  return `<path d="${d}" fill="${fill}"/>`;
}

function ancho(t: string, size: number, peso: 600 | 800 | 900): number {
  return fuente(peso).getAdvanceWidth(t, size);
}

/** Parte un texto en líneas que caben en `max` píxeles. */
function lineas(t: string, size: number, peso: 600 | 800 | 900, max: number): string[] {
  const out: string[] = [];
  let actual = '';
  for (const palabra of t.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && ancho(prueba, size, peso) > max) {
      out.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) out.push(actual);
  return out;
}

/** Símbolo provisional del logo: dos pedazos (PLACEHOLDER LOGO). */
function simbolo(x: number, y: number, alto: number): string {
  const s = alto / 22;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="0" y="0" width="26" height="22" rx="11" fill="${C.sol}"/><rect x="28" y="0" width="10" height="22" rx="5" fill="${C.mandarina}"/></g>`;
}

async function png(svg: string): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Uint8Array(buf);
}

/** Imagen Open Graph 1200×630 con el título de la página. */
export async function imagenOg(titulo: string): Promise<Uint8Array<ArrayBuffer>> {
  const W = 1200;
  const H = 630;
  const M = 72;
  const maxTexto = 600;

  let size = 68;
  let ls = lineas(titulo, size, 900, maxTexto);
  while (ls.length > 4 && size > 44) {
    size -= 4;
    ls = lineas(titulo, size, 900, maxTexto);
  }
  const lh = size * 1.12;
  const bloque = ls.length * lh;
  const y0 = (H - bloque) / 2 + size * 0.8;
  const tituloSvg = ls.map((l, i) => texto(l, M, y0 + i * lh, size, 900, C.navy)).join('');

  const lado = 430;
  const escala = lado / (HERO.columnas * U);
  const arte = `<g transform="translate(${W - M - lado} ${(H - lado) / 2}) scale(${escala})">${rectsASvg(piezasARects(HERO.piezas))}</g>`;

  const dominio = new URL(SITE.url).host;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.crema}"/>
${simbolo(M, M - 4, 34)}${texto(SITE.name, M + 74, M + 26, 34, 900, C.navy)}
${tituloSvg}
${texto(dominio, M, H - M + 8, 26, 600, C.navy)}
${arte}
</svg>`;
  return png(svg);
}

/** Logo cuadrado (512×512) para schema.org. PLACEHOLDER LOGO. */
export async function imagenLogo(): Promise<Uint8Array<ArrayBuffer>> {
  const S = 512;
  const size = 104;
  const l1 = 'Somos';
  const l2 = 'Pedazo';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${C.crema}"/>
${simbolo((S - 38 * 4) / 2, 88, 88)}
${texto(l1, (S - ancho(l1, size, 900)) / 2, 318, size, 900, C.navy)}
${texto(l2, (S - ancho(l2, size, 900)) / 2, 428, size, 900, C.navy)}
</svg>`;
  return png(svg);
}

/** Icono para dispositivos (apple-touch-icon y manifest). PLACEHOLDER LOGO. */
export async function imagenIcono(S: number): Promise<Uint8Array<ArrayBuffer>> {
  const alto = S * 0.36;
  const anchoSimbolo = (alto / 22) * 38;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${C.navy}"/>
${simbolo((S - anchoSimbolo) / 2, (S - alto) / 2, alto)}
</svg>`;
  return png(svg);
}
