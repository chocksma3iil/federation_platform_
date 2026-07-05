import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  category?: string;
  publishedAt?: string;
}

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header title="News" [breadcrumbs]="[{ label: 'Admin' }, { label: 'News' }]">
      <a mat-flat-button color="primary" routerLink="new" actions><mat-icon>edit_note</mat-icon> New Article</a>
    </app-page-header>

    <div class="card-padded mb-4 flex flex-wrap gap-3">
      <mat-form-field appearance="outline" class="flex-1 min-w-56">
        <mat-label>Search articles</mat-label>
        <input matInput [formControl]="searchCtrl" />
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline" class="w-44">
        <mat-label>Status</mat-label>
        <mat-select [formControl]="statusCtrl">
          <mat-option value="">All</mat-option>
          <mat-option value="DRAFT">Draft</mat-option>
          <mat-option value="PUBLISHED">Published</mat-option>
          <mat-option value="ARCHIVED">Archived</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="card relative divide-y divide-surface-100">
      @if (loading()) { <app-loading-spinner [overlay]="true" /> }
      @for (n of articles(); track n.id) {
        <div class="p-4 flex items-start justify-between gap-4">
          <a [routerLink]="['/news', n.slug]" class="min-w-0">
            <p class="font-semibold text-surface-900 truncate">{{ n.title }}</p>
            <p class="text-sm text-surface-500 mt-1">{{ n.excerpt || 'No excerpt' }}</p>
            <p class="text-xs text-surface-400 mt-1">{{ n.category || 'GENERAL' }} · {{ n.status }}</p>
          </a>
          <button mat-icon-button [matMenuTriggerFor]="menu" [matMenuTriggerData]="{ item: n }"><mat-icon>more_vert</mat-icon></button>
        </div>
      }
      @if (!loading() && articles().length === 0) {
        <div class="p-8 text-center text-surface-400">No news articles found.</div>
      }
    </div>

    <mat-menu #menu="matMenu">
      <ng-template matMenuContent let-item="item">
        <a mat-menu-item [routerLink]="[item.id, 'edit']"><mat-icon>edit</mat-icon>Edit</a>
        @if (item.status !== 'PUBLISHED') {
          <button mat-menu-item (click)="publish(item.id)"><mat-icon>publish</mat-icon>Publish</button>
        }
        <button mat-menu-item class="!text-red-600" (click)="remove(item.id)"><mat-icon class="!text-red-600">delete</mat-icon>Delete</button>
      </ng-template>
    </mat-menu>
  `,
})
export class NewsListComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);

  articles = signal<NewsItem[]>([]);
  loading = signal(true);
  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => this.load());
    this.statusCtrl.valueChanges.subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: 0, size: 50, sort: 'publishedAt,desc' };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;
    if (this.statusCtrl.value) params['status'] = this.statusCtrl.value;

    this.api.getPaged<NewsItem>('/news', params).subscribe({
      next: p => {
        this.articles.set(p.content);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Unable to load news articles. Please try again.');
      },
    });
  }

  publish(id: string): void {
    this.api.patch(`/news/${id}/publish`, {}).subscribe({
      next: () => {
        this.notify.success('Article published.');
        this.load();
      },
    });
  }

  remove(id: string): void {
    this.api.delete(`/news/${id}`).subscribe({
      next: () => {
        this.notify.success('Article deleted.');
        this.load();
      },
    });
  }
}
