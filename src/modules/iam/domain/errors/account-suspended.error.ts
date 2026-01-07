export class AccountSuspendedError extends Error {
  constructor() {
    super('La cuenta ha sido suspendida.');
    this.name = 'AccountSuspendedError';
  }
}
