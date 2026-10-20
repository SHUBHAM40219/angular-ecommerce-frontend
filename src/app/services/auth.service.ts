import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AuthRole = 'ADMIN' | 'VENDOR' | 'CUSTOMER';

export interface AppUser {
  id?: number | string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: AuthRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly currentUserSubject = new BehaviorSubject<AppUser | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private normalizeRole(role: any): string {
    return String(role || 'CUSTOMER').trim().toUpperCase();
  }

  private getStoredUser(): AppUser | null {
    const rawUser = localStorage.getItem('currentUser');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      const email = decoded.email || decoded.sub || decoded.username || '';
      const role = this.normalizeRole(decoded.role || localStorage.getItem('userRole') || 'CUSTOMER');

      if (!email) {
        return null;
      }

      return {
        email,
        name: this.getDisplayNameFromEmail(email),
        role,
        avatar: null
      };
    } catch (error) {
      return null;
    }
  }

  private getDisplayNameFromEmail(email: string): string {
    if (!email) {
      return 'User';
    }

    const localName = email.split('@')[0] || 'User';
    const formatted = localName
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return formatted ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : 'User';
  }

  private updateCurrentUser(user: AppUser | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.role) {
        localStorage.setItem('userRole', user.role.toLowerCase());
      }
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userRole');
    }
  }

  restoreSession(): void {
    const existingUser = this.getStoredUser();
    this.currentUserSubject.next(existingUser);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  setAuthenticatedUser(response: any): AppUser | null {
    const data = response?.data ?? response ?? {};
    const userData = data.user ?? data;
    const token = data.accessToken ?? response?.accessToken ?? localStorage.getItem('authToken');

    if (token) {
      localStorage.setItem('authToken', token);
    }

    const email = userData.email ?? data.email ?? this.currentUserSubject.value?.email ?? '';
    const user: AppUser = {
      id: userData.id ?? data.id ?? null,
      email,
      name: userData.name || userData.fullName || userData.full_name || this.getDisplayNameFromEmail(email || 'user@shoppy.com'),
      role: this.normalizeRole(userData.role ?? data.role ?? localStorage.getItem('userRole') ?? 'CUSTOMER'),
      avatar: userData.avatar ?? userData.profileImage ?? userData.profile_image ?? null
    };

    this.updateCurrentUser(user);
    return user;
  }

  clearSession(): void {
    localStorage.removeItem('authToken');
    this.updateCurrentUser(null);
  }

  logout(): void {
    this.clearSession();
  }

  login(payload: LoginRequest): Observable<any> {
    const requestBody = {
      email: payload.email,
      password: payload.password,
      role: payload.role.toUpperCase()
    };
    return this.http.post(`${this.apiUrl}/auth/login`, requestBody);
  }

  registerVendor(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-vendor`, payload);
  }

  registerCustomer(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-customer`, payload);
  }
}
