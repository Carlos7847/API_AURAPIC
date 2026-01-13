import { Module } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';

import { HashingServicePort } from './domain/ports/hashing.service.port';
import { UserRepositoryPort } from './domain/ports/user.repository.port';

import { Argon2HashingService } from './infrastructure/adapters/argon2-hashing.service';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';

import { AuthController } from './infrastructure/http/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthCredentialRepositoryPort } from './domain/ports/auth-credential.repository.port';
import { PrismaAuthCredentialRepository } from './infrastructure/persistence/prisma-auth-credential.repository';
import { TokenServicePort } from './domain/ports/token.service.port';
import { JwtTokenService } from './infrastructure/adapters/jwt-token.service';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { SessionRepositoryPort } from './domain/ports/session.repository.port';
import { PrismaSessionRepository } from './infrastructure/persistence/prisma-session.repository';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { AuditService } from './application/services/audit.service';
import { AuditLogRepositoryPort } from './domain/ports/audit-log.repository.port';
import { PrismaAuditLogRepository } from './infrastructure/persistence/prisma-audit-log.repository';
import { LoggerService } from 'src/shared/logger/infrastructure/logger.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { EnvironmentConfigModule } from 'src/shared/config/infrastructure/environment-config.module';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { EmailServicePort } from 'src/shared/email/domain/ports/email.service.port';
import { DateServicePort } from 'src/shared/date/domain/date.service.port';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { EmailModule } from 'src/shared/email/email.module';
import { DateModule } from 'src/shared/date/date.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret-temporal-para-desarrollo',
      signOptions: { expiresIn: '1h' },
    }),
    EnvironmentConfigModule,
    EmailModule,
    DateModule,
  ],
  controllers: [AuthController],
  providers: [
    LoggerService,
    PrismaService,
    JwtStrategy,

    {
      provide: HashingServicePort,
      useClass: Argon2HashingService,
    },
    {
      provide: UserRepositoryPort,
      useClass: PrismaUserRepository,
    },
    {
      provide: TokenServicePort,
      useClass: JwtTokenService,
    },
    {
      provide: SessionRepositoryPort,
      useClass: PrismaSessionRepository,
    },
    {
      provide: AuthCredentialRepositoryPort,
      useClass: PrismaAuthCredentialRepository,
    },
    {
      provide: AuditLogRepositoryPort,
      useClass: PrismaAuditLogRepository,
    },
    // Binding de los Casos de Uso
    {
      provide: RegisterUserUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        hashingService: HashingServicePort,
        authCredentialRepository: AuthCredentialRepositoryPort,
        emailService: EmailServicePort,
        dateService: DateServicePort,
        appConfig: EnvironmentConfigService,
      ) => {
        return new RegisterUserUseCase(
          userRepo,
          hashingService,
          authCredentialRepository,
          emailService,
          dateService,
          appConfig,
        );
      },
      inject: [
        UserRepositoryPort,
        HashingServicePort,
        AuthCredentialRepositoryPort,
        EmailServicePort,
        DateServicePort,
        EnvironmentConfigService,
      ],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        credRepo: AuthCredentialRepositoryPort,
        hashing: HashingServicePort,
        token: TokenServicePort,
        sessionRepo: SessionRepositoryPort,
        auditService: AuditService,
      ) => {
        return new LoginUserUseCase(
          userRepo,
          credRepo,
          hashing,
          token,
          sessionRepo,
          auditService,
        );
      },
      inject: [
        UserRepositoryPort,
        AuthCredentialRepositoryPort,
        HashingServicePort,
        TokenServicePort,
        SessionRepositoryPort,
        AuditService,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        tokenService: TokenServicePort,
        sessionRepository: SessionRepositoryPort,
        hashingService: HashingServicePort,
      ) => {
        return new RefreshTokenUseCase(
          tokenService,
          sessionRepository,
          hashingService,
        );
      },
      inject: [TokenServicePort, SessionRepositoryPort, HashingServicePort],
    },
    {
      provide: LogoutUseCase,
      useFactory: (
        sessionRepo: SessionRepositoryPort,
        hashingService: HashingServicePort,
      ) => {
        return new LogoutUseCase(sessionRepo, hashingService);
      },
      inject: [SessionRepositoryPort, HashingServicePort],
    },
    {
      provide: AuditService,
      useFactory: (
        auditRepo: AuditLogRepositoryPort,
        logger: LoggerService,
      ) => {
        return new AuditService(auditRepo, logger);
      },
      inject: [AuditLogRepositoryPort, LoggerService],
    },
    {
      provide: ForgotPasswordUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        credRepo: AuthCredentialRepositoryPort,
        emailService: EmailServicePort,
        hashingService: HashingServicePort,
      ) => {
        return new ForgotPasswordUseCase(
          userRepo,
          credRepo,
          emailService,
          hashingService,
        );
      },
      inject: [
        UserRepositoryPort,
        AuthCredentialRepositoryPort,
        EmailServicePort,
        HashingServicePort,
      ],
    },

    {
      provide: ResetPasswordUseCase,
      useFactory: (
        credRepo: AuthCredentialRepositoryPort,
        hashingService: HashingServicePort,
        sessionRepo: SessionRepositoryPort,
      ) => {
        return new ResetPasswordUseCase(credRepo, hashingService, sessionRepo);
      },
      inject: [
        AuthCredentialRepositoryPort,
        HashingServicePort,
        SessionRepositoryPort,
      ],
    },
    {
      provide: VerifyEmailUseCase,
      useFactory: (
        authCredentialRepository: AuthCredentialRepositoryPort,
        userRepository: UserRepositoryPort,
        hashingService: HashingServicePort,
        dateService: DateServicePort,
      ) => {
        return new VerifyEmailUseCase(
          authCredentialRepository,
          userRepository,
          hashingService,
          dateService,
        );
      },
      inject: [
        AuthCredentialRepositoryPort,
        UserRepositoryPort,
        HashingServicePort,
        DateServicePort,
      ],
    },
  ],
  exports: [
    TokenServicePort,
    HashingServicePort,
    UserRepositoryPort,
    SessionRepositoryPort,
    AuthCredentialRepositoryPort,
    AuditService,
  ],
})
export class IamModule {}
