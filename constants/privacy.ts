/**
 * Privacy page content constants in Spanish.
 * All text content is centralized here for maintainability.
 * Written in plain language for non-technical users.
 */

export const PRIVACY_PAGE = {
  /** Page metadata */
  META: {
    TITLE: 'Privacidad - Setec AI Hub',
    DESCRIPTION: 'Conoce cómo protegemos tus datos en Setec AI Hub',
  },

  /** Main header section */
  HEADER: {
    TITLE: 'Privacidad y Transparencia',
    SUBTITLE: 'Sin letra chica. Sin ambigüedades.',
    INTRODUCTION:
      'Setec AI Hub es una plataforma de análisis estadístico para profesionales de Lean Six Sigma. A continuación te explicamos de forma clara cómo manejamos tu información.',
  },

  /** Three pillars */
  PILLARS: [
    {
      title: 'Tus datos crudos no salen del servidor',
      description:
        'Los archivos Excel que subís se procesan en nuestros servidores. La IA solo recibe los resultados ya calculados, nunca tus datos originales.',
    },
    {
      title: 'Tu información viaja protegida',
      description:
        'Toda la información entre tu navegador y nuestros servidores viaja cifrada, como si estuviera en una caja fuerte digital.',
    },
    {
      title: 'Tu espacio es solo tuyo',
      description:
        'Cada cuenta tiene su propio espacio aislado. Ningún otro usuario puede ver tus datos, conversaciones ni archivos.',
    },
  ],

  /** How it works section */
  HOW_IT_WORKS: {
    TITLE: '¿Cómo Fluyen tus Datos?',
    STEPS: [
      {
        label: 'Subida',
        detail: 'Subís un archivo Excel con tus datos de medición',
      },
      {
        label: 'Cálculo',
        detail:
          'Nuestro servidor calcula los resultados estadísticos (promedios, porcentajes, etc.)',
      },
      {
        label: 'IA',
        detail:
          'Solo esos resultados calculados se envían a la IA para que genere explicaciones',
      },
      {
        label: 'Respuesta',
        detail: 'Recibís los resultados con interpretaciones y recomendaciones en lenguaje claro',
      },
    ],
    KEY_POINT:
      'La inteligencia artificial nunca ve tus datos originales — solo ve los resultados ya calculados.',
  },

  /** Transparency about admin access — the honest section */
  TRANSPARENCY: {
    TITLE: 'Honestidad sobre el Acceso',
    SUBTITLE: 'Lo que otras plataformas no te cuentan',
    INTRO:
      'Queremos ser completamente transparentes: como administradores de la plataforma, técnicamente podemos acceder a la base de datos donde se guarda tu información. Esto funciona igual en prácticamente cualquier servicio en línea que uses — la diferencia es que nosotros te lo decimos de frente.',
    COMMITMENTS: {
      TITLE: 'Nuestros Compromisos',
      ITEMS: [
        'No leemos tus conversaciones ni archivos por curiosidad ni con fines comerciales',
        'No vendemos ni compartimos tus datos con nadie',
        'Solo accedemos a tu información cuando es estrictamente necesario para resolver un problema técnico o por obligación legal',
        'No usamos tus datos para entrenar inteligencia artificial ni para estudios de mercado',
      ],
    },
    NOTE: 'El proveedor de inteligencia artificial que usamos (OpenAI) tampoco utiliza los datos que le enviamos para entrenar sus modelos.',
  },

  /** What data is collected */
  DATA_COLLECTED: {
    TITLE: '¿Qué Información Guardamos?',
    ITEMS: [
      {
        type: 'Tu cuenta',
        example: 'Email y contraseña',
      },
      {
        type: 'Archivos Excel',
        example: 'Los archivos de medición que subís',
      },
      {
        type: 'Conversaciones',
        example: 'Las preguntas que hacés y las respuestas de la IA',
      },
      {
        type: 'Resultados de análisis',
        example: 'Los gráficos y métricas que se generan',
      },
    ],
  },

  /** What AI sees and doesn't see */
  AI_VISIBILITY: {
    TITLE: '¿Qué Información Recibe la IA?',
    DOES_NOT_SEE: {
      TITLE: 'La IA NO recibe',
      ITEMS: [
        'Tus archivos Excel originales',
        'Los datos crudos de tus mediciones',
        'Los valores individuales de tu proceso',
        'Tu email ni ningún dato personal',
      ],
    },
    DOES_SEE: {
      TITLE: 'La IA SÍ recibe',
      ITEMS: [
        'Resultados ya calculados (ej: "la variación del sistema es 18.2%")',
        'Clasificaciones (ej: "el sistema se clasifica como marginal")',
        'Tus preguntas de seguimiento en la conversación',
      ],
    },
  },

  /** Security — written in plain language */
  SECURITY: {
    TITLE: '¿Cómo Protegemos tu Información?',
    ITEMS: [
      {
        measure: 'Conexión segura',
        detail:
          'Todo lo que viaja entre tu navegador y nuestros servidores va cifrado — nadie puede interceptarlo en el camino.',
      },
      {
        measure: 'Almacenamiento protegido',
        detail:
          'Tus archivos y contraseña se guardan cifrados en nuestros servidores, como en una caja fuerte digital.',
      },
      {
        measure: 'Contraseña segura',
        detail:
          'Tu contraseña se transforma antes de guardarse — ni nosotros podemos ver tu contraseña original.',
      },
      {
        measure: 'Espacio privado',
        detail:
          'La base de datos tiene reglas automáticas que impiden que un usuario acceda a datos de otro, aunque lo intentara.',
      },
    ],
  },

  /** User rights & data deletion */
  USER_RIGHTS: {
    TITLE: 'Tus Derechos',
    SUBTITLE: 'Tu información es tuya — siempre.',
    ITEMS: [
      {
        right: 'Eliminar todos tus datos',
        description:
          'Podés solicitar la eliminación completa de tu cuenta y absolutamente toda la información asociada: conversaciones, archivos, resultados, todo. Es irreversible, pero es tu derecho.',
      },
      {
        right: 'Exportar tus datos',
        description:
          'Podés pedir una copia de toda tu información — conversaciones, archivos subidos y resultados de análisis.',
      },
      {
        right: 'Saber qué guardamos',
        description:
          'Tenés derecho a preguntar exactamente qué datos tenemos sobre vos y para qué los usamos.',
      },
    ],
    CTA: 'Para ejercer cualquiera de estos derechos, escribinos a',
  },

  /** Data retention */
  RETENTION: {
    TITLE: '¿Cuánto Tiempo Guardamos tus Datos?',
    ITEMS: [
      {
        data: 'Conversaciones',
        period: 'Hasta que vos las elimines o solicites eliminación de cuenta',
      },
      {
        data: 'Archivos subidos',
        period: 'Hasta que vos los elimines o solicites eliminación de cuenta',
      },
      {
        data: 'Tu cuenta',
        period: 'Mientras la mantengas activa',
      },
    ],
    DELETE_NOTE:
      'Si dejás de usar la plataforma y querés que eliminemos todo, simplemente escribinos.',
  },

  /** FAQ */
  FAQ: {
    TITLE: 'Preguntas Frecuentes',
    ITEMS: [
      {
        question: '¿El administrador de Setec puede ver mis datos?',
        answer:
          'Técnicamente sí, porque los datos están almacenados en nuestros servidores. Esto es igual en cualquier plataforma online — Gmail, Slack, Notion, todas funcionan así. La diferencia es que nosotros te lo decimos abiertamente y nos comprometemos a no acceder a tus datos salvo por necesidad técnica o legal.',
      },
      {
        question: '¿Mis competidores podrían ver mis datos?',
        answer:
          'No. Cada usuario tiene su propio espacio completamente aislado. La base de datos tiene reglas automáticas que hacen imposible que un usuario acceda a datos de otro.',
      },
      {
        question: '¿La IA usa mis datos para entrenarse?',
        answer:
          'No. Usamos la API de OpenAI, que no utiliza los datos enviados para entrenar sus modelos. Tus datos se usan únicamente para generar tu respuesta y nada más.',
      },
      {
        question: '¿Puedo eliminar todos mis datos?',
        answer:
          'Sí. Escribinos a setec@setec.com.ar y eliminamos tu cuenta y absolutamente toda la información asociada. Es irreversible, así que asegurate de exportar lo que necesites antes.',
      },
      {
        question: '¿Puedo obtener una copia de toda mi información?',
        answer:
          'Sí. Contactanos a setec@setec.com.ar y te enviamos una exportación completa de tus conversaciones, archivos y resultados.',
      },
    ],
  },

  /** Contact section */
  CONTACT: {
    TITLE: '¿Tenés dudas?',
    CONTENT:
      'Para consultas sobre privacidad, exportación de datos o eliminación de cuenta, escribinos.',
    EMAIL: 'setec@setec.com.ar',
  },
} as const

/** Key privacy messages for display */
export const PRIVACY_HIGHLIGHTS = {
  NEVER_SENT_TO_AI:
    'Tus datos originales nunca salen de nuestros servidores',
  AI_ONLY_SEES_AGGREGATES:
    'La IA solo ve resultados agregados, nunca tus datos crudos',
  ALL_DATA_ENCRYPTED:
    'Toda la información se cifra tanto en tránsito como en reposo',
} as const
