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
    // 1. Hashear el token recibido para buscarlo en la DB
    // (Recuerda: En DB guardamos el hash, en el email enviamos el raw)
    const tokenHash = await this.hashingService.hashToken(rawToken);

    // 2. Buscar la credencial asociada a ese token
    const credential =
      await this.authCredentialRepository.findByEmailVerificationToken(
        tokenHash,
      );

    if (!credential) {
      // Security: No reveles si el token no existe o qué pasó exactamente
      throw new InvalidTokenError();
    }

    // 3. Validar Expiración (Lógica de Dominio)
    // Aquí usamos los campos que agregaste recientemente a la Entidad y Repositorio
    if (!credential.emailVerificationExpiresAt) {
      throw new InvalidTokenError(); // Caso raro: hay token pero no fecha
    }

    const isExpired = this.dateService.isAfter(
      this.dateService.now(),
      credential.emailVerificationExpiresAt,
    );

    if (isExpired) {
      // Opcional: Podrías lanzar un TokenExpiredError específico si quieres que el front pida uno nuevo
      throw new InvalidTokenError();
    }

    // 4. Marcar el usuario como verificado
    // Necesitas agregar este método en tu UserRepositoryPort si no existe
    await this.userRepository.verifyEmail(credential.userId);

    // 5. Limpieza: Eliminar el token usado para evitar ataques de replay
    // Pasamos null para borrar el token y la fecha
    await this.authCredentialRepository.updateEmailVerificationToken(
      credential.userId,
      null,
      null,
    );
  }
}
