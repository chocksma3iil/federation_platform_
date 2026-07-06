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
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header
      [title]="isEdit ? 'Edit Club' : 'Add Club'"
      [subtitle]="isEdit ? 'Update club information' : 'Register a new federation club'"
      [breadcrumbs]="[
        { label: 'Admin', path: '/admin' },
        { label: 'Clubs', path: '/admin/clubs' },
        { label: isEdit ? 'Edit' : 'New' }
      ]">
    </app-page-header>

    @if (initLoading()) {
      <app-loading-spinner message="Loading club…" />
    } @else {
      <div class="max-w-3xl">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-padded space-y-4">
          <h3 class="font-semibold text-surface-800 border-b border-surface-100 pb-3">
            Club Information
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Club Name</mat-label>
              <input matInput formControlName="name" />
              @if (f['name'].hasError('required') && f['name'].touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Short Name</mat-label>
              <input matInput formControlName="shortName" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>License Number</mat-label>
              <input matInput formControlName="licenseNumber" />
              @if (f['licenseNumber'].hasError('required') && f['licenseNumber'].touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="ACTIVE">Active</mat-option>
                <mat-option value="SUSPENDED">Suspended</mat-option>
                <mat-option value="DISSOLVED">Dissolved</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>City</mat-label>
              <input matInput formControlName="city" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Region</mat-label>
              <input matInput formControlName="region" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Country</mat-label>
              <input matInput formControlName="country" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Founded Year</mat-label>
              <input matInput type="number" formControlName="foundedYear" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="md:col-span-2">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Website</mat-label>
              <input matInput formControlName="website" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Logo URL</mat-label>
              <input matInput formControlName="logoUrl" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              @if (f['email'].hasError('email') && f['email'].touched) {
                <mat-error>Invalid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="md:col-span-2">
              <mat-label>Manager</mat-label>
              <mat-select formControlName="managerId">
                <mat-option [value]="null">— None —</mat-option>
                @for (m of managers(); track m.id) {
                  <mat-option [value]="m.id">{{ m.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea matInput rows="4" formControlName="description"></textarea>
          </mat-form-field>

          <div class="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <a mat-stroked-button routerLink="/admin/clubs">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { Saving… } @else { {{ isEdit ? 'Update Club' : 'Create Club' }} }
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class ClubFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = signal(false);
  initLoading = signal(false);
  isEdit = false;
  clubId?: string;
  managers = signal<{id: string; label: string}[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    shortName: [''],
    licenseNumber: ['', Validators.required],
    city: [''],
    region: [''],
    country: ['Tunisia'],
    address: [''],
    foundedYear: [null as number | null],
    description: [''],
    logoUrl: [''],
    website: [''],
    email: ['', Validators.email],
    phone: [''],
    status: ['ACTIVE'],
    managerId: [null as string | null],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.clubId = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEdit = !!this.clubId;

    this.loadManagers();

    if (this.isEdit) {
      this.initLoading.set(true);
      this.api.get<any>(`/clubs/${this.clubId}`).subscribe({
        next: club => {
          this.form.patchValue(club);
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
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      name: raw.name?.trim(),
      licenseNumber: raw.licenseNumber?.trim(),
      shortName: raw.shortName?.trim() ? raw.shortName.trim().toUpperCase() : '',
      country: raw.country?.trim(),
    };
    const req$ = this.isEdit
      ? this.api.put(`/clubs/${this.clubId}`, payload)
      : this.api.post('/clubs', payload);

    req$.subscribe({
      next: () => {
        this.notify.success(this.isEdit ? 'Club updated.' : 'Club created.');
        this.router.navigate(['/admin/clubs']);
      },
      error: () => this.saving.set(false),
    });
  }

  private loadManagers(): void {
    this.api.getPaged<any>('/users', { page: 0, size: 500, role: 'ROLE_CLUB_MANAGER' }).subscribe({
      next: p => this.managers.set(p.content.map((u: any) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))),
    });
  }
}
