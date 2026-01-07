import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly hashingService: HashingServicePort,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<void> {
    const hash = await this.hashingService.hashToken(dto.refreshToken);

    const session = await this.sessionRepository.findByTokenHash(hash);
    if (!session) return;

    const revokedSession = session.revoke();

    await this.sessionRepository.update(revokedSession);
  }
}
