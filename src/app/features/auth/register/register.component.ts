import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

/** Mirrors the backend rule: at least one letter and one digit. */
export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  return hasLetter && hasDigit ? null : { strength: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './register.component.html',
  styleUrl: '../auth-layout.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100), passwordStrengthValidator]]
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.notifications.success('Welcome! Your account has been created.');
        void this.router.navigateByUrl('/dashboard');
      },
      error: err => {
        this.loading.set(false);
        this.error.set(this.notifications.describe(err, 'Registration failed'));
      }
    });
  }
}
