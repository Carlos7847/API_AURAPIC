import {
  Prisma,
  User as PrismaUser,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
} from '@prisma/client';
import { User } from 'src/modules/iam/domain/entities/user.entity';
import { UserRole } from 'src/modules/iam/domain/enums/user-role.enum';
import { UserStatus } from 'src/modules/iam/domain/enums/user-status.enum';
import { ERROR_MESSAGES } from '../../constants/mapper.constants';

export class UserMapper {
  private static mapRoleToPrisma(role: UserRole): PrismaUserRole {
    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`${ERROR_MESSAGES.UNSUPPORTED_ROLE}: ${role}`);
    }
    switch (role) {
      case UserRole.USER:
        return PrismaUserRole.USER;
      case UserRole.ADMIN:
        return PrismaUserRole.ADMIN;
      case UserRole.SUPPORT:
        return PrismaUserRole.SUPPORT;
      default:
        throw new Error(
          `${ERROR_MESSAGES.UNSUPPORTED_ROLE}: ${role as string}`,
        );
    }
  }

  private static mapStatusToPrisma(status: UserStatus): PrismaUserStatus {
    switch (status) {
      case UserStatus.PENDING:
        return PrismaUserStatus.PENDING;
      case UserStatus.ACTIVE:
        return PrismaUserStatus.ACTIVE;
      case UserStatus.SUSPENDED:
        return PrismaUserStatus.SUSPENDED;
      case UserStatus.DELETED:
        return PrismaUserStatus.DELETED;
      default:
        throw new Error(
          `${ERROR_MESSAGES.UNSUPPORTED_STATUS}: ${status as string}`,
        );
    }
  }

  private static mapRoleToDomain(role: PrismaUserRole): UserRole {
    switch (role) {
      case PrismaUserRole.USER:
        return UserRole.USER;
      case PrismaUserRole.ADMIN:
        return UserRole.ADMIN;
      case PrismaUserRole.SUPPORT:
        return UserRole.SUPPORT;
      default:
        throw new Error(
          `${ERROR_MESSAGES.UNSUPPORTED_PRISMA_ROLE}: ${role as string}`,
        );
    }
  }

  private static mapStatusToDomain(status: PrismaUserStatus): UserStatus {
    switch (status) {
      case PrismaUserStatus.PENDING:
        return UserStatus.PENDING;
      case PrismaUserStatus.ACTIVE:
        return UserStatus.ACTIVE;
      case PrismaUserStatus.SUSPENDED:
        return UserStatus.SUSPENDED;
      case PrismaUserStatus.DELETED:
        return UserStatus.DELETED;
      default:
        throw new Error(
          `${ERROR_MESSAGES.UNSUPPORTED_PRISMA_STATUS}: ${status as string}`,
        );
    }
  }

  static toDomain(prismaUser: PrismaUser): User {
    return User.restore(
      prismaUser.id,
      prismaUser.email,
      prismaUser.fullName,
      this.mapRoleToDomain(prismaUser.role),
      this.mapStatusToDomain(prismaUser.status),
      prismaUser.emailVerifiedAt,
      prismaUser.createdAt,
      prismaUser.updatedAt,
      prismaUser.deletedAt,
    );
  }

  static toCreateInput(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? null,
      role: this.mapRoleToPrisma(user.role),
      status: this.mapStatusToPrisma(user.status),
      emailVerifiedAt: user.emailVerifiedAt ?? null,
    };
  }

  static toUpdateInput(user: User): Prisma.UserUpdateInput {
    // usar undefined para campos no presentes evita sobrescribir con null
    const update: Prisma.UserUpdateInput = {
      email: user.email,
      fullName: user.fullName ?? undefined,
      role: user.role ? this.mapRoleToPrisma(user.role) : undefined,
      status: user.status ? this.mapStatusToPrisma(user.status) : undefined,
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
    };
    return update;
  }
}
