import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { UserRole } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

interface EventItem {
  id: string;
  name: string;
  code?: string;
  discipline: string;
  genderCategory?: string;
  ageCategory?: string;
  competitionId: string;
  competitionName?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  maxParticipants?: number;
}

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading competition..." />
    } @else if (competition()) {
      <app-page-header
        [title]="competition()!.name"
        [subtitle]="competition()!.sport"
        [breadcrumbs]="[{ label: 'Competitions', path: '/admin/competitions' }, { label: competition()!.name }]">
        <a mat-stroked-button routerLink="/admin/competitions" actions><mat-icon>arrow_back</mat-icon> Back</a>
        @if (canManage) {
          <a mat-stroked-button [routerLink]="['/admin/competitions', competition()!.id, 'edit']" actions>
            <mat-icon>edit</mat-icon> Edit
          </a>
          <button mat-flat-button color="warn" (click)="confirmDelete()" actions>
            <mat-icon>delete</mat-icon> Delete
          </button>
        }
      </app-page-header>

      <div class="card-padded space-y-3 mb-6">
        <p class="text-surface-700">{{ competition()!.description || 'No description.' }}</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div><span class="text-surface-500 text-sm">Status:</span> <span class="text-sm font-medium">{{ competition()!.status }}</span></div>
          <div><span class="text-surface-500 text-sm">Level:</span> <span class="text-sm font-medium">{{ competition()!.level || '—' }}</span></div>
          <div><span class="text-surface-500 text-sm">Format:</span> <span class="text-sm font-medium">{{ competition()!.format || '—' }}</span></div>
          <div><span class="text-surface-500 text-sm">Venue:</span> <span class="text-sm font-medium">{{ competition()!.venueCity || 'TBD' }}</span></div>
          <div><span class="text-surface-500 text-sm">Start:</span> <span class="text-sm font-medium">{{ competition()!.startDate | date:'mediumDate' }}</span></div>
          <div><span class="text-surface-500 text-sm">End:</span> <span class="text-sm font-medium">{{ competition()!.endDate | date:'mediumDate' }}</span></div>
        </div>
      </div>

      <!-- Events Section -->
      <div class="card-padded">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-surface-800 text-lg">Events ({{ events().length }})</h3>
          @if (canManage) {
            <button mat-flat-button color="primary" (click)="showEventForm = !showEventForm">
              <mat-icon>{{ showEventForm ? 'close' : 'add' }}</mat-icon>
              {{ showEventForm ? 'Cancel' : 'Add Event' }}
            </button>
          }
        </div>

        @if (showEventForm && canManage) {
          <form [formGroup]="eventForm" (ngSubmit)="submitEvent()" class="border border-surface-200 rounded-lg p-4 mb-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <mat-form-field appearance="outline">
                <mat-label>Event Name</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Discipline</mat-label>
                <input matInput formControlName="discipline" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Code</mat-label>
                <input matInput formControlName="code" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Gender Category</mat-label>
                <mat-select formControlName="genderCategory">
                  <mat-option [value]="null">Any</mat-option>
                  <mat-option value="MALE">Male</mat-option>
                  <mat-option value="FEMALE">Female</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Age Category</mat-label>
                <mat-select formControlName="ageCategory">
                  <mat-option [value]="null">Any</mat-option>
                  <mat-option value="YOUTH">Youth</mat-option>
                  <mat-option value="JUNIOR">Junior</mat-option>
                  <mat-option value="SENIOR">Senior</mat-option>
                  <mat-option value="MASTERS">Masters</mat-option>
                  <mat-option value="GRAND_MASTERS">Grand Masters</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Max Participants</mat-label>
                <input matInput type="number" formControlName="maxParticipants" />
              </mat-form-field>
            </div>
            <div class="flex justify-end">
              <button mat-flat-button color="primary" type="submit" [disabled]="eventForm.invalid || eventSaving()">
                {{ eventSaving() ? 'Saving…' : 'Save Event' }}
              </button>
            </div>
          </form>
        }

        @if (events().length === 0) {
          <p class="text-center text-surface-400 py-8">No events created yet for this competition.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th class="text-left p-3 font-semibold">Name</th>
                  <th class="text-left p-3 font-semibold">Discipline</th>
                  <th class="text-left p-3 font-semibold">Gender</th>
                  <th class="text-left p-3 font-semibold">Age Category</th>
                  <th class="text-left p-3 font-semibold">Max</th>
                  @if (canManage) { <th class="text-left p-3 font-semibold">Actions</th> }
                </tr>
              </thead>
              <tbody>
                @for (e of events(); track e.id) {
                  <tr class="border-b border-surface-100">
                    <td class="p-3">{{ e.name }}</td>
                    <td class="p-3">{{ e.discipline }}</td>
                    <td class="p-3">{{ e.genderCategory || 'Any' }}</td>
                    <td class="p-3">{{ e.ageCategory || 'Any' }}</td>
                    <td class="p-3">{{ e.maxParticipants || '—' }}</td>
                    @if (canManage) {
                      <td class="p-3">
                        <button mat-icon-button color="warn" (click)="deleteEvent(e)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
})
export class CompetitionDetailComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  get canManage(): boolean {
    return this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]);
  }

  competition = signal<any | null>(null);
  loading = signal(true);
  events = signal<EventItem[]>([]);
  eventSaving = signal(false);
  showEventForm = false;

  eventForm = this.fb.group({
    name: ['', Validators.required],
    discipline: ['', Validators.required],
    code: [''],
    genderCategory: [null as string | null],
    ageCategory: [null as string | null],
    maxParticipants: [null as number | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`/competitions/${id}`).subscribe({
      next: c => {
        this.competition.set(c);
        this.loading.set(false);
        this.loadEvents(c.id);
      },
      error: () => this.loading.set(false),
    });
  }

  submitEvent(): void {
    if (this.eventForm.invalid) return;
    this.eventSaving.set(true);
    const payload = {
      ...this.eventForm.value,
      competitionId: this.competition()!.id,
    };
    this.api.post<EventItem>('/competition-events', payload).subscribe({
      next: () => {
        this.notify.success('Event created.');
        this.eventForm.reset();
        this.showEventForm = false;
        this.eventSaving.set(false);
        this.loadEvents(this.competition()!.id);
      },
      error: () => this.eventSaving.set(false),
    });
  }

  deleteEvent(event: EventItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Event', message: `Delete event "${event.name}"?`, confirmText: 'Delete', danger: true },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.delete(`/competition-events/${event.id}`).subscribe({
        next: () => {
          this.notify.success('Event deleted.');
          this.loadEvents(this.competition()!.id);
        },
      });
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

  private loadEvents(competitionId: string): void {
    this.api.get<EventItem[]>('/competition-events', { competitionId }).subscribe({
      next: events => this.events.set(events),
    });
  }
}