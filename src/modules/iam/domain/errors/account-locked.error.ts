export class AccountLockedError extends Error {
  constructor(minutesUntilUnlock: number) {
    super(`Demasiados intentos. Intenta en ${minutesUntilUnlock} minutos.`);
    this.name = 'AccountLockedError';
  }
}
