import { CreditPackage as PrismaCreditPackage } from '@prisma/client';
import {
  CreditPackage,
  CreditPackageProps,
} from '../../../domain/entities/credit-package.entity';

/**
 * CreditPackage Mapper
 * Converts between Prisma model and Domain entity
 */
export class CreditPackageMapper {
  /**
   * Map Prisma model to Domain entity
   */
  static toDomain(prisma: PrismaCreditPackage): CreditPackage {
    const props: CreditPackageProps = {
      id: prisma.id,
      name: prisma.name,
      credits: prisma.credits,
      price: prisma.price,
      currency: prisma.currency,
      active: prisma.active,
      description: prisma.description,
      metadata: prisma.metadata as Record<string, unknown> | null,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };

    return CreditPackage.restore(props);
  }

  /**
   * Map Domain entity to Prisma model data
   */
  static toPrisma(pkg: CreditPackage) {
    const props = pkg.toObject();

    return {
      id: props.id,
      name: props.name,
      credits: props.credits,
      price: props.price,
      currency: props.currency,
      active: props.active,
      description: props.description,
      metadata: props.metadata as never, // Prisma JsonValue compatibility
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
