export type Role = 'EXECUTIVE' | 'PME' | 'ADMIN';

export interface User {
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: Role;
  email: string;
}
