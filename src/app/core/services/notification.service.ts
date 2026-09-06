import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from '../models/api.models';

/** Snackbar notifications plus a single place that turns API errors into readable messages. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3500, panelClass: 'eka-snack-success' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 6000, panelClass: 'eka-snack-error' });
  }

  /** Extracts the server-provided message (and field details) from an HTTP error. */
  describe(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The server cannot be reached. Check that the backend is running.';
      }
      const body = error.error as Partial<ApiError> | null;
      if (body && typeof body === 'object' && body.message) {
        const details = body.details ? Object.entries(body.details).map(([field, text]) => `${field}: ${text}`) : [];
        return details.length ? `${body.message} (${details.join(', ')})` : body.message;
      }
      if (error.status === 413) {
        return 'The file is too large.';
      }
    }
    return fallback;
  }
}
