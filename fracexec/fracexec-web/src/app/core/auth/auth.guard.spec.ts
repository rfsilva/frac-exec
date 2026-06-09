import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Role } from '../models/user.model';

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );
}

describe('authGuard', () => {
  let authSpy: { isAuthenticated: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSpy = { isAuthenticated: vi.fn().mockReturnValue(false) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([{ path: 'login', component: class {} as any }]),
      ],
    });
  });

  it('redireciona para /login se não autenticado', () => {
    const result = runGuard();
    expect(result instanceof UrlTree).toBeTruthy();
    expect((result as UrlTree).toString()).toContain('login');
  });

  it('permite acesso se autenticado', () => {
    authSpy.isAuthenticated.mockReturnValue(true);
    const result = runGuard();
    expect(result).toBe(true);
  });
});
