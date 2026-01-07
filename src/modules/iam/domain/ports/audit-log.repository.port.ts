import { AuditAction } from '../constants/audit.constants';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  ip?: string;
  metadata?: Record<string, any>;
}

export abstract class AuditLogRepositoryPort {
  abstract save(data: AuditLogData): Promise<void>;
}
