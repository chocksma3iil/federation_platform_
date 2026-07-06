import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/models';

interface CompetitionOption {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
}

interface EventOption {
  id: string;
  name: string;
  discipline: string;
  genderCategory: string | null;
  ageCategory: string | null;
  competitionId: string;
  maxParticipants: number | null;
}

interface ClubOption {
  id: string;
  name: string;
}

interface AthleteOption {
  userId: string;
  athleteId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  clubId?: string;
}

@Component({
  selector: 'app-register-competition',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header
      title="Register for Competition"
      subtitle="Fill full registration: competition, event, club, and athlete"
      [breadcrumbs]="[{ label: 'Portal' }, { label: 'Register' }]">
      <a mat-stroked-button routerLink="/portal/registrations" actions>
        <mat-icon>arrow_back</mat-icon> My Registrations
      </a>
    </app-page-header>

    <div class="max-w-xl">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-padded space-y-4">

        <!-- Competition dropdown -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Competition</mat-label>
          <mat-select formControlName="competitionId" (selectionChange)="onCompetitionChange()">
            @for (c of competitions(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }} ({{ c.sport }}) — {{ c.startDate | date:'mediumDate' }}</mat-option>
            }
          </mat-select>
          @if (competitions().length === 0) {
            <mat-hint>No competitions open for registration</mat-hint>
          }
        </mat-form-field>

        <!-- Event dropdown (filtered by competition) -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Event</mat-label>
          <mat-select formControlName="eventId">
            @for (e of visibleEvents(); track e.id) {
              <mat-option [value]="e.id">
                {{ e.name }} ({{ e.discipline }})
                @if (e.genderCategory) { — {{ e.genderCategory }} }
                @if (e.ageCategory) { / {{ e.ageCategory }} }
              </mat-option>
            }
          </mat-select>
          @if (form.get('competitionId')?.value && visibleEvents().length === 0) {
            <mat-hint>No events available for this competition</mat-hint>
          }
          @if (!form.get('competitionId')?.value) {
            <mat-hint>Select competition first</mat-hint>
          }
        </mat-form-field>

        @if (isStaffOrAdmin()) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Club</mat-label>
            <mat-select formControlName="clubId" (selectionChange)="onClubChange()">
              @for (c of clubs(); track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Athlete</mat-label>
            <mat-select formControlName="athleteId">
              @for (a of athletesByClub(); track a.userId) {
                <mat-option [value]="a.userId">{{ a.firstName }} {{ a.lastName }} ({{ a.licenseNumber }})</mat-option>
              }
            </mat-select>
            @if (form.get('clubId')?.value && athletesByClub().length === 0) {
              <mat-hint>No athletes found for selected club</mat-hint>
            }
          </mat-form-field>
        }

        <!-- Optional fields -->
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Seed Value (optional)</mat-label>
            <input matInput type="number" formControlName="seedValue" step="0.01" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Seed Unit</mat-label>
            <input matInput formControlName="seedUnit" placeholder="e.g. seconds, meters" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>

        <div class="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <a mat-stroked-button routerLink="/portal/registrations">Cancel</a>
          <button mat-flat-button color="primary" type="submit"
                  [disabled]="form.invalid || submitting()">
            @if (submitting()) { Registering… } @else { Register }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class RegisterCompetitionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  competitions = signal<CompetitionOption[]>([]);
  events = signal<EventOption[]>([]);
  selectedCompetitionId = signal<string>('');
  visibleEvents = signal<EventOption[]>([]);
  clubs = signal<ClubOption[]>([]);
  athletesByClub = signal<AthleteOption[]>([]);
  submitting = signal(false);

  readonly isStaffOrAdmin = computed(() =>
    this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF])
  );

  form = this.fb.group({
    competitionId: ['', Validators.required],
    eventId: ['', Validators.required],
    clubId: [''],
    athleteId: [''],
    seedValue: [null as number | null],
    seedUnit: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadCompetitions();
    if (this.isStaffOrAdmin()) {
      this.loadClubs();
    }
  }

  onCompetitionChange(): void {
    this.form.get('eventId')?.reset('');
    const competitionId = this.form.get('competitionId')?.value ?? '';
    this.selectedCompetitionId.set(competitionId);
    if (!competitionId) {
      this.events.set([]);
      this.visibleEvents.set([]);
      return;
    }
    this.loadEventsByCompetition(competitionId);
  }

  onClubChange(): void {
    this.form.get('athleteId')?.reset('');
    const clubId = this.form.get('clubId')?.value;
    if (!clubId) {
      this.athletesByClub.set([]);
      return;
    }
    this.loadAthletesByClub(clubId);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.isStaffOrAdmin()) {
      if (!this.form.value.clubId || !this.form.value.athleteId) {
        this.notify.error('Please select club and athlete.');
        return;
      }
    }

    this.submitting.set(true);

    const basePayload = {
      competitionId: this.form.value.competitionId,
      eventId: this.form.value.eventId,
      seedValue: this.form.value.seedValue,
      seedUnit: this.form.value.seedUnit,
      notes: this.form.value.notes,
      medicalWaiver: false,
    };

    const endpoint = this.isStaffOrAdmin() ? '/registrations' : '/registrations/me';
    const payload = this.isStaffOrAdmin()
      ? { ...basePayload, athleteUserId: this.form.value.athleteId }
      : basePayload;

    this.api.post(endpoint, payload).subscribe({
      next: () => {
        this.notify.success('Registration submitted successfully!');
        this.router.navigate(['/portal/registrations']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err?.error?.message ?? 'Registration failed. Check eligibility.');
      },
    });
  }

  private loadCompetitions(): void {
    // Load all competitions so events can always be linked in the dropdown.
    // Backend still enforces registration-open rules on submit.
    this.api.getPaged<CompetitionOption>('/competitions', {
      page: 0, size: 500,
    }).subscribe({
      next: p => {
        const comps = p.content ?? [];
        this.competitions.set(comps);
        if (comps.length > 0 && !this.form.get('competitionId')?.value) {
          this.form.get('competitionId')?.setValue(comps[0].id);
          this.selectedCompetitionId.set(comps[0].id);
          this.loadEventsByCompetition(comps[0].id);
        } else if (comps.length === 0) {
          this.events.set([]);
          this.visibleEvents.set([]);
        }
      },
    });
  }

  private loadEventsByCompetition(competitionId: string): void {
    this.api.get<EventOption[]>('/competition-events', { competitionId }).subscribe({
      next: events => {
        const scoped = events ?? [];
        if (scoped.length > 0) {
          this.events.set(scoped);
          this.visibleEvents.set(scoped);
          return;
        }

        // Fallback: some environments return empty for filtered endpoint while
        // full list still contains event-to-competition bindings.
        this.loadAllEventsFallback(competitionId);
      },
      error: () => this.loadAllEventsFallback(competitionId),
    });
  }

  private loadAllEventsFallback(competitionId: string): void {
    this.api.get<EventOption[]>('/competition-events').subscribe({
      next: events => {
        const all = events ?? [];
        this.events.set(all);
        this.visibleEvents.set(all.filter(e => this.eventBelongsToCompetition(e, competitionId)));
      },
      error: () => {
        this.events.set([]);
        this.visibleEvents.set([]);
        this.notify.error('Could not load competition events.');
      },
    });
  }

  private eventBelongsToCompetition(event: EventOption | any, competitionId: string): boolean {
    const eventCompetitionId =
      event?.competitionId ??
      event?.competition?.id ??
      event?.competition?.competitionId ??
      '';
    return String(eventCompetitionId) === String(competitionId);
  }

  private loadClubs(): void {
    this.api.getPaged<ClubOption>('/clubs', { page: 0, size: 500 }).subscribe({
      next: p => this.clubs.set(p.content ?? []),
    });
  }

  private loadAthletesByClub(clubId: string): void {
    this.api.get<AthleteOption[]>('/users/athlete-users', { clubId }).subscribe({
      next: users => this.athletesByClub.set(users ?? []),
      error: () => this.athletesByClub.set([]),
    });
  }
}
