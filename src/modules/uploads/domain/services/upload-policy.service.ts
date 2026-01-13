import { InvalidFileTypeError } from '../errors/upload.errors';

/**
 * Upload Policy Service (Domain Service)
 * Encapsula las reglas de negocio sobre qué archivos son aceptables y cómo se nombran.
 */
export class UploadPolicyService {
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  // 50 MB limit
  private readonly MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

  validateFile(contentType: string): void {
    if (!this.ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new InvalidFileTypeError(contentType, this.ALLOWED_MIME_TYPES);
    }
  }

  /**
   * Genera una clave de almacenamiento (S3 Key) canónica.
   * Estructura: {kind}/{userId}/{timestamp}-{filename}
   */
  generateStorageKey(userId: string, filename: string, kind: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = this.sanitizeFilename(filename);
    return `${kind}/${userId}/${timestamp}-${sanitizedFilename}`;
  }

  private sanitizeFilename(filename: string): string {
    const baseName = filename.split('/').pop() || 'file';
    // Mantiene solo alfanuméricos, puntos, guiones y subguiones
    return baseName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  }
}
