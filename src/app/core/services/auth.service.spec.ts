import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthResponse } from '../models/api.models';
import { AuthService } from './auth.service';

function token(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ sub: 'user-1', exp: expSeconds })).replace(/=+$/, '');
  return `header.${payload}.signature`;
}

function authResponse(accessToken: string): AuthResponse {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: { id: 'user-1', email: 'jane@example.com', displayName: 'Jane', role: 'USER', createdAt: '2026-01-01T00:00:00Z' }
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', children: [] }])]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('stores the session after login and exposes the token', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    service.login({ email: 'jane@example.com', password: 'Passw0rd!' }).subscribe();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush(authResponse(token(future)));

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token).toBe(token(future));
    expect(service.user()?.email).toBe('jane@example.com');
    expect(sessionStorage.getItem('eka.session')).toContain('jane@example.com');
  });

  it('treats an expired token as unauthenticated', () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    service.login({ email: 'jane@example.com', password: 'Passw0rd!' }).subscribe();
    http.expectOne('/api/auth/login').flush(authResponse(token(past)));

    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
  });

  it('clears the session on logout', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    service.register({ email: 'jane@example.com', password: 'Passw0rd!', displayName: 'Jane' }).subscribe();
    http.expectOne('/api/auth/register').flush(authResponse(token(future)));
    expect(service.isAuthenticated()).toBe(true);

    service.logout('manual');

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('eka.session')).toBeNull();
  });
});
