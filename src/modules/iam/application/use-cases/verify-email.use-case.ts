import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';
import { DateServicePort } from 'src/shared/date/domain/date.service.port';

export class VerifyEmailUseCase {
  constructor(
    private readonly authCredentialRepository: AuthCredentialRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingServicePort,
    private readonly dateService: DateServicePort,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = await this.hashingService.hashToken(rawToken);

    // 2. Buscar la credencial asociada a ese token
    const credential =
      await this.authCredentialRepository.findByEmailVerificationToken(
        tokenHash,
      );

    if (!credential) {
      // por security no se revela si el token no existe o qué pasó exactamente
      throw new InvalidTokenError();
    }

    // 3. Validar Expiración
    if (!credential.emailVerificationExpiresAt) {
      throw new InvalidTokenError(); // maybe caso raro: hay token pero no fecha
    }

    const isExpired = this.dateService.isAfter(
      this.dateService.now(),
      credential.emailVerificationExpiresAt,
    );

    if (isExpired) {
      // se podría lanzar un TokenExpiredError específico si se pide al front que pida uno nuevo
      throw new InvalidTokenError();
    }

    // 4. Marcar el usuario como verificado
    await this.userRepository.verifyEmail(credential.userId);

    // 5. Eliminar el token usado para evitar ataques de replay
    await this.authCredentialRepository.updateEmailVerificationToken(
      credential.userId,
      null,
      null,
    );
  }
}
