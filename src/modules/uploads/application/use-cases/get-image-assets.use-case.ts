import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { ImageAssetRepositoryPort } from '../../domain/ports/image-asset.repository.port';
import { ImageAssetResponseDto } from '../dtos/responses/image-asset.response.dto';
import { ImageAssetNotFoundError } from '../../domain/errors/upload.errors';

/**
 * Get Image Assets Use Case
 * Lista todos los ImageAssets de un usuario con paginación
 */
export class GetImageAssetsUseCase {
  constructor(
    private readonly imageAssetRepository: ImageAssetRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(
    userId: string,
    kind?: 'input' | 'output' | 'thumbnail',
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    data: ImageAssetResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    this.logger.debug(
      `Fetching image assets for user ${userId}, kind: ${kind}, limit: ${limit}, offset: ${offset}`,
    );

    const result = await this.imageAssetRepository.findByUserId(
      userId,
      kind,
      limit,
      offset,
    );

    return {
      data: result.data.map(
        (asset) =>
          new ImageAssetResponseDto({
            id: asset.id,
            userId: asset.userId,
            s3Key: asset.s3Key,
            url: asset.url,
            kind: asset.kind,
            width: asset.width,
            height: asset.height,
            sizeBytes: asset.sizeBytes,
            createdAt: asset.createdAt,
          }),
      ),
      total: result.total,
      limit,
      offset,
    };
  }

  async getById(id: string): Promise<ImageAssetResponseDto> {
    this.logger.debug(`Fetching image asset by id: ${id}`);

    const asset = await this.imageAssetRepository.findById(id);

    if (!asset) {
      throw new ImageAssetNotFoundError(id);
    }

    return new ImageAssetResponseDto({
      id: asset.id,
      userId: asset.userId,
      s3Key: asset.s3Key,
      url: asset.url,
      kind: asset.kind,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
      createdAt: asset.createdAt,
    });
  }
}
