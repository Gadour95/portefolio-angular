import { NgTemplateOutlet } from '@angular/common';

import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import type {
  ChartConfiguration,
  ChartOptions
} from 'chart.js';

import {
  finalize,
  forkJoin
} from 'rxjs';

import {
  DashboardChartPoint,
  DashboardCharts,
  DashboardRecentActivityItem,
  DashboardStats
} from '../../../core/models/dashboard.model';

import {
  DashboardService
} from '../../../core/services/dashboard.service';

import {
  LanguageService
} from '../../../core/services/language.service';

import {
  ThemeService
} from '../../../core/services/theme.service';

import {
  ChartCanvasComponent
} from './chart-canvas.component';

type KpiTone =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'teal'
  | 'slate';

type TagSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'danger'
  | 'secondary'
  | 'contrast';

interface KpiCard {
  labelKey: string;
  value: string;
  hint: string;
  icon: string;
  iconClass: string;
  barClass: string;
  progress: number | null;
}

interface ChartTheme {
  text: string;
  muted: string;
  grid: string;
  border: string;
  surface: string;
}

const CHART_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#0ea5e9',
  '#a855f7',
  '#14b8a6',
  '#f97316'
];

const KPI_TONES: Record<
  KpiTone,
  { iconClass: string; barClass: string }
> = {
  indigo: {
    iconClass:
      'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    barClass: 'bg-indigo-500'
  },
  emerald: {
    iconClass:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    barClass: 'bg-emerald-500'
  },
  amber: {
    iconClass:
      'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    barClass: 'bg-amber-500'
  },
  rose: {
    iconClass:
      'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    barClass: 'bg-rose-500'
  },
  sky: {
    iconClass:
      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    barClass: 'bg-sky-500'
  },
  violet: {
    iconClass:
      'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    barClass: 'bg-violet-500'
  },
  teal: {
    iconClass:
      'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300',
    barClass: 'bg-teal-500'
  },
  slate: {
    iconClass:
      'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300',
    barClass: 'bg-slate-500'
  }
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#f59e0b',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444'
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  PUBLISHED: '#22c55e',
  DRAFT: '#94a3b8'
};

const MESSAGE_STATUS_COLORS: Record<string, string> = {
  UNREAD: '#0ea5e9',
  READ: '#22c55e'
};

