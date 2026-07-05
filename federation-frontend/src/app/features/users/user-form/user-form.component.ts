import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Add User"
      [breadcrumbs]="[{ label: 'Admin', path: '/admin' }, { label: 'Users', path: '/admin/users' }, { label: 'New' }]" />

    <div class="max-w-2xl">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-padded space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="ROLE_ADMIN">Admin</mat-option>
              <mat-option value="ROLE_FEDERATION_STAFF">Federation Staff</mat-option>
              <mat-option value="ROLE_CLUB_MANAGER">Club Manager</mat-option>
              <mat-option value="ROLE_ATHLETE">Athlete</mat-option>
              <mat-option value="ROLE_PUBLIC">Public</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="INACTIVE">Inactive</mat-option>
              <mat-option value="SUSPENDED">Suspended</mat-option>
              <mat-option value="PENDING_VERIFICATION">Pending Verification</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-surface-100">
          <a mat-stroked-button routerLink="/admin/users">Cancel</a>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
            @if (saving()) { Creating... } @else { Create User }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  saving = signal(false);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    role: ['ROLE_FEDERATION_STAFF', Validators.required],
    status: ['ACTIVE', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.api.post('/users', this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('User created.');
        this.router.navigate(['/admin/users']);
      },
      error: () => this.saving.set(false),
    });
  }
}
