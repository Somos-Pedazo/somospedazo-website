/**
 * Zoho CRM · Web-to-Lead.
 * Estos valores no son secretos: Zoho los publica en el HTML de cualquier
 * formulario web. Identifican el formulario y el módulo (Leads) de destino.
 *
 * Fase 2 (Turnstile + función de Vercel): el endpoint pasará a ser /api/contacto
 * y estos campos ocultos se moverán al servidor. Ver src/scripts/formulario/envio.ts.
 */
export const ZOHO_WEB_TO_LEAD = {
  endpoint: 'https://crm.zoho.eu/crm/WebToLeadForm',
  /** Campos ocultos obligatorios: sin ellos Zoho rechaza el lead. */
  ocultos: {
    xnQsjsdp: '44bab881b34ac9a6e94d9fcf6b0431ac2d7f580ed84e58883aed3bd322e04225',
    xmIwtLD: '9999eea0633735a635d51cc49eb0db426c0a40b026bc3b442210cc5c7a2c5204efb07306512d316c84732f58577bd082',
    actionType: 'TGVhZHM=',
  },
  /** Honeypot de Zoho: debe llegar vacío. */
  honeypot: 'aG9uZXlwb3Q',
} as const;

/**
 * Nombres de campo de Zoho (respetar mayúsculas y espacios) y longitudes
 * máximas que aplica Zoho a cada campo estándar del módulo Leads.
 */
export const CAMPOS = {
  nombre: { name: 'First Name', max: 40 },
  apellidos: { name: 'Last Name', max: 80 },
  email: { name: 'Email', max: 100 },
  empresa: { name: 'Company', max: 200 },
  telefono: { name: 'Phone', max: 30 },
  mensaje: { name: 'Description', max: 32000 },
} as const;
