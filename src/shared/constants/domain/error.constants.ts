// export const AppErrorCodes = {
//   INTERNAL_ERROR: 'INTERNAL_ERROR',
//   DB_ERROR: 'DB_ERROR',
//   CONFLICT_DUPLICATE_ENTRY: 'CONFLICT_DUPLICATE_ENTRY',
//   RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
// } as const;

// export const AppErrorMessages = {
//   INTERNAL_SERVER_ERROR: 'Internal Server Error',
//   CONFLICT_DUPLICATE: 'El valor de un campo único ya está en uso.',
//   RESOURCE_NOT_FOUND: 'El registro solicitado no existe.',
//   UNEXPECTED_ERROR: 'Ocurrió un error inesperado. Contacte a soporte.',
// } as const;

// para errores del error mapping

export const SystemErrorMessages = {
  INTERNAL_SERVER_ERROR: 'Error interno del servidor.',
  CONFLICT_DUPLICATE: 'El registro ya existe.',
  RESOURCE_NOT_FOUND: 'Recurso no encontrado.',
  UNEXPECTED_ERROR: 'Error inesperado.',
} as const;

export const SystemErrorCodes = {
  INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  DB_ERROR: 'SYS_DB_ERROR',
  CONFLICT_DUPLICATE_ENTRY: 'CONFLICT_DUPLICATE_ENTRY',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  TIMEOUT: 'SYS_TIMEOUT',
} as const;

export type SystemErrorCode =
  (typeof SystemErrorCodes)[keyof typeof SystemErrorCodes];
