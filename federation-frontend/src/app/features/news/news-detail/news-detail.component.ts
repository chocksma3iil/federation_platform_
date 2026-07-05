import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading article..." />
    } @else if (article()) {
      <app-page-header title="Article" [breadcrumbs]="[{ label: 'News', path: '/news' }, { label: article()!.title }]">
        <a mat-stroked-button routerLink="/news" actions><mat-icon>arrow_back</mat-icon> Back</a>
      </app-page-header>

      <article class="card-padded space-y-4">
        <h1 class="text-2xl font-bold text-surface-900">{{ article()!.title }}</h1>
        <p class="text-sm text-surface-500">{{ article()!.category }} · {{ article()!.publishedAt | date:'medium' }}</p>
        @if (article()!.coverUrl) {
          <img [src]="article()!.coverUrl" [alt]="article()!.coverAltText || article()!.title"
               class="w-full rounded-lg object-cover max-h-96" />
        }
        <p class="text-surface-700 whitespace-pre-wrap leading-7">{{ article()!.content }}</p>
      </article>
    }
  `,
})
export class NewsDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  article = signal<any | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<any>(`/news/slug/${key}`).subscribe({
      next: n => {
        this.article.set(n);
        this.loading.set(false);
      },
      error: () => {
        this.api.get<any>(`/news/${key}`).subscribe({
          next: n => {
            this.article.set(n);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
    });
  }
}
