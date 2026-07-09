import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { UserRole } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

interface ResultItem {
  id: string;
  competitionName?: string;
  eventName?: string;
  athleteName?: string;
  performanceText?: string;
  performanceValue?: number;
  performanceUnit?: string;
  rankPosition?: number;
}

@Component({
  selector: 'app-results-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header title="Results" [breadcrumbs]="[{ label: 'Results' }]">
      @if (canManage) {
        <a mat-flat-button color="primary" routerLink="new" actions><mat-icon>add</mat-icon> Enter Result</a>
      }
    </app-page-header>

    <div class="card-padded mb-4">
      <mat-form-field appearance="outline" class="w-full max-w-md">
        <mat-label>Filter by competition ID</mat-label>
        <input matInput [formControl]="competitionCtrl" placeholder="UUID" />
      </mat-form-field>
    </div>

    <div class="card relative divide-y divide-surface-100">
      @if (loading()) { <app-loading-spinner [overlay]="true" /> }
      @for (r of results(); track r.id) {
        <a [routerLink]="[r.id]" class="block p-4 hover:bg-surface-50 transition-colors">
          <p class="font-semibold text-surface-900">{{ r.athleteName || 'Athlete' }} · {{ r.eventName || 'Event' }}</p>
          <p class="text-sm text-surface-600">{{ r.competitionName || 'Competition' }}</p>
          <p class="text-xs text-surface-500 mt-1">
            {{ r.performanceText || (r.performanceValue + ' ' + (r.performanceUnit || '')) }}
            @if (r.rankPosition) { · Rank #{{ r.rankPosition }} }
          </p>
        </a>
      }
      @if (!loading() && results().length === 0) {
        <div class="p-8 text-center text-surface-400">No results found.</div>
      }
    </div>
  `,
})
export class ResultsListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  get canManage(): boolean {
    return this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]);
  }

  loading = signal(true);
  results = signal<ResultItem[]>([]);
  competitionCtrl = new FormControl('');

  ngOnInit(): void {
    this.load();
    this.competitionCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: 0, size: 50, sort: 'createdAt,desc' };
    if (this.competitionCtrl.value) params['competitionId'] = this.competitionCtrl.value;
    this.api.getPaged<ResultItem>('/results', params).subscribe({
      next: p => {
        this.results.set(p.content);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Unable to load results. Please try again.');
      },
    });
  }
}