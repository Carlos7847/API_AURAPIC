import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import {
  AuditLogRepositoryPort,
  AuditLogData,
} from '../../domain/ports/audit-log.repository.port';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: AuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        ip: data.ip,
        metadata: data.metadata || {},
      },
    });
  }
}
