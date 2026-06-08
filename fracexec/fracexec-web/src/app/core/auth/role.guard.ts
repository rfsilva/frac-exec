import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../models/user.model';

const PORTAL_BY_ROLE: Record<Role, string> = {
  EXECUTIVE: '/executive',
  PME:       '/company',
  ADMIN:     '/admin',
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.currentUser();

  if (!user) return router.createUrlTree(['/login']);

  const allowedRoles: Role[] = route.data['roles'] ?? [];
  // Empty allowedRoles = route requires auth but no specific role (intentional for shared pages).
  // Routes that need role protection MUST declare data: { roles: ['ROLE'] }.
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) return true;

  // AC-7: redireciona ao portal correto do role do usuário (não apenas bloqueia)
  return router.createUrlTree([PORTAL_BY_ROLE[user.role] ?? '/login']);
};
