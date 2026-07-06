import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

interface MyRegistrationItem {
  id: string;
  competitionName?: string;
  eventName?: string;
  registrationNumber?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'DISQUALIFIED' | string;
  feeAmount?: number;
  feeCurrency?: string;
  feePaid?: boolean;
  createdAt?: string;
}

@Component({
  selector:   'app-my-registrations',
  standalone: true,
  imports:    [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header
      title="My Registrations"
      subtitle="Track your competition registrations"
      [breadcrumbs]="[{ label: 'Portal' }, { label: 'My Registrations' }]">
      <a mat-flat-button color="primary" routerLink="/portal/register" actions>
        <mat-icon>how_to_reg</mat-icon> Register for Competition
      </a>
    </app-page-header>

    @if (loading()) {
      <app-loading-spinner message="Loading your registrations..." />
    } @else if (registrations().length === 0) {
      <div class="card">
        <app-empty-state
          icon="how_to_reg"
          title="No registrations yet"
          subtitle="Browse upcoming competitions and register to compete."
          actionLabel="View Competitions"
          (action)="goToCompetitions()" />
      </div>
    } @else {
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface-50 border-b border-surface-100">
              <tr>
                <th class="text-left p-3 font-semibold">Registration #</th>
                <th class="text-left p-3 font-semibold">Competition</th>
                <th class="text-left p-3 font-semibold">Event</th>
                <th class="text-left p-3 font-semibold">Status</th>
                <th class="text-left p-3 font-semibold">Fee</th>
                <th class="text-left p-3 font-semibold">Date</th>
                <th class="text-left p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (r of registrations(); track r.id) {
                <tr class="border-b border-surface-100">
                  <td class="p-3">{{ r.registrationNumber || '—' }}</td>
                  <td class="p-3">{{ r.competitionName || '—' }}</td>
                  <td class="p-3">{{ r.eventName || '—' }}</td>
                  <td class="p-3">{{ r.status || '—' }}</td>
                  <td class="p-3">{{ formatFee(r) }}</td>
                  <td class="p-3">{{ r.createdAt ? (r.createdAt | date:'mediumDate') : '—' }}</td>
                  <td class="p-3">
                    @if (canCancel(r)) {
                      <button mat-stroked-button color="warn" (click)="confirmCancel(r)">
                        <mat-icon>cancel</mat-icon> Cancel
                      </button>
                    } @else {
                      <span class="text-surface-400">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class MyRegistrationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly registrations = signal<MyRegistrationItem[]>([]);
  readonly userId = computed(() => this.auth.currentUser()?.id ?? null);

  ngOnInit(): void {
    this.loadMyRegistrations();
  }

  goToCompetitions(): void {
    this.router.navigate(['/competitions']);
  }

  canCancel(r: MyRegistrationItem): boolean {
    return r.status === 'PENDING' || r.status === 'WAITLISTED' || r.status === 'CONFIRMED';
  }

  formatFee(r: MyRegistrationItem): string {
    if (r.feeAmount == null) return '—';
    return `${r.feeAmount} ${r.feeCurrency || 'TND'}${r.feePaid ? ' (paid)' : ''}`;
  }

  confirmCancel(r: MyRegistrationItem): void {
    if (!r.id || !this.isUuid(r.id)) {
      this.notify.error('Invalid registration id. Please refresh and try again.');
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Registration',
        message: `Cancel registration ${r.registrationNumber || ''}?`,
        confirmText: 'Cancel Registration',
        danger: true,
      },
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.patch<MyRegistrationItem>(`/registrations/me/${r.id}/cancel`).subscribe({
        next: () => {
          this.notify.success('Registration cancelled.');
          this.loadMyRegistrations();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Could not cancel registration.';
          this.notify.error(msg);
        },
      });
    });
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private loadMyRegistrations(): void {
    if (!this.userId()) {
      this.registrations.set([]);
      return;
    }

    this.loading.set(true);
    this.api.getPaged<MyRegistrationItem>('/registrations/me', {
      page: 0,
      size: 200,
    }).subscribe({
      next: p => {
        this.registrations.set(p.content ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.registrations.set([]);
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Unable to load registrations.';
        this.notify.error(msg);
      },
    });
  }
}
