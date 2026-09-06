import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/api.models';

interface StoredSession {
  token: string;
  expiresAt: number;
  user: UserProfile;
}

/**
 * Holds the JWT session. The token lives in sessionStorage (cleared when the tab closes) rather
 * than localStorage, and only non-sensitive profile fields are kept next to it.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly STORAGE_KEY = 'eka.session';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<StoredSession | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => {
    const current = this.session();
    return !!current && current.expiresAt > Date.now();
  });
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  get token(): string | null {
    const current = this.session();
    return current && current.expiresAt > Date.now() ? current.token : null;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request)
      .pipe(tap(response => this.store(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, request)
      .pipe(tap(response => this.store(response)));
  }

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiBaseUrl}/auth/me`);
  }

  logout(reason?: 'expired' | 'manual'): void {
    this.session.set(null);
    this.clearStorage();
    void this.router.navigate(['/login'], reason === 'expired' ? { queryParams: { reason: 'expired' } } : {});
  }

  private store(response: AuthResponse): void {
    const expiresAt = this.expiryFromToken(response.accessToken) ?? Date.now() + response.expiresIn * 1000;
    const stored: StoredSession = { token: response.accessToken, expiresAt, user: response.user };
    this.session.set(stored);
    try {
      sessionStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage may be unavailable (private mode); the in-memory session still works for this tab.
    }
  }

  private restore(): StoredSession | null {
    try {
      const raw = sessionStorage.getItem(AuthService.STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as StoredSession;
      return parsed.expiresAt > Date.now() ? parsed : null;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    try {
      sessionStorage.removeItem(AuthService.STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }

  /** Reads the exp claim without verifying the signature (verification happens on the server). */
  private expiryFromToken(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const exp = (JSON.parse(json) as { exp?: number }).exp;
      return exp ? exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
