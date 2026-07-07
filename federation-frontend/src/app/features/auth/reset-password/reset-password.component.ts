import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div class="w-full max-w-md">
        <div class="card-padded">
          <div class="text-center mb-8">
            <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <mat-icon class="!text-3xl text-primary-600">lock_reset</mat-icon>
            </div>
            <h1 class="text-2xl font-bold text-surface-900">Reset Password</h1>
            <p class="mt-2 text-sm text-surface-500">Choose your new password.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <mat-form-field appearance="outline" class="w-full mb-4">
              <mat-label>New Password</mat-label>
              <input matInput type="password" formControlName="newPassword" />
              @if (form.get('newPassword')?.hasError('required') && form.get('newPassword')?.touched) {
                <mat-error>New password is required</mat-error>
              }
              @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full mb-4">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" />
              @if (form.get('confirmPassword')?.hasError('required') && form.get('confirmPassword')?.touched) {
                <mat-error>Confirmation is required</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" class="w-full !h-11 !rounded-xl !font-semibold">
              Reset Password
            </button>
          </form>

          <div class="mt-6 text-center">
            <a routerLink="/auth/login" class="text-sm text-primary-600 hover:underline flex items-center justify-center gap-1">
              <mat-icon class="!text-base">arrow_back</mat-icon>
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.notify.error('Reset token is missing.');
      return;
    }

    const newPassword = this.form.value.newPassword ?? '';
    const confirmPassword = this.form.value.confirmPassword ?? '';

    if (newPassword !== confirmPassword) {
      this.notify.error('Password confirmation does not match.');
      return;
    }

    this.auth.resetPassword({ token, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.notify.success('Password reset successfully. Please log in.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.notify.error(err?.error?.message ?? 'Reset link is invalid or expired.');
      },
    });
  }
}
