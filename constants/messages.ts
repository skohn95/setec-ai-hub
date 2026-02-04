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
  TIMEOUT: 'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.',
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
  CONVERSATION_CREATED: 'Conversación creada exitosamente.',
  MESSAGE_SENT: 'Mensaje enviado.',
  FILE_UPLOADED: 'Archivo subido correctamente.',
  ANALYSIS_COMPLETE: 'Análisis completado.',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente.',
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
