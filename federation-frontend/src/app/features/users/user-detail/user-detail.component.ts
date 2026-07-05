import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading user..." />
    } @else if (user()) {
      <app-page-header [title]="user()!.fullName || user()!.username"
        [subtitle]="user()!.email"
        [breadcrumbs]="[{ label: 'Users', path: '/admin/users' }, { label: 'Details' }]">
        <a mat-stroked-button routerLink="/admin/users" actions><mat-icon>arrow_back</mat-icon> Back</a>
      </app-page-header>

      <div class="card-padded grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><span class="text-surface-500 text-sm">Username:</span> <span class="text-sm font-medium">{{ user()!.username }}</span></div>
        <div><span class="text-surface-500 text-sm">Role:</span> <span class="text-sm font-medium">{{ user()!.role }}</span></div>
        <div><span class="text-surface-500 text-sm">Status:</span> <span class="text-sm font-medium">{{ user()!.status }}</span></div>
        <div><span class="text-surface-500 text-sm">Phone:</span> <span class="text-sm font-medium">{{ user()!.phone || '—' }}</span></div>
        <div><span class="text-surface-500 text-sm">Last Login:</span> <span class="text-sm font-medium">{{ user()!.lastLogin ? (user()!.lastLogin | date:'medium') : '—' }}</span></div>
      </div>
    }
  `,
})
export class UserDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  user = signal<any | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`/users/${id}`).subscribe({
      next: u => {
        this.user.set(u);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
