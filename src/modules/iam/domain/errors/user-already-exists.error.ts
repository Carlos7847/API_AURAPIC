import { AuthErrors } from '../constants/iam.constants';

export class UserAlreadyExistsError extends Error {
  constructor(identifier: string) {
    super(`${AuthErrors.USER_ALREADY_EXISTS}: ${identifier}`);
    this.name = 'UserAlreadyExistsError';
  }
}
