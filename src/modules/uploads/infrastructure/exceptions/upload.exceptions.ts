/**
 * Excepciones de dominio para Upload
 */

export class S3OperationError extends Error {
  constructor(operation: string, message: string) {
    super(`S3 operation failed [${operation}]: ${message}`);
    this.name = 'S3OperationError';
  }
}
