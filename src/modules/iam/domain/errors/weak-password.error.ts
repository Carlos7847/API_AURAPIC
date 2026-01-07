export class WeakPasswordError extends Error {
  constructor() {
    super('La contraseña no cumple con los requisitos de seguridad.');
    this.name = 'WeakPasswordError';
  }
}
