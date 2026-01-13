import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { ImageAssetRepositoryPort } from '../../domain/ports/image-asset.repository.port';
import { StorageServicePort } from '../../domain/ports/storage.service.port';
import {
  ImageAssetNotFoundError,
  UnauthorizedAssetAccessError,
} from '../../domain/errors/upload.errors';

/**
 * Delete Image Asset Use Case
 * Elimina un ImageAsset de BD y S3
 */
export class DeleteImageAssetUseCase {
  constructor(
    private readonly imageAssetRepository: ImageAssetRepositoryPort,
    private readonly s3Service: StorageServicePort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(userId: string, imageId: string): Promise<void> {
    this.logger.debug(`Deleting image asset ${imageId} for user ${userId}`);

    // Verificar que el asset existe y pertenece al usuario
    const asset = await this.imageAssetRepository.findById(imageId);

    if (!asset) {
      throw new ImageAssetNotFoundError(imageId);
    }

    if (asset.userId !== userId) {
      throw new UnauthorizedAssetAccessError(userId, imageId);
    }

    await this.s3Service.deleteObject(asset.s3Key);

    await this.imageAssetRepository.delete(imageId);

    this.logger.debug(`Successfully deleted image asset ${imageId}`);
  }
}
