import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-news-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header [title]="isEdit ? 'Edit Article' : 'New Article'"
      [breadcrumbs]="[{ label: 'News', path: '/admin/news' }, { label: isEdit ? 'Edit' : 'New' }]" />

    @if (initLoading()) {
      <app-loading-spinner message="Loading article..." />
    } @else {
      <div class="max-w-4xl">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-padded space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Excerpt</mat-label>
            <textarea matInput rows="2" formControlName="excerpt"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Content</mat-label>
            <textarea matInput rows="8" formControlName="content"></textarea>
          </mat-form-field>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option value="ANNOUNCEMENT">Announcement</mat-option>
                <mat-option value="COMPETITION">Competition</mat-option>
                <mat-option value="RESULT">Result</mat-option>
                <mat-option value="TRANSFER">Transfer</mat-option>
                <mat-option value="INTERVIEW">Interview</mat-option>
                <mat-option value="GENERAL">General</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="DRAFT">Draft</mat-option>
                <mat-option value="PUBLISHED">Published</mat-option>
                <mat-option value="ARCHIVED">Archived</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Language</mat-label>
              <input matInput formControlName="language" />
            </mat-form-field>
          </div>

          <div class="flex gap-4">
            <mat-checkbox formControlName="featured">Featured</mat-checkbox>
            <mat-checkbox formControlName="pinned">Pinned</mat-checkbox>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <a mat-stroked-button routerLink="/admin/news">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { Saving... } @else { {{ isEdit ? 'Update' : 'Create' }} }
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class NewsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = signal(false);
  initLoading = signal(false);
  isEdit = false;
  id?: string;

  form = this.fb.group({
    title: ['', Validators.required],
    excerpt: [''],
    content: ['', Validators.required],
    category: ['GENERAL'],
    status: ['DRAFT'],
    language: ['en'],
    coverUrl: [''],
    metaTitle: [''],
    metaDescription: [''],
    featured: [false],
    pinned: [false],
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEdit = !!this.id;
    if (this.isEdit) {
      this.initLoading.set(true);
      this.api.get<any>(`/news/${this.id}`).subscribe({
        next: n => {
          this.form.patchValue(n);
          this.initLoading.set(false);
        },
        error: () => this.initLoading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const req$ = this.isEdit ? this.api.put(`/news/${this.id}`, this.form.getRawValue()) : this.api.post('/news', this.form.getRawValue());
    req$.subscribe({
      next: () => {
        this.notify.success(this.isEdit ? 'Article updated.' : 'Article created.');
        this.router.navigate(['/admin/news']);
      },
      error: () => this.saving.set(false),
    });
  }
}
