import type { BrandColor } from './brand';

export type Nivel = {
  id: string;
  numero: 1 | 2 | 3;
  nombre: string;
  lema: string;
  resumen: string;
  incluye: string[];
  paraTi: string;
  teLlevas: string;
  color: BrandColor;
};

/** La escalera de colaboración. Cada escalón incluye todo lo del anterior. */
export const NIVELES: Nivel[] = [
  {
    id: 'diagnostico',
    numero: 1,
    nombre: 'Diagnóstico',
    lema: 'Te damos el mapa.',
    resumen:
      'Auditamos tu marketing, tu tecnología y tu negocio. Después te presentamos un plan estratégico claro, por fases y con prioridades.',
    incluye: [
      'Auditoría de marketing, canales y comunicación',
      'Revisión de herramientas, web y datos',
      'Análisis de mercado y competencia',
      'Plan estratégico con prioridades, plazos y métricas',
      'Presentación del plan a tu equipo',
    ],
    paraTi: 'Tienes equipo para ejecutar, pero te falta rumbo. Quieres saber qué hacer primero y por qué.',
    teLlevas: 'Un plan de acción listo para arrancar mañana.',
    color: 'sol',
  },
  {
    id: 'acompanamiento',
    numero: 2,
    nombre: 'Acompañamiento',
    lema: 'Caminamos a tu lado.',
    resumen:
      'Todo lo del Diagnóstico y, además, seguimos la implementación como tu oficina de proyectos. Tu equipo ejecuta; nosotros marcamos el ritmo.',
    incluye: [
      'Todo lo del escalón Diagnóstico',
      'Seguimiento del plan tipo PMO sobre tu equipo',
      'Reuniones periódicas de avance y desbloqueo',
      'Cuadro de mando con las métricas que importan',
      'Ajustes del plan según resultados',
    ],
    paraTi: 'Tu equipo puede hacerlo, pero el día a día se lo come. Necesitas a alguien que empuje y ordene.',
    teLlevas: 'Un plan que avanza de verdad, semana a semana.',
    color: 'chicle',
  },
  {
    id: 'ejecucion',
    numero: 3,
    nombre: 'Ejecución',
    lema: 'Nos ponemos manos a la obra.',
    resumen:
      'Todo lo del Acompañamiento y, además, ejecutamos el plan nosotros. Campañas, web, automatizaciones, contenidos y analítica. Tú decides; nosotros lo hacemos realidad.',
    incluye: [
      'Todo lo del escalón Acompañamiento',
      'Ejecución del plan por nuestro equipo',
      'Campañas, contenidos y redes',
      'Web, automatizaciones e integraciones',
      'Analítica e informes de resultados',
    ],
    paraTi: 'Quieres resultados sin montar un equipo nuevo. Buscas un socio que se remangue contigo.',
    teLlevas: 'Tu estrategia en marcha, de principio a fin.',
    color: 'mandarina',
  },
];

export type Pregunta = { pregunta: string; respuesta: string };

export const FAQ_SERVICIOS: Pregunta[] = [
  {
    pregunta: '¿Qué escalón me conviene?',
    respuesta:
      'Depende de tu equipo y de tu tiempo. Si tienes manos pero falta rumbo, empieza por el Diagnóstico. Si falta ritmo, el Acompañamiento. Si faltan manos, la Ejecución. En la primera llamada lo vemos juntos.',
  },
  {
    pregunta: '¿Puedo empezar por un escalón y subir después?',
    respuesta:
      'Sí. Es lo más habitual. Empiezas con el Diagnóstico y, cuando tengas el plan, decides si seguimos contigo y hasta dónde.',
  },
  {
    pregunta: '¿Cuánto dura el Diagnóstico?',
    respuesta:
      'Normalmente entre tres y seis semanas, según el tamaño de tu negocio. Te damos fechas cerradas antes de empezar.',
  },
  {
    pregunta: '¿Trabajáis con empresas de cualquier tamaño?',
    respuesta:
      'Trabajamos sobre todo con pymes y empresas en crecimiento que quieren ordenar su marketing y su tecnología con una estrategia clara.',
  },
];
