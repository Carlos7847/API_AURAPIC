export class InvalidTokenError extends Error {
  constructor(message = 'Token inválido o expirado') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}
