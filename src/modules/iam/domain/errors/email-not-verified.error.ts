export class EmailNotVerifiedError extends Error {
  constructor() {
    super('El correo no ha sido verificado. Revisa tu bandeja de entrada.');
    this.name = 'EmailNotVerifiedError';
  }
}
