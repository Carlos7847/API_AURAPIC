import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { Session } from '../../domain/entities/session.entity';

export class ListUserSessionsUseCase {
  constructor(private readonly sessionRepository: SessionRepositoryPort) {}

  async execute(userId: string): Promise<Session[]> {
    return this.sessionRepository.findByUserId(userId);
  }
}
