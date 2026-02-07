// File upload constants and validation messages

export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
] as const

export const ALLOWED_FILE_EXTENSIONS = ['.xlsx', '.xls'] as const

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const MAX_FILE_SIZE_LABEL = '10MB'

export const FILE_VALIDATION_ERRORS = {
  INVALID_TYPE: 'Solo se permiten archivos Excel (.xlsx, .xls)',
  TOO_LARGE: 'El archivo excede el tamaño máximo de 10MB.',
} as const

export const FILE_UPLOAD_LABELS = {
  ATTACH_FILE: 'Adjuntar archivo',
  REMOVE_FILE: 'Quitar archivo adjunto',
  DROP_ZONE: 'Suelta el archivo aquí',
  PRIVACY_MESSAGE:
    'Tus datos se procesan en nuestros servidores. Solo los resultados estadísticos se envían a la IA.',
} as const

// Error messages for file operations
export const FILE_UPLOAD_ERROR_MESSAGE = 'No se pudo subir el archivo. Intenta de nuevo.'
export const FILE_DOWNLOAD_ERROR_MESSAGE = 'No se pudo descargar el archivo.'
export const FILE_NOT_FOUND_MESSAGE = 'El archivo no existe.'
