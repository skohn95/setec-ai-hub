// Toast duration configuration (Story 6.2)
export const TOAST_DURATIONS = {
  ERROR: 5000,   // 5 seconds for errors (longer for reading)
  SUCCESS: 3000, // 3 seconds for success messages
  WARNING: 4000, // 4 seconds for warnings
} as const

// Error messages in Spanish

export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'No autorizado. Por favor, inicia sesión.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',

  // Validation
  VALIDATION_ERROR: 'Error de validación. Revisa los datos ingresados.',
  INVALID_INPUT: 'Los datos ingresados no son válidos.',
  INVALID_FILE: 'El archivo no es válido o está corrupto.',

  // File handling
  FILE_TOO_LARGE: 'El archivo excede el tamaño máximo permitido (10MB).',
  UNSUPPORTED_FORMAT: 'Formato de archivo no soportado. Solo se aceptan archivos Excel (.xlsx, .xls).',
  FILE_UPLOAD_FAILED: 'Error al subir el archivo. Por favor, intenta nuevamente.',

  // Resources
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  CONVERSATION_NOT_FOUND: 'La conversación no fue encontrada.',
  MESSAGE_NOT_FOUND: 'El mensaje no fue encontrado.',

  // Analysis
  ANALYSIS_FAILED: 'Error al procesar el análisis. Por favor, intenta nuevamente.',
  MISSING_COLUMNS: 'El archivo no contiene las columnas requeridas.',
  INVALID_DATA: 'Los datos del archivo contienen valores inválidos.',

  // Server
  INTERNAL_ERROR: 'Error interno del servidor. Por favor, intenta más tarde.',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible temporalmente.',

  // Network
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  NETWORK_OFFLINE: 'No hay conexión a internet. Verifica tu conexión e intenta de nuevo.',
  TIMEOUT: 'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.',

  // Supabase (generic, user-friendly)
  SUPABASE_GENERIC: 'Ocurrió un error. Por favor intenta de nuevo.',
  SUPABASE_NOT_FOUND: 'El recurso solicitado no fue encontrado.',

  // Fatal/unexpected errors
  UNEXPECTED: 'Algo salió mal. Recarga la página para continuar.',
  RETRY_FAILED: 'No se pudo completar la operación después de varios intentos.',
} as const

// Password Recovery Messages
export const PASSWORD_RECOVERY_MESSAGES = {
  PASSWORD_RESET_SENT: 'Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.',
  PASSWORD_UPDATED: 'Tu contraseña ha sido actualizada.',
  INVALID_RESET_LINK: 'Este enlace ha expirado o no es válido. Solicita uno nuevo.',
  PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres.',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden.',
  REQUEST_NEW_LINK: 'Solicitar nuevo enlace',
  EMAIL_REQUIRED: 'El correo electrónico es requerido.',
  INVALID_EMAIL: 'Por favor ingresa un correo electrónico válido.',
  CONFIRM_PASSWORD_REQUIRED: 'Por favor confirma tu contraseña.',
} as const

export const SUCCESS_MESSAGES = {
  CONVERSATION_CREATED: 'Conversacion creada',
  MESSAGE_SENT: 'Mensaje enviado.',
  FILE_UPLOADED: 'Archivo subido correctamente.',
  ANALYSIS_COMPLETE: 'Análisis completado.',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente.',
} as const

export const CONVERSATION_MESSAGES = {
  CREATE_SUCCESS: 'Conversacion creada',
  CREATE_ERROR: 'No se pudo crear la conversacion. Intenta de nuevo.',
  DELETE_SUCCESS: 'Conversacion eliminada',
  DELETE_ERROR: 'No se pudo eliminar la conversacion',
  UPDATE_TITLE_SUCCESS: 'Nombre actualizado',
  UPDATE_TITLE_ERROR: 'No se pudo actualizar el nombre',
} as const