const TIMELINE_TYPE_COLORS: Record<string, string> = {
  EXPERIENCE: '#6366f1',
  EDUCATION: '#0ea5e9'
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,

  imports: [
    NgTemplateOutlet,
    TranslatePipe,
    ButtonModule,
    MessageModule,
    TagModule,
    ChartCanvasComponent
  ],

  template: `
    <div class="space-y-6">
      <!-- En-tête -->
      <section
        class="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p
            class="text-xs font-bold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'adminNav.overview' | translate }}
          </p>

          <h1
            class="mt-2 text-2xl font-bold tracking-[-0.035em]
                   sm:text-3xl"
          >
            {{ 'adminPages.dashboard.title' | translate }}
          </h1>

          <p class="mt-2 max-w-2xl app-muted">
            {{ 'adminPages.dashboard.subtitle' | translate }}
          </p>

          @if (lastUpdatedLabel()) {
            <p class="mt-2 text-xs app-muted">
              {{ 'adminDashboard.updatedAt' | translate }}
              {{ lastUpdatedLabel() }}
            </p>
          }
        </div>

        <p-button
          icon="pi pi-refresh"
          [label]="'adminDashboard.refresh' | translate"
          severity="secondary"
          [outlined]="true"
          [loading]="loading()"
          (onClick)="load()"
        />
      </section>

      <!-- Erreur -->
      @if (loadError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      @if (loading() && !stats()) {
        <!-- Squelette de chargement -->
        <div
          class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          @for (item of skeletons; track item) {
            <div
              class="h-32 animate-pulse rounded-2xl
                     bg-[var(--app-surface-muted)]"
            ></div>
          }
        </div>

        <div class="grid gap-6 xl:grid-cols-3">
          <div
            class="h-96 animate-pulse rounded-2xl
                   bg-[var(--app-surface-muted)] xl:col-span-2"
          ></div>

          <div
            class="h-96 animate-pulse rounded-2xl
                   bg-[var(--app-surface-muted)]"
          ></div>
        </div>
      } @else if (stats()) {
        <!-- Indicateurs clés -->
        <div
          class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          @for (kpi of kpis(); track kpi.labelKey) {
            <article
              class="rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] p-5
                     shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p
                    class="text-xs font-semibold uppercase
                           tracking-wide app-muted"
                  >
                    {{ kpi.labelKey | translate }}
                  </p>

                  <p
                    class="mt-2 text-3xl font-bold
                           tracking-[-0.04em]"
                  >
                    {{ kpi.value }}
                  </p>
                </div>

                <span
                  [class]="
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' +
                    kpi.iconClass
                  "
                >
                  <i
                    [class]="kpi.icon + ' text-lg'"
                    aria-hidden="true"
                  ></i>
                </span>
              </div>

              <p class="mt-3 text-xs leading-5 app-muted">
                {{ kpi.hint }}
              </p>

              @if (kpi.progress !== null) {
                <div
                  class="mt-3 h-1.5 overflow-hidden rounded-full
                         bg-[var(--app-surface-muted)]"
                >
                  <div
                    [class]="
                      'h-full rounded-full ' + kpi.barClass
                    "
                    [style.width.%]="kpi.progress"
                  ></div>
                </div>
              }
            </article>
          }
        </div>

        @if (charts(); as chartsData) {
          <!-- Activité et modération -->
          <div class="grid gap-6 xl:grid-cols-3">
            <section
              class="app-panel flex flex-col gap-4 xl:col-span-2"
            >
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.activityTitle'
                        | translate : { months: activityMonths }
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.activitySubtitle'
                        | translate : { months: activityMonths }
                    }}
                  </p>
                </div>

                <span
                  class="rounded-full bg-[var(--app-surface-muted)]
                         px-2.5 py-1 text-xs font-semibold
                         app-muted"
                >
                  {{
                    'adminDashboard.charts.months'
                      | translate : { count: activityMonths }
                  }}
                </span>
              </header>

              @if (hasActivityData()) {
                <div class="h-80">
                  <app-chart-canvas
                    [config]="activityChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.activityTitle'
                        | translate : { months: activityMonths }
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>

            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.reviewsStatusTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.reviewsStatusSubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.reviewsByStatus) }}
                </span>
              </header>

              @if (hasChartData(chartsData.reviewsByStatus)) {
                <div class="h-80">
                  <app-chart-canvas
                    [config]="reviewsByStatusChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.reviewsStatusTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>
          </div>

          <!-- Contenu -->
          <div class="grid gap-6 xl:grid-cols-3">
            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.projectsTechTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.projectsTechSubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.projectsByTechnology) }}
                </span>
              </header>

              @if (hasChartData(chartsData.projectsByTechnology)) {
                <div class="h-72">
                  <app-chart-canvas
                    [config]="projectsByTechnologyChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.projectsTechTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>

            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.skillsCategoryTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.skillsCategorySubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.skillsByCategory) }}
                </span>
              </header>

              @if (hasChartData(chartsData.skillsByCategory)) {
                <div class="h-72">
                  <app-chart-canvas
                    [config]="skillsByCategoryChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.skillsCategoryTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>

            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.reviewsRatingTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.reviewsRatingSubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.reviewsByRating) }}
                </span>
              </header>

              @if (hasChartData(chartsData.reviewsByRating)) {
                <div class="h-72">
                  <app-chart-canvas
                    [config]="reviewsByRatingChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.reviewsRatingTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>
          </div>

          <!-- Répartition -->
          <div class="grid gap-6 xl:grid-cols-3">
            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.projectsStatusTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.projectsStatusSubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.projectsByStatus) }}
                </span>
              </header>

              @if (hasChartData(chartsData.projectsByStatus)) {
                <div class="h-64">
                  <app-chart-canvas
                    [config]="projectsByStatusChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.projectsStatusTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>

            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.messagesStatusTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.messagesStatusSubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.messagesByStatus) }}
                </span>
              </header>

              @if (hasChartData(chartsData.messagesByStatus)) {
                <div class="h-64">
                  <app-chart-canvas
                    [config]="messagesByStatusChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.messagesStatusTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>

            <section class="app-panel flex flex-col gap-4">
              <header
                class="flex flex-wrap items-start justify-between
                       gap-3"
              >
                <div>
                  <h2 class="text-base font-semibold">
                    {{
                      'adminDashboard.charts.timelineTypeTitle'
                        | translate
                    }}
                  </h2>

                  <p class="mt-1 text-xs app-muted">
                    {{
                      'adminDashboard.charts.timelineTypeSubtitle'
                        | translate
                    }}
                  </p>
                </div>

                <span class="chart-total-badge">
                  {{ totalOf(chartsData.timelineByType) }}
                </span>
              </header>

              @if (hasChartData(chartsData.timelineByType)) {
                <div class="h-64">
                  <app-chart-canvas
                    [config]="timelineByTypeChart()"
                    [ariaLabel]="
                      'adminDashboard.charts.timelineTypeTitle'
                        | translate
                    "
                  />
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="emptyChart"
                />
              }
            </section>
          </div>
        }

        <!-- Activité récente -->
        <section class="app-panel">
          <header
            class="flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <h2 class="text-base font-semibold">
                {{ 'adminDashboard.recent.title' | translate }}
              </h2>

              <p class="mt-1 text-xs app-muted">
                {{ 'adminDashboard.recent.subtitle' | translate }}
              </p>
            </div>

            <span class="chart-total-badge">
              {{ recentActivity().length }}
            </span>
          </header>

          @if (recentActivity().length > 0) {
            <ul
              class="mt-4 divide-y
                     divide-[var(--app-border)]"
            >
              @for (
                item of recentActivity();
                track item.type + item.createdAt + item.title
              ) {
                <li
                  class="flex flex-wrap items-start gap-3 py-3
                         sm:flex-nowrap"
                >
                  <span
                    [class]="
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' +
                      activityIconClass(item)
                    "
                  >
                    <i
                      [class]="activityIcon(item) + ' text-sm'"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium">
                      {{ item.title }}
                    </p>

                    <p class="truncate text-xs app-muted">
                      {{ item.subtitle }}
                    </p>
                  </div>

                  <div
                    class="flex shrink-0 items-center gap-3
                           ms-auto"
                  >
                    <p-tag
                      [severity]="activitySeverity(item)"
                      [value]="activityStatusLabel(item)"
                      [rounded]="true"
                    />

                    <span class="text-[0.7rem] app-muted">
                      {{ formatDate(item.createdAt) }}
                    </span>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <div
              class="mt-4 flex min-h-32 flex-col items-center
                     justify-center gap-2 rounded-xl border
                     border-dashed border-[var(--app-border)]
                     text-center"
            >
              <i
                class="pi pi-inbox text-2xl app-muted"
                aria-hidden="true"
              ></i>

              <p class="text-sm app-muted">
                {{ 'adminDashboard.recent.empty' | translate }}
              </p>
            </div>
          }
        </section>
      }
    </div>

    <ng-template #emptyChart>
      <div
        class="flex h-64 flex-col items-center justify-center gap-2
               rounded-xl border border-dashed
               border-[var(--app-border)] text-center"
      >
        <i
          class="pi pi-chart-bar text-2xl app-muted"
          aria-hidden="true"
        ></i>

        <p class="text-sm app-muted">
          {{ 'adminDashboard.charts.noData' | translate }}
        </p>
      </div>
    </ng-template>
  `,

  styles: [`
    :host ::ng-deep .chart-total-badge {
      display: inline-flex;
      min-width: 2.25rem;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: var(--app-surface-muted);
      padding: 0.25rem 0.65rem;
      color: var(--app-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService =
    inject(DashboardService);

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activityMonths = 6;
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly stats = signal<DashboardStats | null>(null);
  readonly charts = signal<DashboardCharts | null>(null);
  readonly recentActivity =
    signal<DashboardRecentActivityItem[]>([]);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  private loadTicket = 0;

  private readonly chartTheme = computed<ChartTheme>(() => {
    const dark = this.theme.isDark();

    return {
      text: dark ? '#e2e8f0' : '#334155',
      muted: dark ? '#94a3b8' : '#64748b',
      grid: dark
        ? 'rgba(148, 163, 184, 0.16)'
        : 'rgba(148, 163, 184, 0.28)',
      border: dark ? '#334155' : '#e2e8f0',
      surface: dark ? '#111827' : '#ffffff'
    };
  });

  readonly lastUpdatedLabel = computed(() => {
    const date = this.lastUpdated();

    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat(this.language.current(), {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  });

  readonly kpis = computed<KpiCard[]>(() => {
    const stats = this.stats();

    if (!stats) {
      return [];
    }

    this.language.current();

    const number = (value: number) => this.formatNumber(value);
    const text = (
      key: string,
      params?: Record<string, unknown>
    ) => this.translate.instant(key, params);

    return [
      {
        labelKey: 'adminDashboard.kpi.projects',
        value: number(stats.projects),
        hint: text('adminDashboard.kpi.projectsHint', {
          published: number(stats.publishedProjects),
          draft: number(stats.draftProjects)
        }),
        icon: 'pi pi-folder',
        ...KPI_TONES.indigo,
        progress: stats.publicationRate
      },
      {
        labelKey: 'adminDashboard.kpi.reviews',
        value: number(stats.reviews),
        hint: text('adminDashboard.kpi.reviewsHint', {
          pending: number(stats.pendingReviews),
          approved: number(stats.approvedReviews)
        }),
        icon: 'pi pi-star',
        ...KPI_TONES.amber,
        progress: stats.approvalRate
      },
      {
        labelKey: 'adminDashboard.kpi.messages',
        value: number(stats.messages),
        hint: text('adminDashboard.kpi.messagesHint', {
          unread: number(stats.unreadMessages),
          read: number(stats.readMessages)
        }),
        icon: 'pi pi-envelope',
        ...KPI_TONES.sky,
        progress: stats.unreadMessageRate
      },
      {
        labelKey: 'adminDashboard.kpi.rating',
        value: `${stats.averageRating.toFixed(1)} / 5`,
        hint: text('adminDashboard.kpi.ratingHint', {
          count: number(stats.approvedReviews)
        }),
        icon: 'pi pi-star-fill',
        ...KPI_TONES.rose,
        progress: (stats.averageRating / 5) * 100
      },
      {
        labelKey: 'adminDashboard.kpi.technologies',
        value: number(stats.technologies),
        hint: text('adminDashboard.kpi.technologiesHint', {
          count: number(stats.skills)
        }),
        icon: 'pi pi-desktop',
        ...KPI_TONES.violet,
        progress: null
      },
      {
        labelKey: 'adminDashboard.kpi.skills',
        value: number(stats.skills),
        hint: text('adminDashboard.kpi.skillsHint', {
          count: number(stats.skillCategories)
        }),
        icon: 'pi pi-chart-line',
        ...KPI_TONES.emerald,
        progress: null
      },
      {
        labelKey: 'adminDashboard.kpi.services',
        value: number(stats.services),
        hint: text('adminDashboard.kpi.servicesHint', {
          count: number(stats.timelineItems)
        }),
        icon: 'pi pi-briefcase',
        ...KPI_TONES.teal,
        progress: null
      },
      {
        labelKey: 'adminDashboard.kpi.timeline',
        value: number(stats.timelineItems),
        hint: text('adminDashboard.kpi.timelineHint', {
          experiences: number(stats.experiences),
          educations: number(stats.educations)
        }),
        icon: 'pi pi-history',
        ...KPI_TONES.slate,
        progress: null
      }
    ];
  });

  readonly activityChart = computed<ChartConfiguration>(() => {
    this.language.current();

    const points = this.charts()?.activity ?? [];
    const theme = this.chartTheme();

    return {
      type: 'line',
      data: {
        labels: points.map(point => this.monthLabel(point.period)),
        datasets: [
          {
            label: this.translate.instant(
              'adminDashboard.series.projects'
            ),
            data: points.map(point => point.projects),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#6366f1',
            pointRadius: 2.5,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: true,
            tension: 0.35
          },
          {
            label: this.translate.instant(
              'adminDashboard.series.reviews'
            ),
            data: points.map(point => point.reviews),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.10)',
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#f59e0b',
            pointRadius: 2.5,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: true,
            tension: 0.35
          },
          {
            label: this.translate.instant(
              'adminDashboard.series.messages'
            ),
            data: points.map(point => point.messages),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.10)',
            pointBackgroundColor: '#0ea5e9',
            pointBorderColor: '#0ea5e9',
            pointRadius: 2.5,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: this.lineOptions(theme)
    } as ChartConfiguration;
  });

  readonly reviewsByStatusChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points = this.charts()?.reviewsByStatus ?? [];
      const theme = this.chartTheme();

      return {
        type: 'doughnut',
        data: {
          labels: points.map(point =>
            this.reviewStatusLabel(point.key)
          ),
          datasets: [
            {
              data: points.map(point => point.value),
              backgroundColor: points.map(
                point =>
                  REVIEW_STATUS_COLORS[point.key] ?? '#94a3b8'
              ),
              borderWidth: 0,
              hoverOffset: 6
            }
          ]
        },
        options: this.doughnutOptions(theme)
      } as ChartConfiguration;
    });

  readonly projectsByTechnologyChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points =
        this.charts()?.projectsByTechnology ?? [];
      const theme = this.chartTheme();

      return {
        type: 'bar',
        data: {
          labels: points.map(point => point.label),
          datasets: [
            {
              label: this.translate.instant(
                'adminDashboard.series.projects'
              ),
              data: points.map(point => point.value),
              backgroundColor: '#6366f1',
              borderRadius: 6,
              barThickness: 14
            }
          ]
        },
        options: this.horizontalBarOptions(theme)
      } as ChartConfiguration;
    });

  readonly skillsByCategoryChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points = this.charts()?.skillsByCategory ?? [];
      const theme = this.chartTheme();

      return {
        type: 'bar',
        data: {
          labels: points.map(point => point.label),
          datasets: [
            {
              label: this.translate.instant(
                'adminDashboard.series.skills'
              ),
              data: points.map(point => point.value),
              backgroundColor: '#22c55e',
              borderRadius: 6,
              barThickness: 14
            }
          ]
        },
        options: this.horizontalBarOptions(theme)
      } as ChartConfiguration;
    });

  readonly reviewsByRatingChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points = this.charts()?.reviewsByRating ?? [];
      const theme = this.chartTheme();

      return {
        type: 'bar',
        data: {
          labels: points.map(point => `${point.key} ★`),
          datasets: [
            {
              label: this.translate.instant(
                'adminDashboard.series.reviews'
              ),
              data: points.map(point => point.value),
              backgroundColor: points.map(
                (_, index) =>
                  CHART_COLORS[index % CHART_COLORS.length]
              ),
              borderRadius: 6,
              maxBarThickness: 46
            }
          ]
        },
        options: this.verticalBarOptions(theme)
      } as ChartConfiguration;
    });

  readonly projectsByStatusChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points = this.charts()?.projectsByStatus ?? [];
      const theme = this.chartTheme();

      return {
        type: 'doughnut',
        data: {
          labels: points.map(point =>
            this.projectStatusLabel(point.key)
          ),
          datasets: [
            {
              data: points.map(point => point.value),
              backgroundColor: points.map(
                point =>
                  PROJECT_STATUS_COLORS[point.key] ?? '#94a3b8'
              ),
              borderWidth: 0,
              hoverOffset: 6
            }
          ]
        },
        options: this.doughnutOptions(theme)
      } as ChartConfiguration;
    });

  readonly messagesByStatusChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points = this.charts()?.messagesByStatus ?? [];
      const theme = this.chartTheme();

      return {
        type: 'doughnut',
        data: {
          labels: points.map(point =>
            this.messageStatusLabel(point.key)
          ),
          datasets: [
            {
              data: points.map(point => point.value),
              backgroundColor: points.map(
                point =>
                  MESSAGE_STATUS_COLORS[point.key] ?? '#94a3b8'
              ),
              borderWidth: 0,
              hoverOffset: 6
            }
          ]
        },
        options: this.doughnutOptions(theme)
      } as ChartConfiguration;
    });

  readonly timelineByTypeChart =
    computed<ChartConfiguration>(() => {
      this.language.current();

      const points = this.charts()?.timelineByType ?? [];
      const theme = this.chartTheme();

      return {
        type: 'doughnut',
        data: {
          labels: points.map(point =>
            this.timelineTypeLabel(point.key)
          ),
          datasets: [
            {
              data: points.map(point => point.value),
              backgroundColor: points.map(
                point =>
                  TIMELINE_TYPE_COLORS[point.key] ?? '#94a3b8'
              ),
              borderWidth: 0,
              hoverOffset: 6
            }
          ]
        },
        options: this.doughnutOptions(theme)
      } as ChartConfiguration;
    });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      stats: this.dashboardService.getStats(),
      charts: this.dashboardService.getCharts(
        this.activityMonths
      ),
      recent: this.dashboardService.getRecentActivity(6)
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (ticket === this.loadTicket) {
            this.loading.set(false);
          }
        })
      )
      .subscribe({
        next: ({ stats, charts, recent }) => {
          if (ticket !== this.loadTicket) {
            return;
          }

          this.stats.set(stats);
          this.charts.set(charts);
          this.recentActivity.set(recent.items);
          this.lastUpdated.set(new Date());
        },

        error: () => {
          if (ticket === this.loadTicket) {
            this.loadError.set(
              this.translate.instant('common.loadingError')
            );
          }
        }
      });
  }

  totalOf(points: DashboardChartPoint[] | undefined): number {
    return (points ?? []).reduce(
      (total, point) => total + point.value,
      0
    );
  }

  hasChartData(points: DashboardChartPoint[] | undefined): boolean {
    return this.totalOf(points) > 0;
  }

  hasActivityData(): boolean {
    return (this.charts()?.activity ?? []).some(
      point =>
        point.projects > 0 ||
        point.reviews > 0 ||
        point.messages > 0
    );
  }

  activityIcon(item: DashboardRecentActivityItem): string {
    switch (item.type) {
      case 'PROJECT':
        return 'pi pi-folder';
      case 'REVIEW':
        return 'pi pi-star';
      case 'MESSAGE':
        return 'pi pi-envelope';
      default:
        return 'pi pi-circle';
    }
  }

  activityIconClass(item: DashboardRecentActivityItem): string {
    switch (item.type) {
      case 'PROJECT':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300';
      case 'REVIEW':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300';
      case 'MESSAGE':
        return 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300';
    }
  }

  activityStatusLabel(
    item: DashboardRecentActivityItem
  ): string {
    switch (item.type) {
      case 'PROJECT':
        return this.projectStatusLabel(item.status);
      case 'REVIEW':
        return this.reviewStatusLabel(item.status);
      case 'MESSAGE':
        return this.messageStatusLabel(item.status);
      default:
        return item.status;
    }
  }

  activitySeverity(
    item: DashboardRecentActivityItem
  ): TagSeverity {
    if (
      item.status === 'PUBLISHED' ||
      item.status === 'APPROVED' ||
      item.status === 'READ'
    ) {
      return 'success';
    }

    if (item.status === 'REJECTED') {
      return 'danger';
    }

    if (item.status === 'UNREAD') {
      return 'info';
    }

    return 'warn';
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.current(), {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat(this.language.current()).format(
      value
    );
  }

  private monthLabel(period: string): string {
    const [year, month] = period.split('-').map(Number);

    return new Intl.DateTimeFormat(this.language.current(), {
      month: 'short',
      year: '2-digit'
    }).format(new Date(year, month - 1, 1));
  }

  private projectStatusLabel(key: string): string {
    if (key === 'PUBLISHED') {
      return this.translate.instant(
        'adminDashboard.status.published'
      );
    }

    if (key === 'DRAFT') {
      return this.translate.instant(
        'adminDashboard.status.draft'
      );
    }

    return key;
  }

  private reviewStatusLabel(key: string): string {
    if (key === 'APPROVED') {
      return this.translate.instant(
        'adminDashboard.status.approved'
      );
    }

    if (key === 'REJECTED') {
      return this.translate.instant(
        'adminDashboard.status.rejected'
      );
    }

    if (key === 'DRAFT') {
      return this.translate.instant(
        'adminDashboard.status.pending'
      );
    }

    return key;
  }

  private messageStatusLabel(key: string): string {
    if (key === 'UNREAD') {
      return this.translate.instant(
        'adminDashboard.status.unread'
      );
    }

    if (key === 'READ') {
      return this.translate.instant(
        'adminDashboard.status.read'
      );
    }

    return key;
  }

  private timelineTypeLabel(key: string): string {
    if (key === 'EXPERIENCE') {
      return this.translate.instant(
        'adminDashboard.status.experience'
      );
    }

    if (key === 'EDUCATION') {
      return this.translate.instant(
        'adminDashboard.status.education'
      );
    }

    return key;
  }

  private lineOptions(
    theme: ChartTheme
  ): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: this.legendLabels(theme)
        },
        tooltip: this.tooltipOptions(theme)
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: theme.muted,
            maxRotation: 0,
            autoSkipPadding: 16,
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: theme.grid,
            drawTicks: false
          },
          border: { display: false },
          ticks: {
            color: theme.muted,
            precision: 0,
            padding: 8,
            font: { family: 'Inter', size: 11 }
          }
        }
      }
    };
  }

  private horizontalBarOptions(
    theme: ChartTheme
  ): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: this.tooltipOptions(theme)
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: theme.grid,
            drawTicks: false
          },
          border: { display: false },
          ticks: {
            color: theme.muted,
            precision: 0,
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: theme.text,
            font: { family: 'Inter', size: 11 }
          }
        }
      }
    };
  }

  private verticalBarOptions(
    theme: ChartTheme
  ): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: this.tooltipOptions(theme)
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: theme.text,
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: theme.grid,
            drawTicks: false
          },
          border: { display: false },
          ticks: {
            color: theme.muted,
            precision: 0,
            font: { family: 'Inter', size: 11 }
          }
        }
      }
    };
  }

  private doughnutOptions(
    theme: ChartTheme
  ): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '64%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: this.legendLabels(theme)
        },
        tooltip: this.tooltipOptions(theme)
      }
    };
  }

  private legendLabels(theme: ChartTheme) {
    return {
      color: theme.text,
      usePointStyle: true,
      pointStyle: 'circle' as const,
      boxWidth: 8,
      boxHeight: 8,
      padding: 16,
      font: {
        family: 'Inter',
        size: 12
      }
    };
  }

  private tooltipOptions(theme: ChartTheme) {
    return {
      backgroundColor: theme.surface,
      titleColor: theme.text,
      bodyColor: theme.text,
      borderColor: theme.border,
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      boxPadding: 4
    };
  }
}
