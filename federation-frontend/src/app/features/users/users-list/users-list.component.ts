import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

interface UserRow {
  id: string;
  fullName?: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header title="Users" [breadcrumbs]="[{ label: 'Admin' }, { label: 'Users' }]">
      <a mat-flat-button color="primary" routerLink="new" actions>
        <mat-icon>person_add</mat-icon> Add User
      </a>
    </app-page-header>

    <div class="card-padded mb-4 flex flex-wrap gap-3">
      <mat-form-field appearance="outline" class="flex-1 min-w-56">
        <mat-label>Search users</mat-label>
        <input matInput [formControl]="searchCtrl" />
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline" class="w-48">
        <mat-label>Role</mat-label>
        <mat-select [formControl]="roleCtrl">
          <mat-option value="">All</mat-option>
          <mat-option value="ROLE_ADMIN">Admin</mat-option>
          <mat-option value="ROLE_FEDERATION_STAFF">Staff</mat-option>
          <mat-option value="ROLE_CLUB_MANAGER">Club Manager</mat-option>
          <mat-option value="ROLE_ATHLETE">Athlete</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="card relative divide-y divide-surface-100">
      @if (loading()) { <app-loading-spinner [overlay]="true" /> }
      @for (u of users(); track u.id) {
        <a [routerLink]="[u.id]" class="block p-4 hover:bg-surface-50 transition-colors">
          <p class="font-semibold text-surface-900">{{ u.fullName || u.username }}</p>
          <p class="text-sm text-surface-500">{{ u.email }}</p>
          <p class="text-xs text-surface-400 mt-1">{{ u.role }} · {{ u.status }}</p>
        </a>
      }
      @if (!loading() && users().length === 0) {
        <div class="p-8 text-center text-surface-400">No users found.</div>
      }
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);

  users = signal<UserRow[]>([]);
  loading = signal(true);
  searchCtrl = new FormControl('');
  roleCtrl = new FormControl('');

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => this.load());
    this.roleCtrl.valueChanges.subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: 0, size: 50, sort: 'createdAt,desc' };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;
    if (this.roleCtrl.value) params['role'] = this.roleCtrl.value;
    this.api.getPaged<UserRow>('/users', params).subscribe({
      next: p => {
        this.users.set(p.content);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Unable to load users. Check permissions and backend status.';
        this.notify.error(message);
      },
    });
  }
}
