import { HttpStatus } from '@nestjs/common';
import {
  IamErrorCode,
  IamErrorCodes,
} from 'src/modules/iam/domain/constants/iam.constants';
import { AccountLockedError } from 'src/modules/iam/domain/errors/account-locked.error';
import { AccountSuspendedError } from 'src/modules/iam/domain/errors/account-suspended.error';
import { EmailNotVerifiedError } from 'src/modules/iam/domain/errors/email-not-verified.error';
import { InvalidCredentialsError } from 'src/modules/iam/domain/errors/invalid-credentials.error';
import { InvalidTfaCodeError } from 'src/modules/iam/domain/errors/invalid-tfa-code.error';
import { InvalidTokenError } from 'src/modules/iam/domain/errors/invalid-token.error';
import { PasswordResetTokenExpiredError } from 'src/modules/iam/domain/errors/password-reset-token-expired.error';
import { TfaRequiredError } from 'src/modules/iam/domain/errors/tfa-required.error';
import { TokenReuseDetectedError } from 'src/modules/iam/domain/errors/token-reuse-detected.error';
import { UserAlreadyExistsError } from 'src/modules/iam/domain/errors/user-already-exists.error';
import { WeakPasswordError } from 'src/modules/iam/domain/errors/weak-password.error';
import { SessionNotFoundError } from 'src/modules/iam/domain/errors/session-not-found.error';
import { UnauthorizedSessionAccessError } from 'src/modules/iam/domain/errors/unauthorized-session-access.error';
import { QueryParameterRequiredError } from 'src/modules/jobs/domain/errors/job.exceptions';
import {
  SystemErrorCode,
  SystemErrorCodes,
} from '../constants/domain/error.constants';

export type ErrorClass = new (...args: any[]) => any;

export interface ErrorResponseConfig {
  status: HttpStatus;
  code: IamErrorCode | SystemErrorCode;
  message?: string;
}

export const ERROR_MAPPING = new Map<ErrorClass, ErrorResponseConfig>([
  // de clase del Error -> Configuración HTTP
  [
    UserAlreadyExistsError,
    {
      status: HttpStatus.CONFLICT,
      code: IamErrorCodes.USER_ALREADY_EXISTS,
    },
  ],
  [
    InvalidCredentialsError,
    {
      status: HttpStatus.UNAUTHORIZED,
      code: IamErrorCodes.INVALID_CREDENTIALS,
    },
  ],
  [
    EmailNotVerifiedError,
    {
      status: HttpStatus.FORBIDDEN,
      code: IamErrorCodes.AUTH_EMAIL_NOT_VERIFIED,
    },
  ],
  [
    AccountSuspendedError,
    {
      status: HttpStatus.FORBIDDEN,
      code: IamErrorCodes.AUTH_ACCOUNT_SUSPENDED,
    },
  ],
  [
    InvalidTokenError,
    {
      status: HttpStatus.UNAUTHORIZED,
      code: IamErrorCodes.AUTH_TOKEN_INVALID,
    },
  ],
  [
    TfaRequiredError,
    {
      status: HttpStatus.FORBIDDEN,
      code: IamErrorCodes.AUTH_TFA_REQUIRED,
    },
  ],
  [
    InvalidTfaCodeError,
    {
      status: HttpStatus.UNAUTHORIZED,
      code: IamErrorCodes.AUTH_TFA_CODE_INVALID,
    },
  ],
  [
    WeakPasswordError,
    {
      status: HttpStatus.BAD_REQUEST,
      code: IamErrorCodes.AUTH_PASSWORD_WEAK,
    },
  ],
  [
    AccountLockedError,
    {
      status: HttpStatus.TOO_MANY_REQUESTS,
      code: IamErrorCodes.ACCOUNT_LOCKED,
    },
  ],
  [
    TokenReuseDetectedError,
    {
      status: HttpStatus.FORBIDDEN,
      // code: 'TOKEN_REUSE_DETECTED',
      code: IamErrorCodes.AUTH_TOKEN_REUSE_DETECTED,
    },
  ],
  [
    PasswordResetTokenExpiredError,
    {
      status: HttpStatus.UNAUTHORIZED, // o HttpStatus.BAD_REQUEST
      code: IamErrorCodes.AUTH_PASSWORD_RESET_TOKEN_EXPIRED,
    },
  ],
  [
    QueryParameterRequiredError,
    {
      status: HttpStatus.BAD_REQUEST,
      code: SystemErrorCodes.QUERY_PARAM_REQUIRED,
      message: 'Parámetro de búsqueda requerido.',
    },
  ],
  [
    SessionNotFoundError,
    {
      status: HttpStatus.NOT_FOUND,
      code: IamErrorCodes.AUTH_SESSION_NOT_FOUND,
      message: 'Sesión no encontrada.',
    },
  ],
  [
    UnauthorizedSessionAccessError,
    {
      status: HttpStatus.FORBIDDEN,
      code: IamErrorCodes.AUTH_FORBIDDEN,
      message: 'No tienes permiso para acceder a esta sesión.',
    },
  ],
]);
