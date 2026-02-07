/**
 * Privacy page content constants in Spanish.
 * All text content is centralized here for maintainability.
 */

export const PRIVACY_PAGE = {
  /** Page metadata */
  META: {
    TITLE: 'Privacidad - Setec AI Hub',
    DESCRIPTION: 'Conoce cómo protegemos tus datos en Setec AI Hub',
  },

  /** Main header section */
  HEADER: {
    TITLE: 'Cómo Protegemos tus Datos',
    INTRODUCTION: `En Setec AI Hub, la privacidad de tus datos es nuestra máxima prioridad.
Hemos diseñado nuestra plataforma para que puedas analizar tus datos operativos
con total confianza, sabiendo que tu información sensible nunca sale de nuestros servidores.`,
  },

  /** Data flow visualization section */
  DATA_FLOW: {
    TITLE: 'Flujo de Datos',
    SUBTITLE: '¿Qué datos van a dónde?',
    ITEMS: [
      {
        icon: 'FileSpreadsheet',
        component: 'Archivos Excel',
        location: 'Supabase Storage',
        data: 'Datos originales (cifrados AES-256)',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        highlight: false,
      },
      {
        icon: 'Server',
        component: 'Procesamiento',
        location: 'Servidor Setec',
        data: 'Cálculos estadísticos temporales',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        highlight: false,
      },
      {
        icon: 'MessageSquare',
        component: 'Asistente IA',
        location: 'OpenAI API',
        data: 'SOLO resultados agregados',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        highlight: true,
      },
    ],
  },

  /** Detailed sections content */
  SECTIONS: {
    DATA_PROCESSING: {
      title: '¿Qué datos se procesan?',
      icon: 'FileSpreadsheet',
      content: [
        'Tus archivos Excel se almacenan de forma segura en Supabase Storage, un servicio de almacenamiento en la nube con certificación SOC 2.',
        'El contenido de tus archivos (valores de celdas, mediciones originales) NUNCA se envía a OpenAI ni a ningún servicio de inteligencia artificial externo.',
        'Tus datos originales permanecen exclusivamente en nuestros servidores seguros.',
      ],
    },
    FILE_PROTECTION: {
      title: '¿Cómo se protegen tus archivos?',
      icon: 'Lock',
      content: [
        'Cifrado AES-256 en reposo: Tus archivos se almacenan cifrados.',
        'Cifrado HTTPS en tránsito: Toda la comunicación está protegida con TLS.',
        'Supabase cuenta con certificación SOC 2 Type II, garantizando los más altos estándares de seguridad.',
        'Cumplimiento GDPR: Nuestro manejo de datos sigue las normativas europeas de protección de datos.',
        'Acceso restringido: Solo tú puedes acceder a tus archivos.',
      ],
    },
    AI_VISIBILITY: {
      title: '¿Qué ve el asistente de IA?',
      icon: 'MessageSquare',
      content: [
        'El asistente de IA SOLO recibe resultados estadísticos agregados:',
        '• Porcentajes de R&R y variación',
        '• Clasificaciones (Aceptable, Marginal, Inaceptable)',
        '• Métricas calculadas sin datos identificables',
        'NUNCA ve: valores individuales de mediciones, nombres de operadores reales, ni contenido de celdas originales.',
      ],
    },
    CONVERSATION_STORAGE: {
      title: 'Almacenamiento de conversaciones',
      icon: 'Database',
      content: [
        'Tus conversaciones se almacenan en Supabase PostgreSQL, una base de datos segura y confiable.',
        'Cada conversación está asociada exclusivamente a tu cuenta de usuario.',
        'Aplicamos las mismas políticas de cifrado y acceso restringido que a tus archivos.',
      ],
    },
  },

  /** Contact section */
  CONTACT: {
    TITLE: '¿Tienes preguntas sobre privacidad?',
    CONTENT:
      'Si tienes dudas sobre cómo manejamos tus datos o deseas ejercer tus derechos de privacidad, no dudes en contactarnos.',
    EMAIL: 'privacidad@setec.com.mx',
    REASSURANCE:
      'Nos comprometemos a responder todas tus consultas sobre privacidad en un plazo máximo de 48 horas.',
  },

  /** Navigation */
  NAVIGATION: {
    BACK_TO_DASHBOARD: 'Volver al Dashboard',
  },
} as const

/** Key privacy messages for display */
export const PRIVACY_HIGHLIGHTS = {
  NEVER_SENT_TO_AI:
    'Tus datos originales nunca salen de nuestros servidores',
  AI_ONLY_SEES_AGGREGATES: 'El asistente de IA solo ve resultados agregados',
  ALL_DATA_ENCRYPTED:
    'Toda la información se cifra tanto en tránsito como en reposo',
} as const
