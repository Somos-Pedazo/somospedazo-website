import type { APIRoute, GetStaticPaths } from 'astro';
import { PAGINAS, type Pagina } from '../../data/paginas';
import { imagenOg } from '../../utils/imagenes';

/** Una imagen Open Graph (1200×630) por página, generada en build. */
export const getStaticPaths = (() =>
  Object.values(PAGINAS).map((pagina) => ({ params: { slug: pagina.slug }, props: { pagina } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ pagina: Pagina }> = async ({ props }) =>
  new Response(await imagenOg(props.pagina.ogTitulo), { headers: { 'Content-Type': 'image/png' } });
