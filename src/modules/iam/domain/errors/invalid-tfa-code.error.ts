export class InvalidTfaCodeError extends Error {
  constructor() {
    super('Código de verificación inválido.');
    this.name = 'InvalidTfaCodeError';
  }
}
