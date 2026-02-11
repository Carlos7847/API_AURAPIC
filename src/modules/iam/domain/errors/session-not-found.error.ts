export class SessionNotFoundError extends Error {
  constructor(message = 'Sesión no encontrada') {
    super(message);
    this.name = 'SessionNotFoundError';
  }
}
