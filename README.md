# Somos Pedazo · Web corporativa

Astro 7 + TypeScript (estricto), CSS nativo. Sin JavaScript de framework. Todas las páginas se generan estáticas; solo `/api/contact` se ejecuta en servidor (función de Vercel, adaptador `@astrojs/vercel`).

```bash
cp .env.example .env   # y rellénalo con las claves de prueba que indica
npm install
npm run dev            # http://localhost:4321 (páginas y /api/contact)
npm run build          # astro check + build en .vercel/output
```

`astro preview` no funciona con el adaptador de Vercel. Para probar el build completo, usa `npm run dev` o `vercel dev`.

**Despliegue en Vercel:** importa el repositorio. El adaptador genera la salida para Vercel: quita la barra final de las URL (`/servicios/` → `/servicios`, 308) y cachea `/_astro/*` durante un año. No hace falta `vercel.json`.

**Variables de entorno en Vercel:**

| Variable | Tipo | Uso |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | Secret, obligatoria | Clave secreta de Turnstile, solo en servidor |
| `PUBLIC_TURNSTILE_SITE_KEY` | Opcional | Site key pública. Si falta, se usa la del código (`src/config/zoho.ts`) |

En el build, Astro inserta `TURNSTILE_SECRET_KEY` en el código de la función de servidor (nunca en el del navegador). Si cambias la clave en Vercel, vuelve a desplegar.

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

El sitemap (`/sitemap-index.xml`) lo genera `@astrojs/sitemap` y excluye las páginas `noindex` (solo la 404). Si añades otra página `noindex`, inclúyela también en `NOINDEX` dentro de `astro.config.mjs`.

## Activos y datos pendientes

Para localizar todos los huecos, busca `PLACEHOLDER` y `TODO` en el proyecto.

1. **Logo.** Sustituye el marcado de `src/components/brand/Logo.astro` por el SVG final. Después borra `src/pages/logo.png.ts`, `apple-touch-icon.png.ts` e `icono-[tamano].png.ts` y deja en `public/` los archivos `logo.png` (512×512), `apple-touch-icon.png` (180×180), `icono-192.png` e `icono-512.png`. Sustituye también `public/favicon.svg`.
2. **Mascota o ilustraciones.** Están en `<Placeholder nombre="…">` (atributo `data-placeholder`). Las instrucciones para cambiarlas por `<Image>` de `astro:assets` están en el propio componente. En `npm run dev` cada hueco muestra una etiqueta.
3. **Datos de empresa** (`src/config/site.ts`): dominio, razón social, **NIF**, **datos registrales**, **domicilio social**, correo, redes y Twitter/X. Si cambia el dominio, actualízalo también en `astro.config.mjs`.
   - Contacto y el pie no muestran correo, teléfono ni dirección. Los textos legales sí los necesitan (LSSI y RGPD), igual que los datos estructurados.
   - El build avisa (`[legal]`) mientras falten el NIF o los datos registrales, o siga la dirección de ejemplo. **No publiques con esos avisos.**
   - El teléfono es opcional: si lo rellenas, solo se añade a los datos estructurados.
4. **Textos legales** (aviso legal, privacidad y cookies): son textos completos, basados en la LSSI-CE, el RGPD, la LOPDGDD y la guía de cookies de la AEPD, y redactados según cómo funciona el sitio: formulario → Zoho CRM, alojamiento en Vercel y antispam con Cloudflare Turnstile. Si añades herramientas (por ejemplo, analítica), actualiza la política de cookies y la de privacidad.
5. **Tipografías.** Avenir y Calibri se usan si están instaladas en el dispositivo. Si no lo están, entran Figtree (titulares) y Carlito (texto, con las mismas métricas que Calibri), ambas alojadas en el propio sitio. Si compráis una licencia web de Avenir, cambia los archivos en `src/components/brand/Fonts.astro`.

## Formulario de contacto

Navegador → `/api/contact` (función de Vercel) → Zoho CRM (Web-to-Lead). Con captcha de Cloudflare Turnstile. El HTML y el CSS son propios; de Zoho solo se usan el endpoint y los nombres de campo.

**Navegador**
- **Marcado:** `src/components/ui/FormularioContacto.astro`. **Lógica:** `src/scripts/formulario/` (`validacion.ts`, `turnstile.ts`, `envio.ts` e `index.ts`).
- **Turnstile:** el script de Cloudflare solo se carga en `/contacto`. El widget se renderiza de forma explícita justo encima del botón, y el botón está deshabilitado hasta tener token. Los tokens son de un solo uso, así que el widget se reinicia tras cada envío. El modo (Managed) se configura en el panel de Cloudflare.
- **Envío:** valida en cliente con mensajes en castellano, envía por `fetch` y muestra el mensaje de éxito o el error sin salir de la web.
- **Sin JS:** no hay captcha, así que no se puede enviar el formulario; se muestra el correo como alternativa.
- **Privacidad:** la casilla es obligatoria, pero no se envía (no lleva `name`).

**Servidor (`src/pages/api/contact.ts`)**
1. Si el honeypot `aG9uZXlwb3Q` llega relleno, responde 200 y no envía nada.
2. Verifica el token con Cloudflare (`siteverify`, con la IP de `x-forwarded-for`). Si falla, responde 400.
3. Valida los campos obligatorios, el formato del correo y la longitud de cada campo. Si algo falla, responde 400 con la lista de campos.
4. Reenvía a Zoho como `application/x-www-form-urlencoded`, añadiendo los campos ocultos (`src/server/zoho.ts`). Cualquier respuesta 2xx o 3xx cuenta como éxito; si no, responde 502.

Respuestas: `{ ok: true }` o `{ ok: false, error }`, con `error` igual a `captcha`, `validacion`, `zoho` o `servidor`.

**Archivos de configuración**
- `src/config/zoho.ts`: nombres de campo, longitudes, honeypot y site key. Se comparte entre navegador y servidor.
- `src/server/`: campos ocultos de Zoho y verificación de Turnstile. Solo los usa el servidor.

**Pruebas en local**
- `.env` usa las claves de prueba de Cloudflare, que siempre aprueban la verificación.
- Con `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA` puedes probar el rechazo del captcha.
- Para no crear leads reales en Zoho, apunta `ZOHO_WEB_TO_LEAD_URL` a un servidor local.

## Marca y accesibilidad

- El texto siempre es navy sobre fondos claros (crema, blanco, sol, chicle, mandarina o amarillo), o crema sobre navy. Nunca uses texto claro sobre sol, mandarina o amarillo, porque no pasa el contraste.
- En las páginas y componentes hay un solo `h1` por página y la jerarquía de encabezados no se salta niveles.
- La animación se reduce cuando el usuario tiene activado `prefers-reduced-motion`. El foco es visible en todos los elementos y los objetivos táctiles miden al menos 44 px.
