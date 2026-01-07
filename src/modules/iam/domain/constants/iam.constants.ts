export const PASSWORD_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const MAX_LOGIN_ATTEMPTS = 5;

// genéricos para todo el módulo
export const AuthValidationMessages = {
  EMAIL_INVALID: 'El formato del email no es válido.',
  PASSWORD_WEAK:
    'La contraseña es demasiado débil. Debe contener mayúsculas, minúsculas y números.',
  FIELD_REQUIRED: 'Este campo es obligatorio.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_TOO_LONG: 'La contraseña es demasiado larga',
  PASSWORD_NO_UPPERCASE: 'Falta al menos una letra mayúscula',
  PASSWORD_NO_LOWERCASE: 'Falta al menos una letra minúscula',
  PASSWORD_NO_NUMBER: 'Falta al menos un número',
  PASSWORD_NO_SPECIAL_CHAR: 'Falta al menos un carácter especial (!@#$%...)',
  TOKEN_INVALID: 'El token proporcionado no es válido.',
} as const;

// errores de Negocio (Use Cases / Exceptions)
export const AuthErrors = {
  USER_ALREADY_EXISTS: 'El usuario ya existe.',
  INVALID_CREDENTIALS: 'El correo o la contraseña son incorrectos.',
  ACCOUNT_SUSPENDED: 'Su cuenta ha sido suspendida. Contacte a soporte.',
  USER_NOT_FOUND: 'No se encontró el usuario.',
  TOKEN_INVALID: 'El token proporcionado no es válido.',
} as const;

// para los errores manuales- error mapping
export const IamErrorCodes = {
  // Auth - User
  USER_ALREADY_EXISTS: 'AUTH_USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',

  // Auth - Token
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_REUSE_DETECTED: 'AUTH_TOKEN_REUSE_DETECTED',

  // Auth - Password
  AUTH_PASSWORD_WEAK: 'AUTH_PASSWORD_WEAK',
  AUTH_PASSWORD_RESET_TOKEN_EXPIRED: 'AUTH_PASSWORD_RESET_TOKEN_EXPIRED',

  // Auth - TFA
  AUTH_TFA_REQUIRED: 'AUTH_TFA_REQUIRED',
  AUTH_TFA_CODE_INVALID: 'AUTH_TFA_CODE_INVALID',

  // Auth - Session
  AUTH_SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
} as const;

/**
 * Tipo derivado para Type Safety estricto.
 * Equivale a: 'AUTH_USER_ALREADY_EXISTS' | 'AUTH_INVALID_CREDENTIALS' | ...
 */
export type IamErrorCode = (typeof IamErrorCodes)[keyof typeof IamErrorCodes];
