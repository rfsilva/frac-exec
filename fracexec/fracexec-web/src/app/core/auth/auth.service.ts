import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, Role, User } from '../models/user.model';

const ACCESS_TOKEN_KEY  = 'fracexec_access_token';
const REFRESH_TOKEN_KEY = 'fracexec_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiBase = '/api/v1/auth';

  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  readonly currentUser  = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/login`, { email, password }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(email: string, password: string, role: Role): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/register`, { email, password, role }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    // P9: null guard — se não há token armazenado, fazer logout imediatamente
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }
    return this.http.post<AuthResponse>(`${this.apiBase}/refresh`, { refreshToken }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBase}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBase}/reset-password`, { token, newPassword });
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // B3: invalidar cache do profileGuard ao fazer logout
    localStorage.removeItem('fracexec_profile_complete');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  redirectToPortal(role: Role): void {
    const routes: Record<Role, string> = {
      EXECUTIVE: '/executive',
      PME:       '/company',
      ADMIN:     '/admin',
    };
    this.router.navigate([routes[role]]);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    this._currentUser.set({ email: res.email, role: res.role });
  }

  private loadUserFromStorage(): User | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      if (Date.now() >= exp) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        return null;
      }
      return { email: payload.sub, role: payload.role as Role };
    } catch {
      return null;
    }
  }
}
