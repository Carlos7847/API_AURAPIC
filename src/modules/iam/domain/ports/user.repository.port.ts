import { User } from '../entities/user.entity';

export abstract class UserRepositoryPort {
  abstract createWithPassword(user: User, passwordHash: string): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmailWithCredentials(email: string): Promise<User | null>;
  abstract verifyEmail(id: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
