import { RegisterUserDto } from '../dtos/register-user.dto';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import { User } from '../../domain/entities/user.entity';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { randomUUID } from 'node:crypto';
import { EmailServicePort } from 'src/shared/email/domain/ports/email.service.port';
import { DateServicePort } from 'src/shared/date/domain/date.service.port';
import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { verifyEmailTemplate } from 'src/shared/email/infrastructure/templates/verify-email.template';
import * as crypto from 'node:crypto';
import { IAppConfig } from 'src/shared/config/domain/app.interface';
import { SubscriptionRepositoryPort } from 'src/modules/billing/domain/ports/subscription.repository.port';
import { Subscription } from 'src/modules/billing/domain/entities/subscription.entity';
import { SubscriptionCreationFailedError } from 'src/modules/billing/domain/errors/billing.errors';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingServicePort,
    private readonly authCredentialRepository: AuthCredentialRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly dateService: DateServicePort,
    private readonly appConfig: IAppConfig,
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ id: string; email: string }> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(dto.email);
    }

    const passwordHash = await this.hashingService.hash(dto.password);
    const userId = randomUUID();
    const newUser = User.create(userId, dto.email, dto.fullName);

    const savedUser = await this.userRepository.createWithPassword(
      newUser,
      passwordHash,
    );
    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = await this.hashingService.hashToken(rawToken);

    // expiración => 24 horas desde ahora
    const expiresAt = this.dateService.add(this.dateService.now(), 24, 'hour');

    await this.authCredentialRepository.updateEmailVerificationToken(
      savedUser.id,
      tokenHash,
      expiresAt,
    );

    try {
      await this.sendVerificationEmail(savedUser.email, rawToken);
    } catch (error) {
      // If email fails, rollback user creation
      await this.userRepository.delete(savedUser.id);
      throw error;
    }

    // Create free subscription with initial credits
    try {
      const subscription = Subscription.createFree(savedUser.id, randomUUID());
      await this.subscriptionRepository.create(subscription);
    } catch (_error) {
      // If subscription creation fails, rollback user
      await this.userRepository.delete(savedUser.id);
      throw new SubscriptionCreationFailedError(savedUser.id, _error);
    }

    return {
      id: savedUser.id,
      email: savedUser.email,
    };
  }

  private async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.appConfig.getFrontendUrl();

    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    await this.emailService.send({
      to: email,
      subject: 'Bienvenido - Verifica tu cuenta',
      html: verifyEmailTemplate(verificationLink),
    });
  }
}
