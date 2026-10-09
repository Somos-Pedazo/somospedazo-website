# Somos Pedazo · Web corporativa

Astro 7 + TypeScript (estricto), CSS nativo, salida estática. Sin JavaScript de framework.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + build en dist/
npm run preview
```

**Despliegue en Vercel:** importa el repositorio. Vercel detecta Astro y no hace falta ajustar nada.
`vercel.json` solo quita la barra final de las URL (`/servicios/` → `/servicios`) y cachea `/_astro/*` durante un año.

## Estructura

| Ruta | Qué contiene |
| --- | --- |
| `src/config/site.ts` | **Fuente única** de datos de empresa: nombre, dominio, correo, teléfono, dirección, redes y lema |
| `src/data/paginas.ts` | Title, description y título OG de cada página |
| `src/data/servicios.ts` | Los tres escalones y las preguntas frecuentes |
| `src/data/composiciones.ts` | Composiciones de «pedazos» (portada, franja, trío) |
| `src/styles/tokens.css` | Colores, tipografías, espaciado y radios de marca |
| `src/components/brand/` | Logo (provisional), Pedazos, Placeholder y Fonts |
| `src/components/seo/SEO.astro` | Meta, canonical, Open Graph y Twitter |
| `src/utils/schema.ts` | JSON-LD: Organization, ProfessionalService (LocalBusiness), WebSite, WebPage y BreadcrumbList |
| `src/utils/imagenes.ts` | Imágenes OG, logo e iconos PNG generados en el build |
| `src/pages/` | Páginas, `robots.txt`, `site.webmanifest` e imágenes |

El sitemap (`/sitemap-index.xml`) lo genera `@astrojs/sitemap` y excluye las páginas `noindex` (legales y 404). Si añades otra página `noindex`, inclúyela también en `NOINDEX` dentro de `astro.config.mjs`.

## Activos y datos pendientes

Para localizar todos los huecos, busca `PLACEHOLDER` y `TODO` en el proyecto.

1. **Logo.** Sustituye el marcado de `src/components/brand/Logo.astro` por el SVG final. Después borra `src/pages/logo.png.ts`, `apple-touch-icon.png.ts` e `icono-[tamano].png.ts` y deja en `public/` los archivos `logo.png` (512×512), `apple-touch-icon.png` (180×180), `icono-192.png` e `icono-512.png`. Sustituye también `public/favicon.svg`.
2. **Mascota o ilustraciones.** Están en `<Placeholder nombre="…">` (atributo `data-placeholder`). Las instrucciones para cambiarlas por `<Image>` de `astro:assets` están en el propio componente. En `npm run dev` cada hueco muestra una etiqueta.
3. **Datos de empresa** (`src/config/site.ts`): dominio, razón social, teléfono, dirección, redes y Twitter/X. Si cambia el dominio, actualízalo también en `astro.config.mjs`. **No publiques con la dirección y el teléfono de ejemplo**: aparecen en el pie, en Contacto y en el JSON-LD.
4. **Antispam del formulario (fase 2).** El formulario ya está conectado a Zoho CRM; falta añadir Turnstile. Ver la sección «Formulario de contacto».
5. **Textos legales** (aviso legal, privacidad y cookies): son plantillas marcadas como provisionales y llevan `noindex`. Cuando tengas el texto definitivo, quita `noindex: true` en `src/data/paginas.ts` y saca la ruta de `NOINDEX` si quieres indexarlas.
6. **Tipografías.** Avenir y Calibri se usan si están instaladas en el dispositivo. Si no lo están, entran Figtree (titulares) y Carlito (texto, con las mismas métricas que Calibri), ambas alojadas en el propio sitio. Si compráis una licencia web de Avenir, cambia los archivos en `src/components/brand/Fonts.astro`.

## Formulario de contacto

Conectado a Zoho CRM mediante Web-to-Lead. De Zoho solo se usan el endpoint y los nombres de campo; el HTML y el CSS son propios.

- **Configuración:** `src/config/zoho.ts` (endpoint, campos ocultos, honeypot y nombres de campo de Zoho). Estos valores no son secretos: Zoho los publica en el HTML de cualquier formulario web.
- **Marcado:** `src/components/ui/FormularioContacto.astro`. **Lógica:** `src/scripts/formulario/` (`validacion.ts`, `envio.ts` e `index.ts`).
- **Con JS:** valida en cliente con mensajes en castellano, envía a Zoho en segundo plano (`fetch` en modo `no-cors`) y muestra un mensaje de éxito sin salir de la web. **Sin JS:** hace un POST normal a Zoho con la validación del navegador.
- **Privacidad:** la casilla es obligatoria, pero no se envía a Zoho (no lleva `name`).
- **Limitación:** Zoho no permite leer su respuesta desde el navegador. Solo se detectan fallos de red, no que Zoho rechace un lead. Tras cambiar cualquier campo, haz un envío de prueba y comprueba que el lead aparece en Zoho.
- **Fase 2 (Turnstile + función de Vercel):** añade el widget en el hueco marcado `FASE 2` del formulario y cambia `enviarLead` en `envio.ts` para enviar a `/api/contacto`. La función valida el token, reenvía a Zoho desde el servidor y devuelve un estado real. La validación y la interfaz no cambian.

## Marca y accesibilidad

- El texto siempre es navy sobre fondos claros (crema, blanco, sol, chicle, mandarina o amarillo), o crema sobre navy. Nunca uses texto claro sobre sol, mandarina o amarillo, porque no pasa el contraste.
- En las páginas y componentes hay un solo `h1` por página y la jerarquía de encabezados no se salta niveles.
- La animación se reduce cuando el usuario tiene activado `prefers-reduced-motion`. El foco es visible en todos los elementos y los objetivos táctiles miden al menos 44 px.
