import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { StorageServicePort } from '../../domain/ports/storage.service.port';
import { ImageAssetRepositoryPort } from '../../domain/ports/image-asset.repository.port';
import { PresignUploadDto } from '../dtos/presign-upload.dto';
import { PresignedUrlResponseDto } from '../dtos/responses/presigned-url.response.dto';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';
import { UploadPolicyService } from '../../domain/services/upload-policy.service';

/**
 * Presign Upload Use Case
 * Flujo:
 * 1. Valida el tipo y tamaño de archivo (vía Domain Service)
 * 2. Genera S3 key (vía Domain Service)
 * 3. Crea registro de ImageAsset en BD
 * 4. Genera URL presignada
 * 5. Retorna URL + metadata
 */
export class PresignUploadUseCase {
  constructor(
    private readonly s3Service: StorageServicePort,
    private readonly imageAssetRepository: ImageAssetRepositoryPort,
    private readonly uploadPolicy: UploadPolicyService,
    private readonly envConfig: EnvironmentConfigService,
    private readonly logger: LoggerPort,
  ) {}

  async execute(
    userId: string,
    dto: PresignUploadDto,
  ): Promise<PresignedUrlResponseDto> {
    // 1. Validar reglas de dominio (tipo de archivo, etc)
    this.uploadPolicy.validateFile(dto.contentType);

    // 2. Generar Key de almacenamiento según política de dominio
    const storageKey = this.uploadPolicy.generateStorageKey(
      userId,
      dto.filename,
      dto.kind,
    );

    this.logger.debug(
      `Presigning upload for user ${userId}, file: ${dto.filename}, kind: ${dto.kind}, key: ${storageKey}`,
      PresignUploadUseCase.name,
    );

    // 3. Crear registro de ImageAsset en BD
    const imageAsset = await this.imageAssetRepository.create({
      userId,
      storageKey,
      url: `s3://${this.getS3Bucket()}/${storageKey}`,
      kind: dto.kind,
    });

    // 4. Generar URL presignada
    const expiresIn = this.envConfig.getS3PresignedUrlExpiry();
    const presignedUrl = await this.s3Service.generatePresignedPutUrl(
      storageKey,
      dto.contentType,
      expiresIn,
    );

    this.logger.debug(
      `Successfully generated presigned URL for image ${imageAsset.id}`,
      PresignUploadUseCase.name,
    );

    return new PresignedUrlResponseDto({
      imageId: imageAsset.id,
      storageKey,
      presignedUrl,
      expiresIn,
      contentType: dto.contentType,
      generatedAt: new Date(),
    });
  }

  private getS3Bucket(): string {
    return this.envConfig.getS3Bucket();
  }
}
