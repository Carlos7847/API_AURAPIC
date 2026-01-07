import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { User as PrismaUser } from '@prisma/client';
import { AuthProvider } from '@prisma/client';
import { UserStatus as PrismaUserStatus } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createWithPassword(user: User, passwordHash: string): Promise<User> {
    const userData = UserMapper.toCreateInput(user);

    // // TRANSACCIÓN ATÓMICA
    // const result = await this.prisma.$transaction(async (tx) => {
    //   // 1. Crear el Usuario
    //   const createdUser = await tx.user.create({
    //     data: {
    //       ...userData,
    //       // 2. Crear la Credencial vinculada automáticamente
    //       credentials: {
    //         create: {
    //           provider: AuthProvider.EMAIL, // Asumimos EMAIL para registro normal
    //           providerUserId: user.email, // Para provider EMAIL, el ID es el email
    //           passwordHash: passwordHash,
    //           tfaEnabled: false,
    //         },
    //       },
    //     },
    //   });
    //   return createdUser;
    // });

    const savedUser = await this.prisma.user.create({
      data: {
        ...userData,
        // Nested Write
        credentials: {
          create: {
            provider: AuthProvider.EMAIL,
            providerUserId: user.email,
            passwordHash: passwordHash,
          },
        },
      },
    });

    return UserMapper.toDomain(savedUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user: PrismaUser | null = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;
    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user: PrismaUser | null = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;
    return UserMapper.toDomain(user);
  }

  async findByEmailWithCredentials(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
      include: { credentials: true, sessions: true },
    });

    if (!prismaUser) return null;
    return UserMapper.toDomain(prismaUser);
  }

  async verifyEmail(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerifiedAt: new Date(),
        status: PrismaUserStatus.ACTIVE,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
