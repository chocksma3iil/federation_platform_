import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule }    from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatMenuModule }     from '@angular/material/menu';
import { MatTabsModule }     from '@angular/material/tabs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ApiService }              from '@core/services/api.service';
import { AuthService }             from '@core/services/auth.service';
import { UserRole }                from '@core/models';
import { PageHeaderComponent }     from '@shared/components/page-header/page-header.component';
import { StatusChipComponent }     from '@shared/components/status-chip/status-chip.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent }     from '@shared/components/empty-state/empty-state.component';
import { MatDialog } from '@angular/material/dialog';
import { ClubAiAssistantComponent } from '../club-ai-assistant/club-ai-assistant.component';


export interface Club {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
  region?: string;
  country: string;
  status: string;
  foundedYear?: number;
  logoUrl?: string;
  activeAthletes?: number;
}

@Component({
  selector:   'app-clubs-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatTabsModule,
    PageHeaderComponent, StatusChipComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="Clubs"
      [breadcrumbs]="[{ label: 'Admin', path: '/admin' }, { label: 'Clubs' }]">
      @if (canManage) {
        <a mat-flat-button color="primary" routerLink="new" actions><mat-icon>add</mat-icon> New Club</a>
        <button mat-stroked-button (click)="openAiAssistant()" actions>
          <mat-icon>auto_awesome</mat-icon> Ask AI
        </button>
      }
    </app-page-header>

    <div class="mb-4 overflow-hidden rounded-[26px] border border-surface-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.95))] shadow-sm">
      <div class="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] lg:items-end">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Club directory</p>
          <h2 class="mt-2 text-2xl font-black tracking-tight text-surface-900">Live clubs overview</h2>
          <p class="mt-2 max-w-2xl text-sm text-surface-500">
            Browse every registered club, open the managed roster faster, and keep athlete counts visible on each card.
          </p>
          <mat-form-field appearance="outline" class="mt-4 w-full max-w-md">
            <mat-label>Search clubs…</mat-label>
            <input matInput [formControl]="searchCtrl" autocomplete="off" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">Total clubs</p>
            <p class="mt-2 text-3xl font-black tracking-tight text-surface-900">{{ total() }}</p>
            <p class="mt-1 text-xs text-surface-500">Across the current filtered result set</p>
          </div>
          <div class="rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface-400">Visible athletes</p>
            <p class="mt-2 text-3xl font-black tracking-tight text-surface-900">{{ visibleAthleteTotal() }}</p>
            <p class="mt-1 text-xs text-surface-500">Summed from loaded club cards</p>
          </div>
        </div>
      </div>
    </div>

    @if (showManagerTabs) {
      <div class="card relative">
        <mat-tab-group>
          <mat-tab label="All Clubs">
            @if (loading()) { <app-loading-spinner [overlay]="true" /> }
            @if (!loading() && clubs().length === 0) {
              <app-empty-state icon="groups" title="No clubs found"
                subtitle="No clubs available yet." />
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                @for (club of clubs(); track club.id) {
                  <a [routerLink]="[club.id]"
                     class="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card-md flex items-center gap-4">
                    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-80"></div>
                    @if (club.logoUrl) {
                      <img [src]="club.logoUrl" [alt]="club.name"
                           class="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-surface-50 p-1" />
                    } @else {
                      <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center
                                  text-primary-700 font-bold text-lg flex-shrink-0">
                        {{ (club.shortName ?? club.name).charAt(0) }}
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-surface-900 truncate group-hover:text-primary-600
                                 transition-colors">{{ club.name }}</p>
                      <p class="text-xs text-surface-400 mt-0.5">{{ club.city }}{{ club.region ? ', ' + club.region : '' }}</p>
                      <div class="flex items-center gap-2 mt-1.5">
                        <app-status-chip [status]="club.status" />
                        @if (club.activeAthletes !== undefined) {
                          <span class="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600">{{ club.activeAthletes }} active athletes</span>
                        }
                      </div>
                    </div>
                  </a>
                }
              </div>
              <div class="border-t border-surface-100">
                <mat-paginator [length]="total()" [pageSize]="24" [pageSizeOptions]="[12,24,48]"
                  [pageIndex]="pageIndex()" (page)="onPage($event)" showFirstLastButtons />
              </div>
            }
          </mat-tab>

          <mat-tab label="My Club">
            <div class="relative min-h-56">
              @if (myClubLoading()) { <app-loading-spinner [overlay]="true" /> }
              @if (!myClubLoading() && myClub()) {
                <div class="p-4">
                  <a [routerLink]="[myClub()!.id]"
                     class="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card-md flex items-center gap-4">
                    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-80"></div>
                    @if (myClub()!.logoUrl) {
                      <img [src]="myClub()!.logoUrl" [alt]="myClub()!.name"
                           class="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-surface-50 p-1" />
                    } @else {
                      <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center
                                  text-primary-700 font-bold text-lg flex-shrink-0">
                        {{ (myClub()!.shortName ?? myClub()!.name).charAt(0) }}
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-surface-900 truncate group-hover:text-primary-600 transition-colors">
                        {{ myClub()!.name }}
                      </p>
                      <p class="text-xs text-surface-400 mt-0.5">
                        {{ myClub()!.city }}{{ myClub()!.region ? ', ' + myClub()!.region : '' }}
                      </p>
                      <div class="flex items-center gap-2 mt-1.5">
                        <app-status-chip [status]="myClub()!.status" />
                        @if (myClub()!.activeAthletes !== undefined) {
                          <span class="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600">{{ myClub()!.activeAthletes }} active athletes</span>
                        }
                      </div>
                    </div>
                  </a>

                  <div class="mt-4 flex justify-end gap-2">
                    <a mat-stroked-button [routerLink]="[myClub()!.id]">
                      <mat-icon>visibility</mat-icon> Open Club
                    </a>
                    <a mat-flat-button color="primary" [routerLink]="[myClub()!.id]">
                      <mat-icon>person_add</mat-icon> Add Athletes
                    </a>
                  </div>
                </div>
              } @else if (!myClubLoading()) {
                <app-empty-state icon="groups" title="No managed club"
                  subtitle="No club is assigned to your manager account yet." />
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    } @else {
      <div class="card relative">
        @if (loading()) { <app-loading-spinner [overlay]="true" /> }
        @if (!loading() && clubs().length === 0) {
          <app-empty-state icon="groups" title="No clubs found"
            subtitle="Register your first club to get started."
            [actionLabel]="canManage ? 'New Club' : ''" />
        } @else {
          <!-- Grid layout for clubs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            @for (club of clubs(); track club.id) {
              <a [routerLink]="[club.id]"
                 class="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card-md flex items-center gap-4">
                <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-80"></div>
                @if (club.logoUrl) {
                  <img [src]="club.logoUrl" [alt]="club.name"
                       class="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-surface-50 p-1" />
                } @else {
                  <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center
                              text-primary-700 font-bold text-lg flex-shrink-0">
                    {{ (club.shortName ?? club.name).charAt(0) }}
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-surface-900 truncate group-hover:text-primary-600
                             transition-colors">{{ club.name }}</p>
                  <p class="text-xs text-surface-400 mt-0.5">{{ club.city }}{{ club.region ? ', ' + club.region : '' }}</p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <app-status-chip [status]="club.status" />
                    @if (club.activeAthletes !== undefined) {
                      <span class="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600">{{ club.activeAthletes }} active athletes</span>
                    }
                  </div>
                </div>
              </a>
            }
          </div>
          <div class="border-t border-surface-100">
            <mat-paginator [length]="total()" [pageSize]="24" [pageSizeOptions]="[12,24,48]"
              [pageIndex]="pageIndex()" (page)="onPage($event)" showFirstLastButtons />
          </div>
        }
      </div>
    }
  `,
})
export class ClubsListComponent implements OnInit {
  private api  = inject(ApiService);
  readonly auth = inject(AuthService);

  clubs     = signal<Club[]>([]);
  myClub    = signal<Club | null>(null);
  myClubLoading = signal(false);
  loading   = signal(true);
  total     = signal(0);
  pageIndex = signal(0);
  searchCtrl = new FormControl('');

  get showManagerTabs(): boolean {
    return this.auth.hasRole(UserRole.CLUB_MANAGER);
  }

  get canManage(): boolean {
    return this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]);
  }

  visibleAthleteTotal(): number {
    return this.clubs().reduce((sum, club) => sum + (club.activeAthletes ?? 0), 0);
  }

  ngOnInit(): void {
    this.load();
    if (this.showManagerTabs) {
      this.loadMyClub();
    }
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => { this.pageIndex.set(0); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.pageIndex(), size: 24 };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;

    this.api.getPaged<Club>('/clubs', params).subscribe({
      next:  p => { this.clubs.set(p.content); this.total.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void { this.pageIndex.set(e.pageIndex); this.load(); }

  private loadMyClub(): void {
    const currentUserId = this.auth.currentUser()?.id;
    if (!currentUserId) {
      this.myClub.set(null);
      return;
    }

    this.myClubLoading.set(true);
    this.api.getPaged<any>('/clubs', { page: 0, size: 500 }).subscribe({
      next: p => {
        const all = p.content ?? [];
        const managed = all.find((c: any) => String(c.managerId) === String(currentUserId)) ?? null;
        this.myClub.set(managed);
        this.myClubLoading.set(false);
      },
      error: () => {
        this.myClub.set(null);
        this.myClubLoading.set(false);
      },
    });
  }

  private dialog = inject(MatDialog);

openAiAssistant(): void {
  const ref = this.dialog.open(ClubAiAssistantComponent, { width: '460px', panelClass: 'ai-assistant-panel' });
  ref.afterClosed().subscribe(() => this.load()); // refresh list after any AI-driven change
}

}
