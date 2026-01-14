import { CreditPackage } from '../entities/credit-package.entity';

/**
 * CreditPackage Repository Port (Interface)
 * Defines the contract for credit package persistence
 */
export abstract class CreditPackageRepositoryPort {
  abstract findById(id: string): Promise<CreditPackage | null>;

  abstract findByName(name: string): Promise<CreditPackage | null>;

  abstract findActive(): Promise<CreditPackage[]>;

  abstract findAll(): Promise<CreditPackage[]>;

  abstract create(pkg: CreditPackage): Promise<CreditPackage>;

  /**
   * Update existing package
   */
  abstract update(pkg: CreditPackage): Promise<CreditPackage>;
}
