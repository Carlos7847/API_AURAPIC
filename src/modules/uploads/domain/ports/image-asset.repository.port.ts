import { ImageAsset, ImageAssetKind } from '../entities/image-asset.entity';

export interface CreateImageAssetDto {
  userId: string;
  s3Key: string;
  url: string;
  kind: ImageAssetKind;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface UpdateImageAssetDto {
  userId?: string;
  s3Key?: string;
  url?: string;
  kind?: ImageAssetKind;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export abstract class ImageAssetRepositoryPort {
  abstract create(data: CreateImageAssetDto): Promise<ImageAsset>;
  abstract findById(id: string): Promise<ImageAsset | null>;
  abstract findByUserId(
    userId: string,
    kind?: ImageAssetKind,
    limit?: number,
    offset?: number,
  ): Promise<{ data: ImageAsset[]; total: number }>;
  abstract findByS3Key(s3Key: string): Promise<ImageAsset | null>;
  abstract update(id: string, data: UpdateImageAssetDto): Promise<ImageAsset>;
  abstract delete(id: string): Promise<void>;
  abstract deleteByUserId(userId: string): Promise<number>;
}
