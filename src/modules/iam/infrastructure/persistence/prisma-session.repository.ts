import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { Session } from '../../domain/entities/session.entity';
import { Session as PrismaSession } from '@prisma/client';

@Injectable()
export class PrismaSessionRepository implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(session: Session): Promise<Session> {
    const savedSession = await this.prisma.session.create({
      data: {
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    });

    return this.mapToDomain(savedSession);
  }

  async findByTokenHash(hash: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hash },
    });
    return session ? this.mapToDomain(session) : null;
  }

  async update(session: Session): Promise<void> {
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        tokenHash: session.tokenHash,
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
      },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });
    return sessions.map((s) => this.mapToDomain(s));
  }

  async findById(id: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });
    return session ? this.mapToDomain(session) : null;
  }

  async revokeById(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  private mapToDomain(prismaSession: PrismaSession): Session {
    return new Session(
      prismaSession.id,
      prismaSession.userId,
      prismaSession.tokenHash,
      prismaSession.expiresAt,
      prismaSession.createdAt,
      prismaSession.lastActiveAt,
      prismaSession.deviceInfo,
      prismaSession.ipAddress,
      prismaSession.userAgent,
      prismaSession.revokedAt,
      prismaSession.replacedById,
    );
  }
}
