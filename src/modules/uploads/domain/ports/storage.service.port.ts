export abstract class StorageServicePort {
  /**
   * Genera una URL firmada para subida PUT
   * @param key - Clave de objeto en almacenamiento
   * @param contentType - MIME type esperado
   * @param expiresIn - Segundos hasta expiración
   * @returns URL firmada y válida para PUT
   */
  abstract generatePresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn: number,
  ): Promise<string>;

  /**
   * Genera una URL firmada para descarga GET
   * @param key - Clave de objeto en almacenamiento
   * @param expiresIn - Segundos hasta expiración
   * @returns URL firmada y válida para GET
   */
  abstract generatePresignedGetUrl(
    key: string,
    expiresIn: number,
  ): Promise<string>;

  /**
   * Elimina un objeto del almacenamiento
   * @param key - Clave de objeto
   */
  abstract deleteObject(key: string): Promise<void>;

  /**
   * Obtiene metadatos de un objeto (tamaño, tipo, etc.)
   * @param key - Clave de objeto
   */
  abstract getObjectMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  }>;
}
