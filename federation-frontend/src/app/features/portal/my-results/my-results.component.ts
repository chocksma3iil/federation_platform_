import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

interface MyResultItem {
  id: string;
  competitionName?: string;
  eventName?: string;
  round?: string;
  performanceText?: string;
  performanceValue?: number;
  performanceUnit?: string;
  status?: string;
  rankPosition?: number;
  createdAt?: string;
}

@Component({
  selector:   'app-my-results',
  standalone: true,
  imports:    [CommonModule, PageHeaderComponent, EmptyStateComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header
      title="My Results"
      subtitle="Your competition results and personal bests"
      [breadcrumbs]="[{ label: 'Portal' }, { label: 'My Results' }]">
    </app-page-header>

    @if (loading()) {
      <app-loading-spinner message="Loading your results..." />
    } @else if (results().length === 0) {
      <div class="card">
      <app-empty-state
        icon="bar_chart"
        title="No results yet"
        subtitle="Your competition results will appear here once they are officially recorded." />
      </div>
    } @else {
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface-50 border-b border-surface-100">
              <tr>
                <th class="text-left p-3 font-semibold">Competition</th>
                <th class="text-left p-3 font-semibold">Event</th>
                <th class="text-left p-3 font-semibold">Performance</th>
                <th class="text-left p-3 font-semibold">Round</th>
                <th class="text-left p-3 font-semibold">Rank</th>
                <th class="text-left p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (r of results(); track r.id) {
                <tr class="border-b border-surface-100">
                  <td class="p-3">{{ r.competitionName || '—' }}</td>
                  <td class="p-3">{{ r.eventName || '—' }}</td>
                  <td class="p-3">{{ formatPerformance(r) }}</td>
                  <td class="p-3">{{ r.round || '—' }}</td>
                  <td class="p-3">{{ r.rankPosition || '—' }}</td>
                  <td class="p-3">{{ r.status || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class MyResultsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly results = signal<MyResultItem[]>([]);
  readonly userId = computed(() => this.auth.currentUser()?.id ?? null);

  ngOnInit(): void {
    this.loadMyResults();
  }

  formatPerformance(r: MyResultItem): string {
    if (r.performanceText?.trim()) return r.performanceText;
    if (r.performanceValue != null) {
      return `${r.performanceValue}${r.performanceUnit ? ' ' + r.performanceUnit : ''}`;
    }
    return '—';
  }

  private loadMyResults(): void {
    const userId = this.userId();
    if (!userId) {
      this.results.set([]);
      return;
    }

    this.loading.set(true);
    this.api.getPaged<MyResultItem>('/results', {
      athleteId: userId,
      page: 0,
      size: 200,
      sort: 'createdAt,desc',
    }).subscribe({
      next: page => {
        this.results.set(page.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }
}
