import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading competition..." />
    } @else if (competition()) {
      <app-page-header
        [title]="competition()!.name"
        [subtitle]="competition()!.sport"
        [breadcrumbs]="[{ label: 'Competitions', path: '/admin/competitions' }, { label: competition()!.name }]">
        <a mat-stroked-button routerLink="/admin/competitions" actions><mat-icon>arrow_back</mat-icon> Back</a>
        <a mat-stroked-button [routerLink]="['/admin/competitions', competition()!.id, 'edit']" actions>
          <mat-icon>edit</mat-icon> Edit
        </a>
        <button mat-flat-button color="warn" (click)="confirmDelete()" actions>
          <mat-icon>delete</mat-icon> Delete
        </button>
      </app-page-header>

      <div class="card-padded space-y-3">
        <p class="text-surface-700">{{ competition()!.description || 'No description.' }}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div><span class="text-surface-500 text-sm">Status:</span> <span class="text-sm font-medium">{{ competition()!.status }}</span></div>
          <div><span class="text-surface-500 text-sm">Venue:</span> <span class="text-sm font-medium">{{ competition()!.venueCity || 'TBD' }}</span></div>
          <div><span class="text-surface-500 text-sm">Start:</span> <span class="text-sm font-medium">{{ competition()!.startDate | date:'mediumDate' }}</span></div>
          <div><span class="text-surface-500 text-sm">End:</span> <span class="text-sm font-medium">{{ competition()!.endDate | date:'mediumDate' }}</span></div>
        </div>
      </div>
    }
  `,
})
export class CompetitionDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  competition = signal<any | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`/competitions/${id}`).subscribe({
      next: c => {
        this.competition.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirmDelete(): void {
    const c = this.competition();
    if (!c) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Competition', message: `Delete ${c.name}?`, confirmText: 'Delete', danger: true },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.delete(`/competitions/${c.id}`).subscribe({
        next: () => {
          this.notify.success('Competition deleted.');
          this.router.navigate(['/admin/competitions']);
        },
      });
    });
  }
}
