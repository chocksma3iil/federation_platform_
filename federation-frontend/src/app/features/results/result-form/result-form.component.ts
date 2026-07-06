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

interface AthleteUserOption {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  username?: string;
}

interface CompetitionOption {
  id: string;
  name: string;
  status?: string;
}

interface EventOption {
  id: string;
  name: string;
  code?: string;
  discipline?: string;
  competitionId?: string;
  competitionName?: string;
}

@Component({
  selector: 'app-result-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
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

            <!-- Competition dropdown -->
            <mat-form-field appearance="outline">
              <mat-label>Competition</mat-label>
              <mat-select formControlName="competitionId" (selectionChange)="onCompetitionChange()">
                @for (comp of competitions(); track comp.id) {
                  <mat-option [value]="comp.id">{{ comp.name }}</mat-option>
                }
              </mat-select>
              @if (competitionsLoading()) { <mat-hint>Loading...</mat-hint> }
            </mat-form-field>

            <!-- Event dropdown (filtered by selected competition) -->
            <mat-form-field appearance="outline">
              <mat-label>Event</mat-label>
              <mat-select formControlName="eventId">
                @for (ev of events(); track ev.id) {
                  <mat-option [value]="ev.id">{{ ev.name }} @if (ev.code) { ({{ ev.code }}) }</mat-option>
                }
              </mat-select>
              @if (eventsLoading()) {
                <mat-hint>Loading events...</mat-hint>
              } @else if (!form.get('competitionId')?.value) {
                <mat-hint>Select a competition first.</mat-hint>
              } @else if (events().length === 0) {
                <mat-hint>No events for this competition.</mat-hint>
              }
            </mat-form-field>

            <!-- Athlete dropdown (users with ROLE_ATHLETE) -->
            <mat-form-field appearance="outline">
              <mat-label>Athlete</mat-label>
              <mat-select formControlName="athleteId">
                @for (athlete of athletes(); track athlete.id) {
                  <mat-option [value]="athlete.id">{{ formatAthleteLabel(athlete) }}</mat-option>
                }
              </mat-select>
              @if (athletesLoading()) {
                <mat-hint>Loading athletes...</mat-hint>
              } @else if (athletes().length === 0) {
                <mat-hint>No athlete users found.</mat-hint>
              }
            </mat-form-field>

            <!-- Round dropdown -->
            <mat-form-field appearance="outline">
              <mat-label>Round</mat-label>
              <mat-select formControlName="round">
                <mat-option value="FINAL">Final</mat-option>
                <mat-option value="SEMI_FINAL">Semi-Final</mat-option>
                <mat-option value="QUARTER_FINAL">Quarter-Final</mat-option>
                <mat-option value="HEAT">Heat</mat-option>
                <mat-option value="QUALIFYING">Qualifying</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline"><mat-label>Performance Value</mat-label><input matInput type="number" formControlName="performanceValue" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Performance Unit</mat-label><input matInput formControlName="performanceUnit" /></mat-form-field>
            <mat-form-field appearance="outline" class="md:col-span-2"><mat-label>Performance Text</mat-label><input matInput formControlName="performanceText" /></mat-form-field>

            <!-- Status dropdown -->
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="OFFICIAL">Official</mat-option>
                <mat-option value="UNOFFICIAL">Unofficial</mat-option>
              </mat-select>
            </mat-form-field>
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
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = signal(false);
  initLoading = signal(false);

  competitionsLoading = signal(false);
  competitions = signal<CompetitionOption[]>([]);

  eventsLoading = signal(false);
  events = signal<EventOption[]>([]);

  athletesLoading = signal(false);
  athletes = signal<AthleteUserOption[]>([]);

  isEdit = false;
  id?: string;

  form = this.fb.group({
    competitionId: ['', Validators.required],
    eventId: ['', Validators.required],
    athleteId: ['', Validators.required],
    round: ['FINAL'],
    performanceValue: [null as number | null],
    performanceUnit: ['s'],
    performanceText: [''],
    status: ['UNOFFICIAL'],
  });

  ngOnInit(): void {
    this.loadCompetitions();
    this.loadAthletes();

    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEdit = !!this.id;
    if (this.isEdit) {
      this.initLoading.set(true);
      this.api.get<any>(`/results/${this.id}`).subscribe({
        next: r => {
          // Load events for the result's competition before patching
          if (r.competitionId) {
            this.loadEvents(r.competitionId, () => {
              this.patchForm(r);
              this.initLoading.set(false);
            });
          } else {
            this.patchForm(r);
            this.initLoading.set(false);
          }
        },
        error: () => this.initLoading.set(false),
      });
    }
  }

  onCompetitionChange(): void {
    const compId = this.form.get('competitionId')?.value;
    this.form.patchValue({ eventId: '' });
    this.events.set([]);
    if (compId) {
      this.loadEvents(compId);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.error('Please select competition, event, and athlete.');
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
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Failed to save result. Please check your selections.';
        this.notify.error(msg);
      },
    });
  }

  formatAthleteLabel(athlete: AthleteUserOption): string {
    const fullName = athlete.fullName?.trim();
    if (fullName) return athlete.username ? `${fullName} (${athlete.username})` : fullName;
    const first = athlete.firstName?.trim() ?? '';
    const last = athlete.lastName?.trim() ?? '';
    const combined = `${first} ${last}`.trim();
    if (combined) return athlete.username ? `${combined} (${athlete.username})` : combined;
    return athlete.email ?? athlete.username ?? athlete.id;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private patchForm(r: any): void {
    // Use athleteUserId (the user table ID) for the dropdown; fall back to athleteId
    const athleteDropdownId = r.athleteUserId || r.athleteId || '';
    this.form.patchValue({
      competitionId: r.competitionId ?? '',
      eventId: r.eventId ?? '',
      athleteId: athleteDropdownId,
      round: r.round ?? 'FINAL',
      performanceValue: r.performanceValue ?? null,
      performanceUnit: r.performanceUnit ?? 's',
      performanceText: r.performanceText ?? '',
      status: r.status ?? 'UNOFFICIAL',
    });
  }

  private buildPayload(): Record<string, unknown> {
    const raw = this.form.getRawValue();
    return {
      competitionId: raw.competitionId,
      eventId: raw.eventId,
      athleteId: raw.athleteId,
      round: raw.round || null,
      performanceValue: raw.performanceValue,
      performanceUnit: raw.performanceUnit?.trim() || null,
      performanceText: raw.performanceText?.trim() || null,
      status: raw.status || null,
    };
  }

  private loadCompetitions(): void {
    this.competitionsLoading.set(true);
    this.api.getPaged<CompetitionOption>('/competitions', {
      page: 0,
      size: 200,
      sort: 'startDate,desc',
    }).subscribe({
      next: page => {
        this.competitions.set(page.content ?? []);
        this.competitionsLoading.set(false);
      },
      error: () => {
        this.competitionsLoading.set(false);
        this.notify.error('Unable to load competitions.');
      },
    });
  }

  private loadEvents(competitionId: string, callback?: () => void): void {
    this.eventsLoading.set(true);
    this.api.get<EventOption[]>('/competition-events', { competitionId }).subscribe({
      next: items => {
        this.events.set(items ?? []);
        this.eventsLoading.set(false);
        if (callback) callback();
      },
      error: () => {
        this.events.set([]);
        this.eventsLoading.set(false);
        this.notify.error('Unable to load events for this competition.');
        if (callback) callback();
      },
    });
  }

  private loadAthletes(): void {
    this.athletesLoading.set(true);
    this.api.getPaged<AthleteUserOption>('/users', {
      page: 0,
      size: 200,
      sort: 'lastName,asc',
      role: 'ROLE_ATHLETE',
    }).subscribe({
      next: page => {
        this.athletes.set(page.content ?? []);
        this.athletesLoading.set(false);
      },
      error: () => {
        this.athletesLoading.set(false);
        this.notify.error('Unable to load athlete users.');
      },
    });
  }
}
