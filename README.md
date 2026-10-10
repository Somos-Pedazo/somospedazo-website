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

**Estadísticas (sin cookies):**
- **Vercel Web Analytics** lo inyecta el adaptador (`webAnalytics: { enabled: true }` en `astro.config.mjs`). No añadas además el componente `<Analytics />`: contaría las visitas dos veces.
- **Vercel Speed Insights** es el componente `<SpeedInsights />` de `src/layouts/BaseLayout.astro`.
- Ambos deben estar activados en el panel de Vercel. Fuera de Vercel (en local), sus scripts devuelven 404, y es normal.
- Están recogidos en la política de cookies y en la de privacidad. Si cambias de herramienta, actualiza ambas.

**Consentimiento de cookies (Cookiebot):**
- `uc.js` es el **primer elemento del `<head>`** (`src/layouts/BaseLayout.astro`), en modo de bloqueo automático: bloquea los scripts que instalan cookies hasta que hay consentimiento. No pongas nada delante.
- La configuración está en `src/config/cookiebot.ts`. `data-culture="ES"` fuerza el castellano, pero el idioma tiene que estar activado en el panel de Cookiebot.
- **Google Analytics** (cuando se añada) no se exceptúa del bloqueo: debe gestionarlo Cookiebot.
- Solo Turnstile lleva `data-cookieconsent="ignore"`, porque es estrictamente necesario para enviar el formulario.
- La declaración de cookies (`cd.js`) está en `/cookies`, apartado 4, y se actualiza sola con los escaneos de Cookiebot.
- El enlace «Configuración de cookies» del pie reabre el banner con `Cookiebot.renew()`. Si Cookiebot no carga, lleva a `/cookies`.
- Cookiebot solo funciona en los dominios autorizados en su panel. En `localhost` no muestra el banner ni la declaración, y es normal.
- Rendimiento: como Cookiebot carga el primero y de forma síncrona, Lighthouse baja de 100 a unos 96 en rendimiento.

**Variables de entorno en Vercel:**

| Variable | Tipo | Uso |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | Secret, obligatoria | Clave secreta de Turnstile, solo en servidor |
| `PUBLIC_TURNSTILE_SITE_KEY` | Opcional | Site key pública. Si falta, se usa la del código (`src/config/zoho.ts`) |
| `RESEND_API_KEY` | Secret, obligatoria (Production y Preview) | Clave de Resend para el correo de confirmación del formulario, solo en servidor. El dominio `somospedazo.com` tiene que estar verificado en Resend. |

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
   - Contacto y el pie no muestran correo, teléfono ni dirección. Los textos legales muestran el correo (LSSI y RGPD).
   - De momento, el domicilio **no se publica**: ni en los textos legales ni en los datos estructurados. La LSSI lo exige en el aviso legal; para añadirlo, rellena `SITE.address` (se incluye en el JSON-LD) y muéstralo en `src/components/legal/DatosTitular.astro`.
   - El build avisa (`[legal]`) mientras falten el NIF o los datos registrales. **No publiques con esos avisos.**
   - El teléfono es opcional: si lo rellenas, solo se añade a los datos estructurados.
4. **Textos legales** (`/aviso-legal`, `/privacidad` y `/cookies`): el texto lo facilita Somos Pedazo y está copiado literalmente en `src/pages/`. Los datos del titular, la fecha de actualización (`SITE.legal.actualizado`), el fuero (`SITE.legal.jurisdiccion`) y los correos (`email` y `emailPrivacidad`) salen de `src/config/site.ts`. Si cambia un texto, edita la página correspondiente. La plantilla común es `src/layouts/LegalLayout.astro` (fondo navy y texto crema).
5. **Tipografías.** Avenir y Calibri se usan si están instaladas en el dispositivo. Si no lo están, entran Figtree (titulares) y Carlito (texto, con las mismas métricas que Calibri), ambas alojadas en el propio sitio. Si compráis una licencia web de Avenir, cambia los archivos en `src/components/brand/Fonts.astro`.

## Formulario de contacto

Navegador → `/api/contact` (función de Vercel) → Zoho CRM (Web-to-Lead). Con captcha de Cloudflare Turnstile. El HTML y el CSS son propios; de Zoho solo se usan el endpoint y los nombres de campo.

