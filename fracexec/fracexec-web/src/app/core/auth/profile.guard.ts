import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

// AC-6: redireciona para /executive/profile?banner=true se perfil incompleto
export const profileGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const http   = inject(HttpClient);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);

  // B3: lê cache para evitar chamada HTTP em cada navegação
  const cached = localStorage.getItem('fracexec_profile_complete');
  if (cached === 'true') return true;

  return http.get<{ complete: boolean }>('/api/v1/executive/profile/complete').pipe(
    map(res => {
      if (res.complete) {
        localStorage.setItem('fracexec_profile_complete', 'true');
        return true;
      }
      return router.createUrlTree(['/executive/profile'], { queryParams: { banner: 'true' } });
    }),
    catchError((err: HttpErrorResponse) => {
      // B3: 401/403 → redirecionar para login em vez de conceder acesso
      if (err.status === 401 || err.status === 403) {
        auth.logout();
        return of(router.createUrlTree(['/login']));
      }
      // Erros transientes (rede, 5xx) → fail open para não bloquear o executivo
      return of(true);
    })
  );
};