export const UI_LABELS = {
  LOADING: 'Cargando...',
  ANALYZING: 'Analizando...',
  UPLOADING: 'Subiendo archivo...',
  PROCESSING: 'Procesando...',
  NO_CONVERSATIONS: 'No hay conversaciones. Inicia una nueva.',
  NEW_CONVERSATION: 'Nueva conversación',
  SEND: 'Enviar',
  CANCEL: 'Cancelar',
  RETRY: 'Reintentar',
  DELETE: 'Eliminar',
  CONFIRM: 'Confirmar',
} as const

export const CHAT_MESSAGES = {
  SEND_ERROR: 'No se pudo enviar el mensaje. Intenta de nuevo.',
  LOAD_ERROR: 'No se pudieron cargar los mensajes.',
  PLACEHOLDER: 'Escribe tu mensaje...',
  SEND_BUTTON: 'Enviar',
  SENDING: 'Enviando...',
  EMPTY_CONVERSATION: 'Inicia la conversacion enviando un mensaje.',
  LOADING: 'Cargando mensaje...',
  RETRY: 'Reintentar',
} as const

export const API_ERRORS = {
  OPENAI_UNAVAILABLE: 'El servicio de IA no está disponible en este momento. Por favor intenta de nuevo en unos minutos.',
  OPENAI_RATE_LIMIT: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
  OPENAI_TIMEOUT: 'La solicitud tardó demasiado. Intenta de nuevo.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
  SEND_FAILED: 'No se pudo enviar el mensaje. Intenta de nuevo.',
  FILTER_FAILED: 'No se pudo procesar el mensaje. Intenta de nuevo.',
  // Analysis errors
  ANALYSIS_VALIDATION: 'El archivo contiene errores. Revisa el formato e intenta de nuevo.',
  ANALYSIS_FAILED: 'Ocurrió un error al procesar el análisis. Por favor verifica el formato de tus datos o intenta de nuevo.',
  ANALYSIS_TIMEOUT: 'El análisis tardó demasiado. Intenta con un archivo más pequeño.',
} as const

export const STREAMING_MESSAGES = {
  ERROR_MIDSTREAM: 'Error durante la respuesta. El contenido parcial se ha guardado.',
  INCOMPLETE_RESPONSE: '[Respuesta incompleta - error de conexión]',
  CONNECTION_ERROR: 'Error de conexión. Intenta de nuevo.',
} as const

// Capacidad de Proceso error messages (Spanish)
export const CAPACIDAD_PROCESO_ERRORS = {
  NO_NUMERIC_COLUMN: 'No se encontró una columna numérica. El archivo debe contener una columna "Valores" con datos numéricos.',
  EMPTY_CELLS: 'Se encontraron celdas vacías. Por favor, completa todos los valores.',
  NON_NUMERIC_VALUES: 'Se encontraron valores no numéricos. Todos los valores deben ser números.',
  SAMPLE_SIZE_WARNING: 'Se recomienda un mínimo de 20 valores para obtener estimaciones confiables de capacidad.',
} as const

// Story 7.3: Stability Analysis messages (Spanish)
// Note: These constants are defined for Epic 8 frontend chart components.
// Python generates instructions with hardcoded Spanish text; these provide
// consistent keys for frontend localization if needed.
export const STABILITY_RULE_DESCRIPTIONS = {
  rule_1: 'Regla 1: Puntos fuera de los límites de control (más allá de 3σ)',
  rule_2: 'Regla 2: 7 puntos consecutivos con tendencia ascendente o descendente',
  rule_3: 'Regla 3: 7 puntos consecutivos dentro de 1σ del centro (estratificación)',
  rule_4: 'Regla 4: 7 puntos consecutivos entre 2σ y 3σ arriba del centro',
  rule_5: 'Regla 5: 7 puntos consecutivos entre 2σ y 3σ debajo del centro',
  rule_6: 'Regla 6: 7 puntos consecutivos en patrón cíclico (alternante)',
  rule_7: 'Regla 7: 7 puntos consecutivos arriba o debajo de la línea central',
} as const