**Navegador**
- **Marcado:** `src/components/ui/FormularioContacto.astro`. **Lógica:** `src/scripts/formulario/` (`validacion.ts`, `turnstile.ts`, `envio.ts` e `index.ts`).
- **Turnstile:** el script de Cloudflare solo se carga en `/contacto`. El widget se renderiza de forma explícita justo encima del botón, y el botón está deshabilitado hasta tener token. Los tokens son de un solo uso, así que el widget se reinicia tras cada envío. El modo (Managed) se configura en el panel de Cloudflare.
- **Envío:** valida en cliente con mensajes en castellano, envía por `fetch` y muestra el mensaje de éxito o el error sin salir de la web.
- **Sin JS:** no hay captcha, así que no se puede enviar el formulario; se muestra un aviso.
- **Casillas:**
  - **Privacidad:** obligatoria, también en el servidor.
  - **Newsletter:** opcional, sin premarcar y separada de la de privacidad; no condiciona el envío.
  - El valor de ambas y su fecha y hora quedan registrados en «Description»: `privacy_consent` y `newsletter_consent`.
- **Primera capa informativa:** el texto facilitado por Somos Pedazo va encima de la verificación de Turnstile, que está justo encima del botón.

**Teléfono internacional** (`src/components/ui/CampoTelefono.astro`, `src/scripts/formulario/telefono.ts`)
- **Desplegable de país** con bandera y prefijo, buscador (por nombre sin tildes, código ISO o prefijo: «japon», «JP», «+81») y teclado completo (↑/↓, RePág/AvPág, Intro, Esc). Es un combobox + listbox de WAI-ARIA; sin JS queda un `<select>` nativo. España por defecto.
- **Datos:** los 245 países y territorios de libphonenumber-js (los metadatos de Google libphonenumber), con nombres en castellano (`Intl.DisplayNames`). Banderas de `country-flag-icons` (SVG 3:2, MIT), publicadas en build en `/banderas/XX.svg`. Las de la lista se cargan en diferido.
- **Carga diferida:** el HTML solo lleva España; la lista completa (`/telefono/paises.json`, ~7 KB con brotli) se pide en segundo plano tras cargar la página, o antes si se toca el campo.
- **Validación con expresiones regulares** (`src/utils/telefono.ts`, la misma en navegador y servidor):
  - caracteres admitidos: `^\+?[\d\s().\-]{4,30}$`;
  - número nacional contra el patrón de su país (por ejemplo, España: `(?:400|[5-9]\d\d)\d{6}`), quitando antes el prefijo nacional si lo lleva («07400 123456» en Reino Unido, «011 15…» en Argentina);
  - resultado contra E.164: `^\+[1-9]\d{6,14}$`.
- Admite el número con o sin prefijo internacional («+34 612…», «0034 612…», «612…»). Si se escribe el prefijo de otro país («+44…»), el desplegable cambia solo a ese país.
- Los errores dicen el país y ponen un ejemplo válido («no es un número válido de España. Ejemplo: 612 34 56 78.»). El ejemplo también aparece como pista en el campo.
- **A Zoho** llega solo `Phone` en **E.164** (`+34612345678`), compuesto en el servidor a partir de `telefono_pais` y `telefono_numero`. Un `Phone` enviado directamente en la petición se ignora. Si el número no es válido, responde 400 con `telefono_numero` en la lista de campos.

