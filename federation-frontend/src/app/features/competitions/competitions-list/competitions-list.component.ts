import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

interface Competition {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  venueCity?: string;
}

@Component({
  selector: 'app-competitions-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatPaginatorModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header title="Competitions" [breadcrumbs]="[{ label: 'Admin' }, { label: 'Competitions' }]">
      <a mat-flat-button color="primary" routerLink="new" actions><mat-icon>add</mat-icon> New Competition</a>
    </app-page-header>

    <div class="card-padded mb-4">
      <mat-form-field appearance="outline" class="w-full max-w-md">
        <mat-label>Search competitions</mat-label>
        <input matInput [formControl]="searchCtrl" />
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
    </div>

    <div class="card relative">
      @if (loading()) { <app-loading-spinner [overlay]="true" /> }
      <div class="divide-y divide-surface-100">
        @for (c of competitions(); track c.id) {
          <a [routerLink]="[c.id]" class="block p-4 hover:bg-surface-50 transition-colors">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-semibold text-surface-900">{{ c.name }}</p>
                <p class="text-sm text-surface-500">{{ c.sport }} · {{ c.venueCity || 'TBD' }}</p>
                <p class="text-xs text-surface-400 mt-1">
                  {{ c.startDate | date:'mediumDate' }} - {{ c.endDate | date:'mediumDate' }}
                </p>
              </div>
              <span class="text-xs font-medium px-2 py-1 rounded-full bg-surface-100 text-surface-600">{{ c.status }}</span>
            </div>
          </a>
        }
        @if (!loading() && competitions().length === 0) {
          <div class="p-8 text-center text-surface-400">No competitions found.</div>
        }
      </div>

      <mat-paginator [length]="total()" [pageSize]="20" [pageIndex]="pageIndex()"
                     [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" showFirstLastButtons />
    </div>
  `,
})
export class CompetitionsListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);

  competitions = signal<Competition[]>([]);
  loading = signal(true);
  total = signal(0);
  pageIndex = signal(0);
  searchCtrl = new FormControl('');

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
      });
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.pageIndex(), size: 20, sort: 'startDate,desc' };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;

    this.api.getPaged<Competition>('/competitions', params).subscribe({
      next: p => {
        this.competitions.set(p.content);
        this.total.set(p.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Unable to load competitions. Please try again.');
      },
    });
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.load();
  }
}
