/**
 * Reenvío de leads a Zoho CRM (Web-to-Lead) desde el servidor.
 * Los campos ocultos identifican el formulario web y el módulo (Leads) en Zoho.
 * Solo se usan aquí: no aparecen en el HTML que recibe el navegador.
 */
const ZOHO_ENDPOINT = 'https://crm.zoho.eu/crm/WebToLeadForm';

const OCULTOS = {
  xnQsjsdp: '44bab881b34ac9a6e94d9fcf6b0431ac2d7f580ed84e58883aed3bd322e04225',
  xmIwtLD: '9999eea0633735a635d51cc49eb0db426c0a40b026bc3b442210cc5c7a2c5204efb07306512d316c84732f58577bd082',
  actionType: 'TGVhZHM=',
} as const;

/** Permite apuntar a un servidor de pruebas para no crear leads reales (ver .env.example). */
function endpoint(): string {
  return import.meta.env.ZOHO_WEB_TO_LEAD_URL || process.env.ZOHO_WEB_TO_LEAD_URL || ZOHO_ENDPOINT;
}

/**
 * Envía el lead. Zoho responde con una redirección o una página HTML, así que
 * cualquier 2xx o 3xx se considera éxito (redirect: "manual" para no seguirla).
 */
export async function enviarAZoho(campos: Record<string, string>): Promise<{ ok: boolean; estado: number }> {
  const cuerpo = new URLSearchParams({ ...OCULTOS, ...campos });
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: cuerpo,
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  });
  return { ok: res.status >= 200 && res.status < 400, estado: res.status };
}
