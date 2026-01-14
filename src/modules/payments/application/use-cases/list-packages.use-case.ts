import { Injectable } from '@nestjs/common';
import { CreditPackageRepositoryPort } from '../../domain/ports/credit-package.repository.port';

export interface ListPackagesResponse {
  packages: {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    description: string | null;
    pricePerCredit: number;
  }[];
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
      })),
    };
  }
}
