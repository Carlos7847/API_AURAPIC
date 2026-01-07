import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserData } from '../../domain/interfaces/active-user.interface';

export const ActiveUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ActiveUserData => {
    const request = ctx.switchToHttp().getRequest<{ user: ActiveUserData }>();
    return request.user;
  },
);