**Atribución de marketing** (Zoho Free: sin campos personalizados)
- **Captura** (`src/scripts/atribucion.ts`, en todas las páginas): en cada visita lee de la URL los UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) y los click IDs (`gclid`, `fbclid`, `li_fat_id`, `ttclid`, `msclkid`), junto con `landing_page`, `referrer` y `touch_ts` (fecha y hora ISO 8601 del toque).
- **Persistencia** en `localStorage` (`sp_atribucion`), 90 días desde el último toque guardado:
  - Una visita **con UTM, click IDs o referrer externo** reemplaza el registro (nuevos `touch_ts`, `landing_page`, `referrer` y parámetros) y renueva los 90 días.
  - Una visita **directa** (sin parámetros y sin referrer externo) no modifica un registro vigente. Si no hay registro, se guarda.
  - El referrer del **propio dominio** (incluidos `www` y subdominios) cuenta como directo: la navegación interna, por ejemplo de Inicio a Contacto, no falsea el origen.
  - El registro **no se borra** al enviar el formulario.
  - **Requiere consentimiento de Marketing en Cookiebot** (`PERSISTENCIA.requiereConsentimiento` en `src/config/atribucion.ts`). Si se retira el consentimiento, el registro se borra.
  - Sin consentimiento no se guarda nada, pero el formulario envía con la misma regla: la visita en curso si es un nuevo toque y, si es directa, el registro guardado o la visita en curso.
  - Los registros antiguos con `first_seen` se migran automáticamente a `touch_ts`.
  - Clasifica la clave `sp_atribucion` como «Marketing» en el panel de Cookiebot.
- **Envío:** el formulario manda esos datos y `submission_url` en campos ocultos. El servidor los vuelve a validar (`src/utils/atribucion.ts`):
  - solo se aceptan URLs http(s);
  - `touch_ts` tiene que ser una fecha ISO válida dentro de los 90 días;
  - se eliminan pipes y saltos de línea;
  - `submission_url` sale del `Referer` del propio sitio.
- **Lead Source** (campo estándar de Zoho, lista desplegable cerrada). Se calcula en el servidor a partir de la atribución persistida y siempre vale **exactamente** uno de estos valores de la lista (`LEAD_SOURCE_ZOHO` en `src/config/atribucion.ts`). Se aplica la primera regla que se cumpla:
  1. `gclid` → `Google Ads`; `fbclid` → `Facebook Ads`; `msclkid` → `Microsoft Ads`; `ttclid` → `TikTok Ads`; `li_fat_id` → `LinkedIn Ads`.
  2. Cualquier UTM → `Campaign (UTM)`. El detalle queda en `utm_source`, `utm_medium`, etc. del Description.
  3. Referrer de un buscador → `Organic`.
  4. Otro referrer externo → `Referral`.
  5. Sin referrer externo, o referrer del propio dominio → `Direct`.
  - `Manual creation` nunca se envía: está reservado a los leads creados a mano en Zoho.
  - Si cambia la lista en Zoho, actualiza `LEAD_SOURCE_ZOHO`. TypeScript impide devolver un valor que no esté en ella.
- **Email Opt Out** (casilla estándar de Zoho). Es la negación del consentimiento de newsletter:
  - Newsletter marcada → Opt Out desmarcado: se envía `Email Opt Out=false`.
  - Newsletter sin marcar → Opt Out marcado: se envía `Email Opt Out=on`, el valor que manda una casilla HTML marcada y el que usa el formulario web de Zoho. `true` no lo reconoció en las pruebas.
  - Los valores están en `EMAIL_OPT_OUT_VALOR` (`src/config/zoho.ts`).
  - En Description, `newsletter_consent` refleja lo que marcó la persona, sin invertir.
- **Formulario web de Zoho:** Web-to-Lead solo guarda los campos incluidos en el formulario web configurado en Zoho. «Lead Source» y «Email Opt Out» tienen que estar en él, y sin valor fijo por defecto; si no, Zoho ignora o sustituye lo que envía la web.
- **Description**, en dos partes separadas por una línea en blanco:
  - **Parte 1:** una línea técnica con 18 claves en orden fijo, siempre presentes, separadas por ` | `: `submission_url | landing_page | referrer | touch_ts | lead_source | utm_* | click IDs | privacy_consent | newsletter_consent | captcha_verification`.
  - **Parte 2:** `form_message=` y, en la línea siguiente, el mensaje.

