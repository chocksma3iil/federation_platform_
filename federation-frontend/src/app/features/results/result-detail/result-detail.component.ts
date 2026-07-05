import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-result-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading result..." />
    } @else if (result()) {
      <app-page-header title="Result Details"
        [subtitle]="result()!.athleteName || 'Athlete'"
        [breadcrumbs]="[{ label: 'Results', path: '/admin/results' }, { label: 'Details' }]">
        <a mat-stroked-button routerLink="/admin/results" actions><mat-icon>arrow_back</mat-icon> Back</a>
        <a mat-stroked-button [routerLink]="['/admin/results', result()!.id, 'edit']" actions>
          <mat-icon>edit</mat-icon> Edit
        </a>
      </app-page-header>

      <div class="card-padded grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><span class="text-surface-500 text-sm">Competition:</span> <span class="text-sm font-medium">{{ result()!.competitionName || '—' }}</span></div>
        <div><span class="text-surface-500 text-sm">Event:</span> <span class="text-sm font-medium">{{ result()!.eventName || '—' }}</span></div>
        <div><span class="text-surface-500 text-sm">Athlete:</span> <span class="text-sm font-medium">{{ result()!.athleteName || '—' }}</span></div>
        <div><span class="text-surface-500 text-sm">License:</span> <span class="text-sm font-medium">{{ result()!.licenseNumber || '—' }}</span></div>
        <div><span class="text-surface-500 text-sm">Performance:</span> <span class="text-sm font-medium">{{ result()!.performanceText || (result()!.performanceValue + ' ' + (result()!.performanceUnit || '')) }}</span></div>
        <div><span class="text-surface-500 text-sm">Rank:</span> <span class="text-sm font-medium">{{ result()!.rankPosition || '—' }}</span></div>
      </div>
    }
  `,
})
export class ResultDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  result = signal<any | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`/results/${id}`).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
