import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { Role } from '../models/user.model';

function runGuard(roles: Role[] = []) {
  const route = { data: { roles } } as unknown as ActivatedRouteSnapshot;
  return TestBed.runInInjectionContext(() =>
    roleGuard(route, {} as RouterStateSnapshot)
  );
}

describe('roleGuard', () => {
  let authSpy: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSpy = { currentUser: vi.fn().mockReturnValue(null) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([
          { path: 'login',     component: class {} as any },
          { path: 'executive', component: class {} as any },
          { path: 'company',   component: class {} as any },
          { path: 'admin',     component: class {} as any },
        ]),
      ],
    });
  });

  it('redireciona para /login se não autenticado', () => {
    const result = runGuard();
    expect(result instanceof UrlTree).toBeTruthy();
    expect((result as UrlTree).toString()).toContain('login');
  });

  it('permite acesso se role vazia (apenas auth)', () => {
    authSpy.currentUser.mockReturnValue({ email: 'u@t.com', role: 'EXECUTIVE' as Role });
    const result = runGuard([]);
    expect(result).toBe(true);
  });

  it('permite acesso se role do usuário está na lista', () => {
    authSpy.currentUser.mockReturnValue({ email: 'u@t.com', role: 'EXECUTIVE' as Role });
    const result = runGuard(['EXECUTIVE' as Role]);
    expect(result).toBe(true);
  });

  it('redireciona ao portal correto se role não permitida', () => {
    authSpy.currentUser.mockReturnValue({ email: 'u@t.com', role: 'PME' as Role });
    const result = runGuard(['EXECUTIVE' as Role, 'ADMIN' as Role]);
    expect(result instanceof UrlTree).toBeTruthy();
    expect((result as UrlTree).toString()).toContain('company');
  });

  it('redireciona ADMIN ao portal /admin', () => {
    authSpy.currentUser.mockReturnValue({ email: 'a@t.com', role: 'ADMIN' as Role });
    const result = runGuard(['EXECUTIVE' as Role]);
    expect((result as UrlTree).toString()).toContain('admin');
  });
});