**Servidor (`src/pages/api/contact.ts`)**
1. Si el honeypot `aG9uZXlwb3Q` llega relleno, responde 200 y no envía nada.
2. Verifica el token con Cloudflare **en cada envío** (`siteverify`, con la clave secreta y la IP de `x-forwarded-for`). Responde 400 (`captcha`), sin enviar nada a Zoho, si:
   - falta el token o tiene más de 2048 caracteres;
   - Cloudflare devuelve `success` distinto de `true`;
   - el `hostname` de la respuesta no es `somospedazo.com` (`HOSTNAMES_TURNSTILE` en `src/config/zoho.ts`). Fuera de producción se admiten además el dominio del propio despliegue de Vercel (Preview), `localhost` y, con claves de test, `example.com`.

   El resultado (`success`, `hostname`, `challenge_ts` y `action`) va a `captcha_verification`. Cada rechazo deja su motivo en los logs de Vercel (`[contact] Turnstile rechazado: …`).
   - **Claves de test prohibidas en producción.** Si `VERCEL_ENV=production` y la clave secreta es de test (`1x/2x/3x000…`), el endpoint responde 500 y no acepta envíos. Además, el build de producción falla si `TURNSTILE_SECRET_KEY` o la site key son de test.
3. Valida los campos obligatorios, el formato del correo, el teléfono (y lo pasa a E.164), la longitud de cada campo y la casilla de privacidad. Si algo falla, responde 400 con la lista de campos.
4. Calcula el Lead Source y compone el Description.
5. **Límite por IP:** 3 envíos cada 10 minutos. Si se supera, responde `429` (`limite`, con `Retry-After`) sin crear lead ni enviar correo. El contador está en memoria de la función: es por instancia de Vercel y se reinicia al reciclarse (`src/server/limite.ts`).
6. Reenvía a Zoho como `application/x-www-form-urlencoded`, añadiendo los campos ocultos (`src/server/zoho.ts`). Cualquier respuesta 2xx o 3xx cuenta como éxito; si no, responde 502.
7. **Correo de confirmación con Resend** (`src/server/resend.ts`), solo si Zoho ha aceptado el lead:
   - Se envía **siempre**, marque o no la newsletter: es transaccional, no comercial. No depende de `newsletter_consent` ni de Email Opt Out.
   - Remitente `Somos Pedazo <hola@somospedazo.com>`, Reply-To `hola@somospedazo.com` y asunto «Hemos recibido tu mensaje - Somos Pedazo».
   - HTML a partir de la plantilla `src/server/email/confirmacion.html`, más una versión en texto plano. Lo único variable es el nombre, escapado como HTML. El mensaje y el resto de lo que escribe el usuario **no** se incluyen, para que el formulario no sirva para mandar contenido a terceros.
   - Si Resend falla o falta `RESEND_API_KEY`, se registra en los logs y se responde éxito igualmente, porque el lead ya está guardado. Un único intento, sin reintentos.
   - Sustituye al autoresponder de Zoho, que no se envía con Email Opt Out marcado. **Desactiva el autoresponder en Zoho** para no mandar dos correos.

Respuestas: `{ ok: true }` o `{ ok: false, error }`, con `error` igual a `captcha`, `validacion`, `limite`, `zoho` o `servidor`.

**Archivos de configuración**
- `src/config/zoho.ts`: nombres de campo, longitudes, honeypot y site key. Se comparte entre navegador y servidor.
- `src/config/telefono.ts`: campos del teléfono, país por defecto y reglas de cada país (servidor y build).
- `src/server/`: campos ocultos de Zoho y verificación de Turnstile. Solo los usa el servidor.

**Pruebas en local**
- `.env` usa las claves de prueba de Cloudflare, que siempre aprueban la verificación y devuelven `hostname=example.com`. Solo funcionan fuera de producción: en Vercel, producción tiene que tener las claves reales.
- Con `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA` puedes probar el rechazo del captcha.
- Para no crear leads reales en Zoho, apunta `ZOHO_WEB_TO_LEAD_URL` a un servidor local.

## Marca y accesibilidad

- El texto siempre es navy sobre fondos claros (crema, blanco, sol, chicle, mandarina o amarillo), o crema sobre navy. Nunca uses texto claro sobre sol, mandarina o amarillo, porque no pasa el contraste.
- En las páginas y componentes hay un solo `h1` por página y la jerarquía de encabezados no se salta niveles.
- La animación se reduce cuando el usuario tiene activado `prefers-reduced-motion`. El foco es visible en todos los elementos y los objetivos táctiles miden al menos 44 px.
