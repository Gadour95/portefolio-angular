import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe,
  registerLocaleData
} from '@angular/common';

import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  Router
} from '@angular/router';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import type {
  ChartData,
  ChartOptions
} from 'chart.js';

import {
  Subject,
  catchError,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';

import {
  ApiError
} from '../../../../../core/models/api-error.model';

import {
  LanguageService
} from '../../../../../core/services/language.service';

import {
  ThemeService
} from '../../../../../core/services/theme.service';

import {
  SalesKpis,
  StatisticsContractError
} from '../../models/statistics.model';

import {
  StatisticsService
} from '../../services/statistics.service';

registerLocaleData(localeFr);
registerLocaleData(localeAr);

type KpiKind = 'count' | 'amount' | 'percentage';

interface KpiCard {
  key: string;
  label: string;
  icon: string;
  color: string;
  value: number | null;
  kind: KpiKind;
}

interface FinancialRow {
  key: 'totalRevenue' | 'totalCost' | 'totalMargin';
  label: string;
  value: number;
}

interface DashboardState {
  data: SalesKpis | null;
  loading: boolean;
  error: string | null;
  loadedAt: Date | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ChartModule,
    MessageModule,
    SkeletonModule,
    TableModule,
    TagModule
  ],

  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly statistics = inject(StatisticsService);

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly refresh$ = new Subject<void>();

  readonly skeletonCards = Array.from(
    { length: 8 },
    (_, index) => index
  );

  readonly locale = computed(() =>
    this.language.current() === 'en'
      ? 'en-US'
      : this.language.current()
  );

  readonly vm = toSignal(
    this.refresh$.pipe(
      startWith(undefined),

      switchMap(() =>
        this.statistics.getSalesKpis().pipe(
          map(data => ({
            data,
            loading: false,
            error: null,
            loadedAt: new Date()
          }) as DashboardState),

          catchError((error: unknown) =>
            of<DashboardState>({
              data: null,
              loading: false,
              error: this.errorMessage(error),
              loadedAt: null
            })
          ),

          startWith<DashboardState>({
            data: null,
            loading: true,
            error: null,
            loadedAt: null
          })
        )
      )
    ),

    {
      initialValue: {
        data: null,
        loading: true,
        error: null,
        loadedAt: null
      } as DashboardState
    }
  );

  readonly marginRatio = computed<number | null>(() => {
    const data = this.vm().data;

    if (!data || data.totalRevenue === 0) {
      return null;
    }

    return (
      data.totalMargin / data.totalRevenue
    ) * 100;
  });

  readonly kpiCards = computed<KpiCard[]>(() => {
    this.language.current();

    const data = this.vm().data;

    if (!data) {
      return [];
    }

    return [
      {
        key: 'totalRevenue',
        label: this.label('totalRevenue'),
        icon: 'pi pi-wallet',
        color:
          'bg-indigo-50 text-indigo-600 ' +
          'dark:bg-indigo-500/10 dark:text-indigo-300',
        value: data.totalRevenue,
        kind: 'amount'
      },

      {
        key: 'totalCost',
        label: this.label('totalCost'),
        icon: 'pi pi-shopping-bag',
        color:
          'bg-amber-50 text-amber-700 ' +
          'dark:bg-amber-500/10 dark:text-amber-300',
        value: data.totalCost,
        kind: 'amount'
      },

      {
        key: 'totalMargin',
        label: this.label('totalMargin'),
        icon: 'pi pi-chart-line',
        color:
          'bg-emerald-50 text-emerald-700 ' +
          'dark:bg-emerald-500/10 dark:text-emerald-300',
        value: data.totalMargin,
        kind: 'amount'
      },

      {
        key: 'averageOrderValue',
        label: this.label('averageOrderValue'),
        icon: 'pi pi-receipt',
        color:
          'bg-cyan-50 text-cyan-700 ' +
          'dark:bg-cyan-500/10 dark:text-cyan-300',
        value: data.averageOrderValue,
        kind: 'amount'
      },

      {
        key: 'totalOrders',
        label: this.label('totalOrders'),
        icon: 'pi pi-cart-plus',
        color:
          'bg-blue-50 text-blue-700 ' +
          'dark:bg-blue-500/10 dark:text-blue-300',
        value: data.totalOrders,
        kind: 'count'
      },

      {
        key: 'totalCustomers',
        label: this.label('totalCustomers'),
        icon: 'pi pi-users',
        color:
          'bg-violet-50 text-violet-700 ' +
          'dark:bg-violet-500/10 dark:text-violet-300',
        value: data.totalCustomers,
        kind: 'count'
      },

      {
        key: 'totalDiscount',
        label: this.label('totalDiscount'),
        icon: 'pi pi-percentage',
        color:
          'bg-rose-50 text-rose-700 ' +
          'dark:bg-rose-500/10 dark:text-rose-300',
        value: data.totalDiscount,
        kind: 'amount'
      },

      {
        key: 'marginRatio',
        label: this.label('marginRatio'),
        icon: 'pi pi-chart-bar',
        color:
          'bg-teal-50 text-teal-700 ' +
          'dark:bg-teal-500/10 dark:text-teal-300',
        value: this.marginRatio(),
        kind: 'percentage'
      }
    ];
  });

  readonly financialRows = computed<FinancialRow[]>(() => {
    this.language.current();

    const data = this.vm().data;

    if (!data) {
      return [];
    }

    return [
      {
        key: 'totalRevenue',
        label: this.label('totalRevenue'),
        value: data.totalRevenue
      },
      {
        key: 'totalCost',
        label: this.label('totalCost'),
        value: data.totalCost
      },
      {
        key: 'totalMargin',
        label: this.label('totalMargin'),
        value: data.totalMargin
      }
    ];
  });

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const rows = this.financialRows();

    return {
      labels: rows.map(row => row.label),

      datasets: [
        {
          data: rows.map(row => row.value),

          backgroundColor: [
            '#6366F1',
            '#F59E0B',
            '#10B981'
          ],

          hoverBackgroundColor: [
            '#4F46E5',
            '#D97706',
            '#059669'
          ],

          borderRadius: 10,
          maxBarThickness: 90
        }
      ]
    };
  });

  readonly chartOptions = computed<ChartOptions<'bar'>>(() => {
    const dark = this.theme.isDark();
    const locale = this.locale();

    const textColor = dark
      ? '#CBD5E1'
      : '#475569';

    const gridColor = dark
      ? '#334155'
      : '#E2E8F0';

    const fontFamily =
      this.language.current() === 'ar'
        ? 'Noto Sans Arabic'
        : 'Inter';

    const formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 3
    });

    return {
      responsive: true,
      maintainAspectRatio: false,
      locale,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label: context =>
              formatter.format(context.parsed.y ?? 0)
          }
        }
      },

      scales: {
        x: {
          grid: {
            display: false
          },

          ticks: {
            color: textColor,

            font: {
              family: fontFamily
            }
          }
        },

        y: {
          beginAtZero: true,

          grid: {
            color: gridColor
          },

          ticks: {
            color: textColor,

            font: {
              family: fontFamily
            }
          }
        }
      }
    };
  });

  readonly hasFinancialValues = computed(() =>
    this.financialRows().some(row => row.value !== 0)
  );

  reload(): void {
    this.refresh$.next();
  }

  openOrders(): void {
    void this.router.navigate(['/admin/orders']);
  }

  openProducts(): void {
    void this.router.navigate(['/admin/products']);
  }

  private label(key: string): string {
    return this.translate.instant(
      `adminStatistics.kpis.${key}`
    );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof StatisticsContractError) {
      return this.translate.instant(
        'adminStatistics.contractMismatch'
      );
    }

    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | null;

      if (
        body &&
        typeof body.message === 'string' &&
        body.message.trim()
      ) {
        return body.message;
      }
    }

    return this.translate.instant(
      'adminCategories.genericError'
    );
  }
}