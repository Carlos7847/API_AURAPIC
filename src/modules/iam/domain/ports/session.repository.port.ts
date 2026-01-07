import { Session } from '../entities/session.entity';

export abstract class SessionRepositoryPort {
  abstract save(session: Session): Promise<Session>;
  abstract findByTokenHash(hash: string): Promise<Session | null>;
  abstract update(session: Session): Promise<void>;
  abstract deleteByUserId(userId: string): Promise<void>;
}
