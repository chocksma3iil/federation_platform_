import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
            <mat-label>Gender</mat-label>
            <mat-select formControlName="gender">
              <mat-option [value]="null">Not set</mat-option>
              <mat-option value="MALE">Male</mat-option>
              <mat-option value="FEMALE">Female</mat-option>
              <mat-option value="OTHER">Other</mat-option>
            </mat-select>
            @if (isAthleteRole()) {
              <mat-hint>Used for athlete event eligibility during registration.</mat-hint>
            }
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
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = signal(false);
  isEdit = signal(false);
  userId = signal<string | null>(null);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    role: ['ROLE_FEDERATION_STAFF', Validators.required],
    gender: [null as string | null],
    status: ['ACTIVE', Validators.required],
  });

  isAthleteRole(): boolean {
    return this.form.get('role')?.value === 'ROLE_ATHLETE';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.isEdit.set(true);
    this.userId.set(id);
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();

    this.api.get<any>(`/users/${id}`).subscribe({
      next: user => {
        this.form.patchValue({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
          username: user.username ?? '',
          password: '',
          phone: user.phone ?? '',
          role: user.role ?? 'ROLE_FEDERATION_STAFF',
          gender: user.gender ?? null,
          status: user.status ?? 'ACTIVE',
        });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.isEdit()
      ? {
          firstName: this.form.value.firstName,
          lastName: this.form.value.lastName,
          email: this.form.value.email,
          username: this.form.value.username,
          phone: this.form.value.phone,
          role: this.form.value.role,
          gender: this.form.value.gender,
          status: this.form.value.status,
        }
      : this.form.getRawValue();

    const request = this.isEdit()
      ? this.api.put(`/users/${this.userId()}`, payload)
      : this.api.post('/users', payload);

    request.subscribe({
      next: () => {
        this.notify.success(this.isEdit() ? 'User updated.' : 'User created.');
        this.router.navigate(['/admin/users']);
      },
      error: () => this.saving.set(false),
    });
  }
}
