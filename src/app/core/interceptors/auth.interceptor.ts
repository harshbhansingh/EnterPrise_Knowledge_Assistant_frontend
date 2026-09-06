import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Attaches the bearer token and turns 401 responses into a logout + redirect to the login page. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const isAuthCall = request.url.includes('/auth/login') || request.url.includes('/auth/register');
  const authorized = token && !isAuthCall
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthCall) {
        auth.logout(error.error?.error === 'TOKEN_EXPIRED' ? 'expired' : 'manual');
      }
      return throwError(() => error);
    })
  );
};
