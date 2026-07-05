import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-result-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header [title]="isEdit ? 'Edit Result' : 'Enter Result'"
      [breadcrumbs]="[{ label: 'Results', path: '/admin/results' }, { label: isEdit ? 'Edit' : 'New' }]" />

    @if (initLoading()) {
      <app-loading-spinner message="Loading result..." />
    } @else {
      <div class="max-w-3xl">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-padded space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="outline"><mat-label>Competition ID</mat-label><input matInput formControlName="competitionId" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Event ID</mat-label><input matInput formControlName="eventId" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Athlete ID</mat-label><input matInput formControlName="athleteId" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Round</mat-label><input matInput formControlName="round" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Performance Value</mat-label><input matInput type="number" formControlName="performanceValue" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Performance Unit</mat-label><input matInput formControlName="performanceUnit" /></mat-form-field>
            <mat-form-field appearance="outline" class="md:col-span-2"><mat-label>Performance Text</mat-label><input matInput formControlName="performanceText" /></mat-form-field>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <a mat-stroked-button routerLink="/admin/results">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { Saving... } @else { {{ isEdit ? 'Update' : 'Create' }} }
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class ResultFormComponent implements OnInit {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    competitionId: ['', [Validators.required, Validators.pattern(ResultFormComponent.UUID_PATTERN)]],
    eventId: ['', [Validators.required, Validators.pattern(ResultFormComponent.UUID_PATTERN)]],
    athleteId: ['', [Validators.required, Validators.pattern(ResultFormComponent.UUID_PATTERN)]],
    round: ['FINAL'],
    performanceValue: [null as number | null],
    performanceUnit: ['s'],
    performanceText: [''],
    status: ['VALID'],
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEdit = !!this.id;
    if (this.isEdit) {
      this.initLoading.set(true);
      this.api.get<any>(`/results/${this.id}`).subscribe({
        next: r => {
          this.form.patchValue({
            competitionId: r.competitionId ?? '',
            eventId: r.eventId ?? '',
            athleteId: r.athleteId ?? '',
            round: r.round ?? 'FINAL',
            performanceValue: r.performanceValue ?? null,
            performanceUnit: r.performanceUnit ?? 's',
            performanceText: r.performanceText ?? '',
            status: r.status ?? 'VALID',
          });
          this.initLoading.set(false);
        },
        error: () => this.initLoading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.error('Please enter valid UUID values for Competition, Event, and Athlete.');
      return;
    }

    const payload = this.buildPayload();
    this.saving.set(true);
    const req$ = this.isEdit
      ? this.api.put(`/results/${this.id}`, payload)
      : this.api.post('/results', payload);
    req$.subscribe({
      next: () => {
        this.notify.success(this.isEdit ? 'Result updated.' : 'Result created.');
        this.router.navigate(['/admin/results']);
      },
      error: () => this.saving.set(false),
    });
  }

  private buildPayload(): Record<string, unknown> {
    const raw = this.form.getRawValue();
    return {
      competitionId: raw.competitionId?.trim(),
      eventId: raw.eventId?.trim(),
      athleteId: raw.athleteId?.trim(),
      round: raw.round?.trim() || null,
      performanceValue: raw.performanceValue,
      performanceUnit: raw.performanceUnit?.trim() || null,
      performanceText: raw.performanceText?.trim() || null,
      status: raw.status?.trim() || null,
    };
  }
}
