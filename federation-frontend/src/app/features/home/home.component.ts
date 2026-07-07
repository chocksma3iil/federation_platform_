import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { catchError, forkJoin, map, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';

interface HomeStat {
  value: number;
  label: string;
  tone: string;
}

@Component({
  selector:   'app-home',
  standalone: true,
  imports:    [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <!-- Hero -->
    <section class="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_30%),linear-gradient(135deg,_#0f766e_0%,_#0f4c81_48%,_#172554_100%)] text-white">
      <div class="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl"></div>
      <div class="absolute right-0 top-0 h-96 w-96 translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-200/10 blur-3xl"></div>
      <div class="absolute inset-0 opacity-10"
           style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2272%22 height=%2272%22><circle cx=%2236%22 cy=%2236%22 r=%221.5%22 fill=%22white%22/></svg>')">
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              <mat-icon class="!text-base">emoji_events</mat-icon>
              Official Sports Federation Platform
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight">
              Athletics operations,<br/>
              <span class="text-cyan-200">live and federation-wide</span>
            </h1>
            <p class="text-lg text-cyan-50/90 max-w-2xl mb-8 leading-relaxed">
              Athletes, clubs, competitions, results, and federation updates in one connected platform with real public numbers from the current database.
            </p>
            <div class="flex flex-wrap gap-3">
              <a mat-flat-button routerLink="/competitions"
                 class="!bg-white !text-primary-700 !font-semibold !px-6 !py-3 !rounded-xl">
                View Competitions
              </a>
              <a mat-stroked-button routerLink="/auth/register"
                 class="!border-white !text-white !px-6 !py-3 !rounded-xl">
                Join the Federation
              </a>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div class="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-md shadow-card-lg">
              <p class="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Live federation snapshot</p>
              <p class="mt-3 text-3xl font-black">{{ heroMetric() | number }}</p>
              <p class="mt-2 text-sm text-cyan-50/80">Total tracked records across the public platform overview.</p>
            </div>
            <div class="rounded-[28px] border border-white/12 bg-black/10 p-5 backdrop-blur-md shadow-card-lg">
              <p class="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Current public dataset</p>
              <div class="mt-4 grid grid-cols-2 gap-3">
                @for (stat of stats(); track stat.label) {
                  <div class="rounded-2xl bg-white/8 px-4 py-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-cyan-100/65">{{ stat.label }}</p>
                    <p class="mt-1 text-2xl font-bold">{{ stat.value | number }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats strip -->
    <section class="border-b border-surface-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (stat of stats(); track stat.label) {
            <div class="rounded-3xl border border-surface-200/80 bg-white p-5 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-card-md">
              <div [class]="'mx-auto mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r ' + stat.tone"></div>
              <p class="text-3xl font-black tracking-tight text-surface-900">{{ stat.value | number }}</p>
              <p class="text-sm text-surface-500 mt-1">{{ stat.label }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Feature cards -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-surface-900">Everything you need</h2>
        <p class="mt-3 text-surface-500 max-w-xl mx-auto">
          One platform covering the full lifecycle of sports management.
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (card of featureCards; track card.title) {
          <a [routerLink]="card.path"
             class="group rounded-[26px] border border-surface-200/80 bg-white p-6 shadow-sm hover:shadow-card-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center mb-4 ' + card.bg">
              <mat-icon [class]="'!text-2xl ' + card.color">{{ card.icon }}</mat-icon>
            </div>
            <h3 class="font-semibold text-surface-900 mb-1 group-hover:text-primary-600
                       transition-colors">
              {{ card.title }}
            </h3>
            <p class="text-sm text-surface-500 leading-relaxed">{{ card.desc }}</p>
          </a>
        }
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);

  readonly stats = signal<HomeStat[]>([
    { value: 0, label: 'Registered Athletes', tone: 'from-green-500 via-emerald-500 to-teal-500' },
    { value: 0, label: 'Active Clubs', tone: 'from-sky-500 via-cyan-500 to-blue-500' },
    { value: 0, label: 'Competitions', tone: 'from-amber-500 via-orange-500 to-yellow-500' },
    { value: 0, label: 'Published News', tone: 'from-rose-500 via-pink-500 to-fuchsia-500' },
  ]);

  readonly featureCards = [
    {
      title: 'Competitions',
      desc:  'Browse upcoming and past competitions, schedules and venues.',
      icon:  'emoji_events', path: '/competitions',
      bg:    'bg-amber-100',  color: 'text-amber-600',
    },
    {
      title: 'Athletes',
      desc:  'Search athlete profiles, categories and personal bests.',
      icon:  'directions_run', path: '/athletes',
      bg:    'bg-green-100',   color: 'text-green-600',
    },
    {
      title: 'Clubs',
      desc:  'Discover clubs across regions and their rosters.',
      icon:  'groups', path: '/clubs',
      bg:    'bg-blue-100',  color: 'text-blue-600',
    },
    {
      title: 'Results',
      desc:  'Official results, rankings, and national records.',
      icon:  'leaderboard', path: '/results',
      bg:    'bg-purple-100', color: 'text-purple-600',
    },
    {
      title: 'News',
      desc:  'Latest federation news, press releases, and announcements.',
      icon:  'article', path: '/news',
      bg:    'bg-rose-100',   color: 'text-rose-600',
    },
    {
      title: 'My Account',
      desc:  'Register for competitions, track your results and manage your profile.',
      icon:  'manage_accounts', path: '/auth/login',
      bg:    'bg-teal-100',     color: 'text-teal-600',
    },
  ];

  ngOnInit(): void {
    forkJoin({
      athletes: this.api.getPaged<any>('/users', { page: 0, size: 1, role: 'ROLE_ATHLETE', status: 'ACTIVE' }).pipe(
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
      this.stats.set([
        { value: athletes, label: 'Registered Athletes', tone: 'from-green-500 via-emerald-500 to-teal-500' },
        { value: clubs, label: 'Active Clubs', tone: 'from-sky-500 via-cyan-500 to-blue-500' },
        { value: competitions, label: 'Competitions', tone: 'from-amber-500 via-orange-500 to-yellow-500' },
        { value: news, label: 'Published News', tone: 'from-rose-500 via-pink-500 to-fuchsia-500' },
      ]);
    });
  }

  heroMetric(): number {
    return this.stats().reduce((sum, stat) => sum + stat.value, 0);
  }
}
