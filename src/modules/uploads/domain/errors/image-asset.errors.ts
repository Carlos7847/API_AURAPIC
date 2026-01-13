export class InvalidImageAssetError extends Error {
  constructor(field: string, message: string) {
    super(`Invalid ${field}: ${message}`);
    this.name = 'InvalidImageAssetError';
  }
}
