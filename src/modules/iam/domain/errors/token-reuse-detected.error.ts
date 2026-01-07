export class TokenReuseDetectedError extends Error {
  constructor() {
    super(
      'Intento de reutilizar token. Todas las sesiones han sido revocadas.',
    );
    this.name = 'TokenReuseDetectedError';
  }
}
