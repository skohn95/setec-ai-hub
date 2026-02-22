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
    INTRODUCTION: `Setec AI Hub es una plataforma de análisis estadístico que ayuda a profesionales de Lean Six Sigma a realizar análisis de datos sin necesidad de software especializado. Los datos operacionales que subes a la plataforma nunca se envían a proveedores externos de inteligencia artificial. Tus datos crudos permanecen en nuestros servidores.`,
  },

  /** How it works section */
  HOW_IT_WORKS: {
    TITLE: '¿Cómo Funciona?',
    STEPS: [
      'Subes un archivo Excel con tus datos de medición',
      'Nuestro servidor procesa los datos y calcula los resultados estadísticos',
      'Solo los resultados agregados (porcentajes, métricas, clasificaciones) se envían a la IA para generar explicaciones',
      'Recibes los resultados con interpretación y recomendaciones',
    ],
  },

  /** What data is collected */
  DATA_COLLECTED: {
    TITLE: '¿Qué Datos se Recopilan?',
    ITEMS: [
      { type: 'Credenciales de acceso', example: 'Email, contraseña', stored: true, encrypted: true },
      { type: 'Archivos Excel subidos', example: 'Datos de medición MSA', stored: true, encrypted: true },
      { type: 'Historial de conversaciones', example: 'Preguntas y respuestas', stored: true, encrypted: false },
      { type: 'Resultados de análisis', example: 'Métricas calculadas', stored: true, encrypted: false },
    ],
  },

  /** What AI sees and doesn't see */
  AI_VISIBILITY: {
    TITLE: '¿Qué Ve la Inteligencia Artificial?',
    DOES_NOT_SEE: {
      TITLE: 'Lo que la IA NO recibe',
      ITEMS: [
        'Archivos Excel originales',
        'Datos crudos de mediciones',
        'Valores individuales de tu proceso',
      ],
    },
    DOES_SEE: {
      TITLE: 'Lo que la IA SÍ recibe',
      ITEMS: [
        'Resultados estadísticos agregados (ej: "variación del sistema: 18.2%")',
        'Clasificaciones (ej: "categoría marginal")',
        'Tu conversación con el asistente (preguntas de seguimiento)',
      ],
    },
    NOTE: 'Nuestro proveedor de inteligencia artificial no utiliza tus datos para entrenar sus modelos.',
  },

  /** Security measures */
  SECURITY: {
    TITLE: 'Medidas de Seguridad',
    ITEMS: [
      { measure: 'Cifrado en tránsito', detail: 'TLS 1.2+ (HTTPS)' },
      { measure: 'Cifrado en reposo', detail: 'AES-256 para todos los datos almacenados' },
      { measure: 'Autenticación segura', detail: 'Hash seguro de contraseñas' },
      { measure: 'Aislamiento de datos', detail: 'Cada usuario solo puede acceder a sus propios datos' },
    ],
  },

  /** Data retention */
  RETENTION: {
    TITLE: 'Retención de Datos',
    ITEMS: [
      { data: 'Conversaciones', period: 'Indefinido (hasta eliminación por usuario)' },
      { data: 'Archivos subidos', period: 'Indefinido (hasta eliminación por usuario)' },
      { data: 'Credenciales', period: 'Mientras la cuenta esté activa' },
    ],
    DELETE_NOTE: 'Puedes solicitar la eliminación completa de tu cuenta y todos los datos asociados contactando a Setec.',
  },

  /** FAQ */
  FAQ: {
    TITLE: 'Preguntas Frecuentes',
    ITEMS: [
      {
        question: '¿Mis competidores podrían ver mis datos?',
        answer: 'No. Cada usuario está completamente aislado. No hay forma de que un usuario acceda a datos de otro.',
      },
      {
        question: '¿La IA podría usar mis datos para entrenar sus modelos?',
        answer: 'No. Nuestro proveedor de inteligencia artificial no utiliza tus datos para entrenar sus modelos.',
      },
      {
        question: '¿Puedo obtener una copia de mis datos?',
        answer: 'Sí. Puedes solicitar una exportación completa de tus conversaciones y archivos contactando a Setec.',
      },
      {
        question: '¿Cumplen con las normativas europeas de protección de datos (RGPD)?',
        answer: 'La arquitectura de la plataforma está diseñada para facilitar el cumplimiento con el Reglamento General de Protección de Datos. Contacta a Setec para discutir requisitos específicos de tu organización.',
      },
    ],
  },

  /** Contact section */
  CONTACT: {
    TITLE: '¿Tienes preguntas sobre privacidad?',
    CONTENT:
      'Para preguntas sobre privacidad y manejo de datos, contáctanos.',
    EMAIL: 'setec@setec.com.ar',
  },
} as const

/** Key privacy messages for display */
export const PRIVACY_HIGHLIGHTS = {
  NEVER_SENT_TO_AI:
    'Tus datos originales nunca salen de nuestros servidores',
  AI_ONLY_SEES_AGGREGATES: 'La IA solo ve resultados agregados, nunca tus datos crudos',
  ALL_DATA_ENCRYPTED:
    'Toda la información se cifra tanto en tránsito como en reposo',
} as const
