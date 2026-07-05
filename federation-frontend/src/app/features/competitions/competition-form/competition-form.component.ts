import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-competition-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header
      [title]="isEdit ? 'Edit Competition' : 'New Competition'"
      [breadcrumbs]="[{ label: 'Competitions', path: '/admin/competitions' }, { label: isEdit ? 'Edit' : 'New' }]" />

    @if (initLoading()) {
      <app-loading-spinner message="Loading competition..." />
    } @else {
      <div class="max-w-3xl">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-padded space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sport</mat-label>
              <input matInput formControlName="sport" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="DRAFT">Draft</mat-option>
                <mat-option value="PUBLISHED">Published</mat-option>
                <mat-option value="ONGOING">Ongoing</mat-option>
                <mat-option value="COMPLETED">Completed</mat-option>
                <mat-option value="CANCELLED">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Venue City</mat-label>
              <input matInput formControlName="venueCity" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput type="date" formControlName="startDate" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput type="date" formControlName="endDate" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea matInput rows="4" formControlName="description"></textarea>
          </mat-form-field>

          <div class="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <a mat-stroked-button routerLink="/admin/competitions">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { Saving... } @else { {{ isEdit ? 'Update' : 'Create' }} }
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class CompetitionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = signal(false);
  initLoading = signal(false);
  isEdit = false;
  competitionId?: string;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    sport: ['', Validators.required],
    venueCity: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    status: ['DRAFT'],
  });

  ngOnInit(): void {
    this.competitionId = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEdit = !!this.competitionId;

    if (this.isEdit) {
      this.initLoading.set(true);
      this.api.get<any>(`/competitions/${this.competitionId}`).subscribe({
        next: c => {
          this.form.patchValue(c);
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
    const req$ = this.isEdit
      ? this.api.put(`/competitions/${this.competitionId}`, this.form.getRawValue())
      : this.api.post('/competitions', this.form.getRawValue());

    req$.subscribe({
      next: () => {
        this.notify.success(this.isEdit ? 'Competition updated.' : 'Competition created.');
        this.router.navigate(['/admin/competitions']);
      },
      error: () => this.saving.set(false),
    });
  }
}
