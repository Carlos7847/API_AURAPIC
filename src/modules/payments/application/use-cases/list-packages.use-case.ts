import { Injectable } from '@nestjs/common';
import { CreditPackageRepositoryPort } from '../../domain/ports/credit-package.repository.port';
import { CreditPackageResponseDto } from '../dtos/credit-package.response.dto';

export interface ListPackagesResponse {
  packages: CreditPackageResponseDto[];
}

/**
 * List Packages Use Case
 * Returns available credit packages for purchase
 */
@Injectable()
export class ListPackagesUseCase {
  constructor(
    private readonly packageRepository: CreditPackageRepositoryPort,
  ) {}

  async execute(): Promise<ListPackagesResponse> {
    const packages = await this.packageRepository.findActive();

    return {
      packages: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price,
        currency: pkg.currency,
        description: pkg.description,
        pricePerCredit: pkg.getPricePerCredit(),
        features: pkg.features,
        metadata: pkg.metadata,
      })),
    };
  }
}
