import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusChipComponent } from '@shared/components/status-chip/status-chip.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { UserRole } from '@core/models';

interface ClubDetail {
  id: string;
  name: string;
  shortName?: string;
  slug: string;
  licenseNumber: string;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
  foundedYear?: number;
  description?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  status: string;
  managerName?: string;
  activeAthletes?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusChipComponent,
  ],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-20">
        <app-loading-spinner [size]="48" message="Loading club profile…" />
      </div>
    } @else if (club()) {
      <app-page-header
        [title]="club()!.name"
        [subtitle]="club()!.licenseNumber"
        [breadcrumbs]="[
          { label: 'Admin', path: '/admin' },
          { label: 'Clubs', path: '/admin/clubs' },
          { label: club()!.name }
        ]">
        <a mat-stroked-button routerLink="/admin/clubs" actions>
          <mat-icon>arrow_back</mat-icon> Back
        </a>
        @if (canManage) {
          <a mat-stroked-button [routerLink]="['/admin/clubs', club()!.id, 'edit']" actions>
            <mat-icon>edit</mat-icon> Edit
          </a>
          <button mat-flat-button color="warn" (click)="confirmDelete()" actions>
            <mat-icon>delete</mat-icon> Delete
          </button>
        }
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1 space-y-4">
          <div class="card-padded text-center">
            @if (club()!.logoUrl) {
              <img [src]="club()!.logoUrl" [alt]="club()!.name"
                   class="w-24 h-24 rounded-xl object-contain mx-auto mb-4 bg-surface-50 p-2" />
            } @else {
              <div class="w-24 h-24 rounded-xl bg-primary-100 flex items-center justify-center
                          text-primary-700 text-3xl font-bold mx-auto mb-4">
                {{ (club()!.shortName ?? club()!.name).charAt(0) }}
              </div>
            }

            <h2 class="font-bold text-surface-900 text-lg">{{ club()!.name }}</h2>
            <p class="text-sm text-surface-500 mb-3">{{ clubLocation() }}</p>
            <app-status-chip [status]="club()!.status" />
          </div>

          <div class="card-padded space-y-3">
            @for (info of clubInfo(); track info.label) {
              <div class="flex justify-between text-sm gap-4">
                <span class="text-surface-500">{{ info.label }}</span>
                <span class="font-medium text-surface-800 text-right">{{ info.value }}</span>
              </div>
            }
          </div>
        </div>

        <div class="lg:col-span-3">
          <mat-tab-group animationDuration="200ms" class="card">
            <mat-tab label="Overview">
              <div class="p-6 space-y-4">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-surface-500 mb-2">Description</h3>
                  <p class="text-surface-700 text-sm leading-6">{{ club()!.description || 'No description provided.' }}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="rounded-lg border border-surface-200 p-4">
                    <p class="text-xs text-surface-500 uppercase">Website</p>
                    <p class="mt-1 text-sm text-surface-800 break-all">{{ club()!.website || '—' }}</p>
                  </div>
                  <div class="rounded-lg border border-surface-200 p-4">
                    <p class="text-xs text-surface-500 uppercase">Email</p>
                    <p class="mt-1 text-sm text-surface-800 break-all">{{ club()!.email || '—' }}</p>
                  </div>
                  <div class="rounded-lg border border-surface-200 p-4">
                    <p class="text-xs text-surface-500 uppercase">Phone</p>
                    <p class="mt-1 text-sm text-surface-800">{{ club()!.phone || '—' }}</p>
                  </div>
                  <div class="rounded-lg border border-surface-200 p-4">
                    <p class="text-xs text-surface-500 uppercase">Address</p>
                    <p class="mt-1 text-sm text-surface-800">{{ club()!.address || '—' }}</p>
                  </div>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Roster">
              <div class="p-6 text-center text-surface-400 py-16">
                <mat-icon class="!text-5xl text-surface-200">groups</mat-icon>
                <p class="mt-3 text-sm">Athlete roster integration is next.</p>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>
    }
  `,
})
export class ClubDetailComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  club = signal<ClubDetail | null>(null);
  loading = signal(true);

  get canManage(): boolean {
    return this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<ClubDetail>(`/clubs/${id}`).subscribe({
      next: c => {
        this.club.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clubInfo(): Array<{ label: string; value: string }> {
    const c = this.club();
    if (!c) return [];

    return [
      { label: 'License', value: c.licenseNumber || '—' },
      { label: 'Short Name', value: c.shortName || '—' },
      { label: 'Founded', value: c.foundedYear?.toString() || '—' },
      { label: 'Country', value: c.country || '—' },
      { label: 'Manager', value: c.managerName || 'Unassigned' },
      { label: 'Active Athletes', value: `${c.activeAthletes ?? 0}` },
    ];
  }

  clubLocation(): string {
    const c = this.club();
    if (!c) return '—';
    const city = c.city || '';
    const region = c.region ? `, ${c.region}` : '';
    const country = c.country ? `, ${c.country}` : '';
    return `${city}${region}${country}`.trim().replace(/^,\s*/, '') || '—';
  }

  confirmDelete(): void {
    const c = this.club();
    if (!c) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Club',
        message: `Permanently delete ${c.name}? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
      },
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete(`/clubs/${c.id}`).subscribe({
        next: () => {
          this.notify.success('Club deleted.');
          this.router.navigate(['/admin/clubs']);
        },
      });
    });
  }
}
