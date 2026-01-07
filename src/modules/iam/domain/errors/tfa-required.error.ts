export class TfaRequiredError extends Error {
  constructor() {
    super('Se requiere autenticación de dos factores.');
    this.name = 'TfaRequiredError';
  }
}
