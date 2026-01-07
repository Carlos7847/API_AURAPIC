import { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import { AuditAction } from '../../domain/constants/audit.constants';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  ip?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  constructor(
    private readonly auditRepository: AuditLogRepositoryPort,
    private readonly loggerService: LoggerPort,
  ) {}

  async log(data: CreateAuditLogDto): Promise<void> {
    try {
      this.loggerService.log('creating audit log', AuditService.name);

      await this.auditRepository.save({
        userId: data.userId,
        action: data.action,
        ip: data.ip,
        metadata: data.metadata,
      });
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.loggerService.error(`Error creating audit log: ${message}`, trace);
    }
  }
}
