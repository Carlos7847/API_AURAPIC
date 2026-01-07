export class PasswordResetTokenExpiredError extends Error {
  constructor() {
    super('El token de restablecimiento de contraseña ha expirado.');
    this.name = 'PasswordResetTokenExpiredError';
  }
}
