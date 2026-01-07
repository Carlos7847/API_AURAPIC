import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/enums/user-role.enum';
import { ActiveUserData } from '../../domain/interfaces/active-user.interface';

// interface RequestWithUser {
//   user: {
//     userId: string;
//     email: string;
//     role: UserRole;
//   };
// }

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Leer los roles requeridos desde el decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    // Obtener el usuario del request (inyectado por JwtStrategy)
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: ActiveUserData }>();

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado en la solicitud.');
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
