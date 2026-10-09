interface ImportMetaEnv {
  /** Cloudflare Turnstile · site key (pública). */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  /** Cloudflare Turnstile · secret key. Solo servidor. */
  readonly TURNSTILE_SECRET_KEY?: string;
  /** Opcional (pruebas): sustituye el endpoint de Zoho. Solo servidor. */
  readonly ZOHO_WEB_TO_LEAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
