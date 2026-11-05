import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError, ErrorCodes } from '../errors/app-error';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthUserContext } from '../../auth/auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUserContext }>();
    const user = request.user;
    if (!user) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        401,
      );
    }

    const granted = new Set(user.permissions);
    const ok = required.every((p) => granted.has(p));
    if (!ok) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        'You do not have permission to perform this action',
        403,
        { required },
      );
    }
    return true;
  }
}