export const STABILITY_CONCLUSIONS = {
  stable: '✅ **Proceso Estable:** El proceso está bajo control estadístico.',
  unstable: '⚠️ **Proceso Inestable:** Se detectaron señales de causa especial.',
} as const

export const STABILITY_INTERPRETATION = {
  stable: 'Los datos no muestran patrones de variación por causas especiales. Es apropiado calcular índices de capacidad.',
  unstable: 'El proceso presenta variación por causas especiales. Se recomienda investigar y eliminar estas causas antes de calcular índices de capacidad.',
} as const

// Story 7.4: Capability Analysis messages (Spanish)
export const CAPABILITY_CLASSIFICATIONS_MESSAGES = {
  excellent: 'Excelente - El proceso supera ampliamente los requisitos',
  adequate: 'Capaz - El proceso cumple con los requisitos de capacidad',
  marginal: 'Marginalmente Capaz - El proceso apenas cumple los requisitos mínimos',
  inadequate: 'No Capaz - El proceso no cumple con los requisitos de capacidad',
  poor: 'Muy Deficiente - El proceso requiere acción inmediata',
} as const

export const CAPABILITY_INTERPRETATIONS = {
  excellent: 'Con un Cpk ≥ 1.67, su proceso tiene margen de seguridad significativo. La probabilidad de producir defectos es extremadamente baja.',
  adequate: 'Con un Cpk entre 1.33 y 1.67, su proceso cumple los estándares industriales. Continúe monitoreando para mantener este nivel.',
  marginal: 'Con un Cpk entre 1.00 y 1.33, su proceso está en el límite. Se recomienda investigar fuentes de variación y mejorar el centrado.',
  inadequate: 'Con un Cpk < 1.00, su proceso genera defectos a una tasa inaceptable. Se requieren acciones de mejora prioritarias.',
  poor: 'Con un Cpk < 0.67, su proceso está severamente fuera de especificación. Considere detener la producción hasta resolver.',
} as const

export const CAPABILITY_RECOMMENDATIONS = {
  centering_issue: 'El proceso no está centrado entre las especificaciones. Ajuste el proceso hacia el valor objetivo.',
  spread_issue: 'La variación del proceso es excesiva. Identifique y elimine fuentes de variación.',
  both_issues: 'El proceso tiene problemas de centrado y variación. Priorice reducir la variación primero.',
  stable_capable: 'El proceso es estable y capaz. Continúe con monitoreo de control estadístico.',
  unstable_warning: 'El proceso es inestable. Los índices de capacidad pueden no ser confiables hasta lograr estabilidad.',
  non_normal_note: 'Los datos no siguen una distribución normal. Los índices se calcularon usando la distribución ajustada.',
} as const

export const CAPABILITY_INDEX_DESCRIPTIONS = {
  cp: 'Cp - Capacidad potencial del proceso (sin considerar centrado)',
  cpk: 'Cpk - Índice de capacidad del proceso (considera centrado)',
  pp: 'Pp - Desempeño potencial del proceso (variación total)',
  ppk: 'Ppk - Índice de desempeño del proceso (considera centrado)',
  cpu: 'Cpu - Capacidad hacia el límite superior',
  cpl: 'Cpl - Capacidad hacia el límite inferior',
  ppu: 'Ppu - Desempeño hacia el límite superior',
  ppl: 'Ppl - Desempeño hacia el límite inferior',
} as const

export const CAPABILITY_SPEC_LIMIT_ERRORS = {
  missing_lei: 'Se requiere el Límite de Especificación Inferior (LEI)',
  missing_les: 'Se requiere el Límite de Especificación Superior (LES)',
  lei_greater_than_les: 'El LEI debe ser menor que el LES',
  invalid_values: 'LEI y LES deben ser valores numéricos válidos',
} as const
