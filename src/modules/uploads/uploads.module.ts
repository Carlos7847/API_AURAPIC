import { Module } from '@nestjs/common';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';
import { EnvironmentConfigModule } from 'src/shared/config/infrastructure/environment-config.module';

// Ports
import { StorageServicePort } from './domain/ports/storage.service.port';
import { ImageAssetRepositoryPort } from './domain/ports/image-asset.repository.port';
import { UploadPolicyService } from './domain/services/upload-policy.service';

// Adapters
import { AwsS3Adapter } from './infrastructure/adapters/aws-s3.adapter';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

// Repositories
import { PrismaImageAssetRepository } from './infrastructure/persistence/prisma-image-asset.repository';

// Use Cases
import { PresignUploadUseCase } from './application/use-cases/presign-upload.use-case';
import { GetImageAssetsUseCase } from './application/use-cases/get-image-assets.use-case';
import { DeleteImageAssetUseCase } from './application/use-cases/delete-image-asset.use-case';

// Controller
import { UploadsController } from './infrastructure/http/uploads.controller';

@Module({
  imports: [EnvironmentConfigModule],
  controllers: [UploadsController],
  providers: [
    {
      provide: UploadPolicyService,
      useClass: UploadPolicyService,
    },
    {
      provide: StorageServicePort,
      useClass: AwsS3Adapter,
    },
    {
      provide: ImageAssetRepositoryPort,
      useClass: PrismaImageAssetRepository,
    },
    {
      provide: PresignUploadUseCase,
      useFactory: (
        s3Service: StorageServicePort,
        imageAssetRepo: ImageAssetRepositoryPort,
        uploadPolicy: UploadPolicyService,
        envConfig: EnvironmentConfigService,
        logger: LoggerPort,
      ) => {
        return new PresignUploadUseCase(
          s3Service,
          imageAssetRepo,
          uploadPolicy,
          envConfig,
          logger,
        );
      },
      inject: [
        StorageServicePort,
        ImageAssetRepositoryPort,
        UploadPolicyService,
        EnvironmentConfigService,
        LoggerPort,
      ],
    },
    {
      provide: GetImageAssetsUseCase,
      useFactory: (
        imageAssetRepo: ImageAssetRepositoryPort,
        logger: LoggerPort,
      ) => {
        return new GetImageAssetsUseCase(imageAssetRepo, logger);
      },
      inject: [ImageAssetRepositoryPort, LoggerPort],
    },
    {
      provide: DeleteImageAssetUseCase,
      useFactory: (
        imageAssetRepo: ImageAssetRepositoryPort,
        s3Service: StorageServicePort,
        logger: LoggerPort,
      ) => {
        return new DeleteImageAssetUseCase(imageAssetRepo, s3Service, logger);
      },
      inject: [ImageAssetRepositoryPort, StorageServicePort, LoggerPort],
    },
  ],
  exports: [StorageServicePort, ImageAssetRepositoryPort],
})
export class UploadsModule {}
