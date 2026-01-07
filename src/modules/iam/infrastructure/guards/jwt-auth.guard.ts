import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ActiveUserData } from '../../domain/interfaces/active-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  override handleRequest<TUser = ActiveUserData>(
    err: Error | null,
    user: TUser | false,
    info: JsonWebTokenError | TokenExpiredError | Error | undefined,
    // context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'El token ha expirado, por favor inicia sesión nuevamente',
        );
      }

      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Token inválido o malformado');
      }

      throw err || new UnauthorizedException('No autorizado');
    }

    return user;
  }
}
