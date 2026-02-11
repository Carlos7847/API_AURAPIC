export class UnauthorizedSessionAccessError extends Error {
  constructor(message = 'No tienes permiso para acceder a esta sesión') {
    super(message);
    this.name = 'UnauthorizedSessionAccessError';
  }
}
