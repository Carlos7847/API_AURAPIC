import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import {
  ImageAssetRepositoryPort,
  CreateImageAssetDto,
  UpdateImageAssetDto,
} from '../../domain/ports/image-asset.repository.port';
import {
  ImageAsset,
  ImageAssetKind,
} from '../../domain/entities/image-asset.entity';

@Injectable()
export class PrismaImageAssetRepository implements ImageAssetRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateImageAssetDto): Promise<ImageAsset> {
    const asset = await this.prisma.imageAsset.create({
      data: {
        userId: data.userId,
        storageKey: data.storageKey,
        url: data.url,
        kind: data.kind,
        width: data.width,
        height: data.height,
        sizeBytes: data.sizeBytes,
      },
    });

    return this.toDomain(asset);
  }

  async findById(id: string): Promise<ImageAsset | null> {
    const asset = await this.prisma.imageAsset.findUnique({
      where: { id },
    });

    return asset ? this.toDomain(asset) : null;
  }

  async findByUserId(
    userId: string,
    kind?: ImageAssetKind,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: ImageAsset[]; total: number }> {
    const where = kind ? { userId, kind } : { userId };

    const [assets, total] = await Promise.all([
      this.prisma.imageAsset.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.imageAsset.count({ where }),
    ]);

    return {
      data: assets.map((asset) => this.toDomain(asset)),
      total,
    };
  }

  async findByStorageKey(storageKey: string): Promise<ImageAsset | null> {
    const prismaAsset = await this.prisma.imageAsset.findUnique({
      where: { storageKey },
    });
    return prismaAsset ? this.toDomain(prismaAsset) : null;
  }

  async update(id: string, data: UpdateImageAssetDto): Promise<ImageAsset> {
    const asset = await this.prisma.imageAsset.update({
      where: { id },
      data,
    });

    return this.toDomain(asset);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.imageAsset.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.imageAsset.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Mapea entidad Prisma a entidad de dominio
   * Convierte null de Prisma a undefined para cumplir con el entity
   */
  private toDomain(prismaAsset: Record<string, unknown>): ImageAsset {
    return ImageAsset.restore({
      id: prismaAsset.id as string,
      userId: prismaAsset.userId as string,
      storageKey: prismaAsset.storageKey as string,
      url: prismaAsset.url as string,
      kind: prismaAsset.kind as 'input' | 'output' | 'thumbnail',
      width:
        prismaAsset.width === null ? undefined : (prismaAsset.width as number),
      height:
        prismaAsset.height === null
          ? undefined
          : (prismaAsset.height as number),
      sizeBytes:
        prismaAsset.sizeBytes === null
          ? undefined
          : (prismaAsset.sizeBytes as number),
      createdAt: prismaAsset.createdAt as Date,
    });
  }
}
