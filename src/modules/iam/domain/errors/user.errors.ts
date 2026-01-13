export class InvalidUserDataError extends Error {
  constructor(field: string, value: string) {
    super(`Invalid user ${field}: ${value}`);
    this.name = 'InvalidUserDataError';
  }
}
