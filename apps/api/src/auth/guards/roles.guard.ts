import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

export interface RequestUser {
  id:        string;
  username:  string;
  role:      Role;
  companyId: string | null;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — any authenticated user can access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req  = context.switchToHttp().getRequest();
    const user = req.user as RequestUser;

    if (!user) throw new ForbiddenException('Access denied.');

    // ── Role check ───────────────────────────────────────────────────────────
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `This action requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    // ── Company isolation ────────────────────────────────────────────────────
    // SUPER_ADMIN can access everything — skip isolation check
    if (user.role === Role.SUPER_ADMIN) return true;

    // All other roles MUST belong to a company
    if (!user.companyId) {
      throw new ForbiddenException('Your account is not assigned to a company.');
    }

    // If the request targets a specific company (via :companyId param or
    // x-company-id header), enforce that the user belongs to that company
    const targetCompanyId =
      req.params?.companyId ||
      req.headers?.['x-company-id'];

    if (targetCompanyId && targetCompanyId !== user.companyId) {
      throw new ForbiddenException('You do not have access to this company.');
    }

    return true;
  }
}
