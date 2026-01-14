import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { CreditPackageRepositoryPort } from '../../domain/ports/credit-package.repository.port';
import { CreditPackage } from '../../domain/entities/credit-package.entity';
import { CreditPackageMapper } from './mappers/credit-package.mapper';

/**
 * Prisma CreditPackage Repository
 * Implements CreditPackageRepositoryPort using Prisma
 */
@Injectable()
export class PrismaCreditPackageRepository
  implements CreditPackageRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CreditPackage | null> {
    const pkg = await this.prisma.creditPackage.findUnique({
      where: { id },
    });

    return pkg ? CreditPackageMapper.toDomain(pkg) : null;
  }

  async findByName(name: string): Promise<CreditPackage | null> {
    const pkg = await this.prisma.creditPackage.findUnique({
      where: { name },
    });

    return pkg ? CreditPackageMapper.toDomain(pkg) : null;
  }

  async findActive(): Promise<CreditPackage[]> {
    const packages = await this.prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: { credits: 'asc' }, // Order by credits ascending (cheapest first)
    });

    return packages.map((p) => CreditPackageMapper.toDomain(p));
  }

  async findAll(): Promise<CreditPackage[]> {
    const packages = await this.prisma.creditPackage.findMany({
      orderBy: { credits: 'asc' },
    });

    return packages.map((p) => CreditPackageMapper.toDomain(p));
  }

  async create(pkg: CreditPackage): Promise<CreditPackage> {
    const data = CreditPackageMapper.toPrisma(pkg);

    const created = await this.prisma.creditPackage.create({
      data,
    });

    return CreditPackageMapper.toDomain(created);
  }

  async update(pkg: CreditPackage): Promise<CreditPackage> {
    const data = CreditPackageMapper.toPrisma(pkg);

    const updated = await this.prisma.creditPackage.update({
      where: { id: pkg.id },
      data,
    });

    return CreditPackageMapper.toDomain(updated);
  }
}
