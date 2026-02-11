import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { SessionNotFoundError } from '../../domain/errors/session-not-found.error';
import { UnauthorizedSessionAccessError } from '../../domain/errors/unauthorized-session-access.error';

/**
 * Revoke Session Use Case
 *
 * Allows a user to revoke (invalidate) one of their sessions.
 * Validates that the session exists and belongs to the authenticated user.
 */
export class RevokeSessionUseCase {
  constructor(private readonly sessionRepository: SessionRepositoryPort) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new SessionNotFoundError();
    }

    // Security: Ensure user can only revoke their own sessions
    if (session.userId !== userId) {
      throw new UnauthorizedSessionAccessError();
    }

    await this.sessionRepository.revokeById(sessionId);
  }
}
