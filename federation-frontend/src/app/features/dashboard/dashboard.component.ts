import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule }   from '@angular/router';
import { MatIconModule }  from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { catchError, forkJoin, map, of } from 'rxjs';

import { AuthService }    from '@core/services/auth.service';
import { ApiService }     from '@core/services/api.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { RelativeTimePipe, RoleLabelPipe } from '@shared/pipes';
import { UserRole } from '@core/models';

interface StatCard {
  label:    string;
  value:    number;
  icon:     string;
  iconBg:   string;
  iconColor:string;
  change?:  string;
  accent:   string;
  path:     string;
}

interface StatusItem {
  label: string;
  value: string;
  dotColor: string;
}

@Component({
  selector:   'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    PageHeaderComponent, LoadingSpinnerComponent, RelativeTimePipe, RoleLabelPipe,
  ],
  template: `
    <app-page-header
      title="Dashboard"
      subtitle="Federation overview and quick actions"
      [breadcrumbs]="[{ label: 'Admin' }, { label: 'Dashboard' }]">
    </app-page-header>

    <!-- Welcome banner -->
    <div class="relative mb-6 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_32%),linear-gradient(135deg,_#0f766e_0%,_#155e75_52%,_#1d4ed8_100%)] p-6 text-white shadow-card-lg sm:p-8">
      <div class="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      <div class="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-cyan-300/20 blur-2xl"></div>
      <div class="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-50">
            <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
            Live federation pulse
          </div>
          <p class="mt-4 text-sm text-cyan-50/90">Good {{ greeting }},</p>
          <h2 class="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{{ auth.currentUser()?.fullName }}</h2>
          <p class="mt-2 text-sm text-cyan-50/80 sm:text-base">
            {{ auth.currentUser()?.role | roleLabel }}
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <div class="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-[11px] uppercase tracking-[0.18em] text-cyan-50/75">Tracked entities</p>
              <p class="mt-1 text-2xl font-bold">{{ trackedRecords() | number }}</p>
            </div>
            <div class="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-[11px] uppercase tracking-[0.18em] text-cyan-50/75">Last login</p>
              <p class="mt-1 text-sm font-semibold">
                {{ auth.currentUser()?.lastLogin | relativeTime }}
              </p>
            </div>
            <div class="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-[11px] uppercase tracking-[0.18em] text-cyan-50/75">Last refresh</p>
              <p class="mt-1 text-sm font-semibold">
                {{ lastUpdated() ? (lastUpdated() | date:'shortTime') : 'Pending' }}
              </p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:w-[22rem]">
          @for (card of heroHighlights(); track card.label) {
            <div class="rounded-2xl border border-white/12 bg-black/10 p-4 backdrop-blur-sm">
              <p class="text-xs uppercase tracking-[0.18em] text-cyan-50/70">{{ card.label }}</p>
              <p class="mt-2 text-2xl font-bold text-white">{{ card.value | number }}</p>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    @if (loading()) {
      <div class="flex justify-center py-12">
        <app-loading-spinner [size]="48" message="Loading stats…" />
      </div>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        @for (card of statCards; track card.label) {
          <a [routerLink]="card.path"
             class="group relative overflow-hidden rounded-3xl border border-surface-200/80 bg-white/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-md">
            <div [class]="'absolute inset-x-0 top-0 h-1 bg-gradient-to-r ' + card.accent"></div>
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-surface-400">
                  {{ card.label }}
                </p>
                <p class="mt-3 text-3xl font-black tracking-tight text-surface-900 group-hover:text-primary-700 transition-colors">
                  {{ card.value | number }}
                </p>
                <p class="mt-1 text-sm text-surface-500">Live total from current platform data</p>
                @if (card.change) {
                  <p class="mt-2 text-xs font-medium text-green-600">{{ card.change }}</p>
                }
              </div>
              <div [class]="'flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ring-1 ring-black/5 ' + card.iconBg">
                <mat-icon [class]="'!text-2xl ' + card.iconColor">{{ card.icon }}</mat-icon>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between text-xs font-medium text-surface-500">
              <span>Open details</span>
              <mat-icon class="!text-base transition-transform group-hover:translate-x-1">arrow_forward</mat-icon>
            </div>
          </a>
        }
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Quick links -->
        <div class="card-padded rounded-[26px] border border-surface-200/80 bg-[linear-gradient(180deg,_rgba(15,118,110,0.05),_rgba(255,255,255,0.96))]">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold text-surface-900">Quick Actions</h3>
              <p class="mt-1 text-sm text-surface-500">Jump straight into the next operational task.</p>
            </div>
            <div class="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-surface-500 shadow-sm">
              {{ quickActionCount() }} available
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            @for (action of quickActions; track action.label) {
              @if (action.visible) {
                <a [routerLink]="action.path"
                   class="group flex flex-col items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white">
                  <div [class]="'w-10 h-10 rounded-lg flex items-center justify-center ' + action.bg">
                    <mat-icon [class]="action.color + ' !text-xl'">{{ action.icon }}</mat-icon>
                  </div>
                  <span class="text-xs font-medium text-surface-700 group-hover:text-primary-700">
                    {{ action.label }}
                  </span>
                </a>
              }
            }
          </div>
        </div>

        <!-- Platform info -->
        <div class="card-padded rounded-[26px] border border-surface-200/80 bg-white/95">
          <div class="mb-4">
            <h3 class="font-semibold text-surface-900">Platform Status</h3>
            <p class="mt-1 text-sm text-surface-500">Live environment snapshot for the current admin workspace.</p>
          </div>
          <div class="space-y-3">
            @for (item of statusItems(); track item.label) {
              <div class="flex items-center justify-between rounded-2xl border border-surface-100 bg-surface-50/80 px-4 py-3 last:border-surface-100">
                <div class="flex items-center gap-2">
                  <div [class]="'w-2 h-2 rounded-full ' + item.dotColor"></div>
                  <span class="text-sm text-surface-600">{{ item.label }}</span>
                </div>
                <span class="text-sm font-medium text-surface-800">{{ item.value }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  readonly auth    = inject(AuthService);
  private api      = inject(ApiService);

  loading = signal(true);
  lastUpdated = signal<Date | null>(null);

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  roleLabel(role: string | undefined): string {
    const map: Record<string, string> = {
      ROLE_ADMIN: 'Administrator', ROLE_FEDERATION_STAFF: 'Federation Staff',
      ROLE_CLUB_MANAGER: 'Club Manager', ROLE_ATHLETE: 'Athlete',
    };
    return map[role ?? ''] ?? role ?? '';
  }

  statCards: StatCard[] = [
    { label: 'Active Athletes',  value: 0, icon: 'directions_run',
      iconBg: 'bg-green-500/15',   iconColor: 'text-green-700', accent: 'from-green-500 via-emerald-500 to-teal-500', path: '/admin/athletes' },
    { label: 'Active Clubs',     value: 0, icon: 'groups',
      iconBg: 'bg-sky-500/15',    iconColor: 'text-sky-700', accent: 'from-sky-500 via-cyan-500 to-blue-600', path: '/admin/clubs' },
    { label: 'Competitions',     value: 0, icon: 'emoji_events',
      iconBg: 'bg-amber-500/15',   iconColor: 'text-amber-700', accent: 'from-amber-500 via-orange-500 to-yellow-500', path: '/admin/competitions' },
    { label: 'Published News',   value: 0, icon: 'article',
      iconBg: 'bg-rose-500/15',  iconColor: 'text-rose-700', accent: 'from-rose-500 via-pink-500 to-fuchsia-500', path: '/admin/news' },
  ];

  readonly quickActions = [
    { label: 'Add Athlete',     path: '/admin/athletes/new',      icon: 'person_add',
      bg: 'bg-green-100',  color: 'text-green-600',
      visible: this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF, UserRole.CLUB_MANAGER]) },
    { label: 'New Competition', path: '/admin/competitions/new',  icon: 'add_circle',
      bg: 'bg-amber-100',  color: 'text-amber-600',
      visible: this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]) },
    { label: 'Enter Results',   path: '/admin/results/new',       icon: 'leaderboard',
      bg: 'bg-purple-100', color: 'text-purple-600',
      visible: this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]) },
    { label: 'Write News',      path: '/admin/news/new',          icon: 'edit_note',
      bg: 'bg-rose-100',   color: 'text-rose-600',
      visible: this.auth.hasAnyRole([UserRole.ADMIN, UserRole.FEDERATION_STAFF]) },
    { label: 'Manage Users',    path: '/admin/users',             icon: 'manage_accounts',
      bg: 'bg-red-100',    color: 'text-red-600',
      visible: this.auth.hasRole(UserRole.ADMIN) },
    { label: 'My Profile',      path: '/admin/profile',           icon: 'person',
      bg: 'bg-teal-100',   color: 'text-teal-600',
      visible: true },
  ];

  readonly statusItems = signal<StatusItem[]>([
    { label: 'API Status',       value: 'Operational', dotColor: 'bg-green-500' },
    { label: 'Live Data',        value: 'Syncing…',    dotColor: 'bg-amber-500' },
    { label: 'Angular Version',  value: '19.x',        dotColor: 'bg-sky-500'  },
    { label: 'Spring Boot',      value: '3.2.x',       dotColor: 'bg-emerald-500' },
  ]);

  trackedRecords(): number {
    return this.statCards.reduce((sum, card) => sum + card.value, 0);
  }

  heroHighlights(): StatCard[] {
    return this.statCards.slice(0, 2);
  }

  quickActionCount(): number {
    return this.quickActions.filter(action => action.visible).length;
  }

  ngOnInit(): void {
    forkJoin({
      athletes: this.api.getPaged<any>('/athletes', { page: 0, size: 1, status: 'ACTIVE' }).pipe(
        map(page => page.totalElements ?? 0),
        catchError(() => of(0)),
      ),
      clubs: this.api.getPaged<any>('/clubs', { page: 0, size: 1, status: 'ACTIVE' }).pipe(
        map(page => page.totalElements ?? 0),
        catchError(() => of(0)),
      ),
      competitions: this.api.getPaged<any>('/competitions', { page: 0, size: 1 }).pipe(
        map(page => page.totalElements ?? 0),
        catchError(() => of(0)),
      ),
      news: this.api.getPaged<any>('/news', { page: 0, size: 1, status: 'PUBLISHED' }).pipe(
        map(page => page.totalElements ?? 0),
        catchError(() => of(0)),
      ),
    }).subscribe(({ athletes, clubs, competitions, news }) => {
      this.statCards[0].value = athletes;
      this.statCards[1].value = clubs;
      this.statCards[2].value = competitions;
      this.statCards[3].value = news;
      this.lastUpdated.set(new Date());
      this.statusItems.set([
        { label: 'API Status', value: 'Operational', dotColor: 'bg-green-500' },
        { label: 'Live Data', value: 'Synced just now', dotColor: 'bg-green-500' },
        { label: 'Angular Version', value: '19.x', dotColor: 'bg-sky-500' },
        { label: 'Spring Boot', value: '3.2.x', dotColor: 'bg-emerald-500' },
      ]);
      this.loading.set(false);
    });
  }
}
