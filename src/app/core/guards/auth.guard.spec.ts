import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('route guards', () => {
  let authenticated = false;
  const state = { url: '/documents' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => authenticated } }
      ]
    });
  });

  it('authGuard redirects anonymous users to login with a return url', () => {
    authenticated = false;
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fdocuments');
  });

  it('authGuard allows authenticated users', () => {
    authenticated = true;
    expect(TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state))).toBe(true);
  });

  it('guestGuard sends authenticated users to the dashboard', () => {
    authenticated = true;
    const result = TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/dashboard');
    authenticated = false;
    expect(TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, state))).toBe(true);
  });
});
