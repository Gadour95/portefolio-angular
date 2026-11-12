import {
  Component,
  inject,
  signal
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

import { resolveMediaUrl } from '../../../../core/http/media-url';

import {
  ProjectPublic
} from '../../../../core/models/project.model';
import {
  Technology
} from '../../../../core/models/technology.model';

import { ProjectService } from '../../../../core/services/project.service';
import {
  TechnologyService
} from '../../../../core/services/technology.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    FormsModule,
    SelectModule,
    CheckboxModule
  ],

  template: `
    <div class="app-container space-y-8 py-10 sm:py-14">
      <!-- En-tête -->
      <header class="max-w-3xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'nav.projects' | translate }}
        </p>

        <h1
          class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {{ 'publicPages.projects.title' | translate }}
        </h1>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.projects.subtitle' | translate }}
        </p>
      </header>

      <!-- Filtres -->
      <section
        class="rounded-2xl border border-[var(--app-border)]
               bg-[var(--app-surface)] p-4 sm:p-5"
      >
        <div
          class="flex flex-col gap-4
                 sm:flex-row sm:items-end sm:justify-between"
        >
          <div
            class="flex flex-col gap-3
                   sm:flex-row sm:items-end sm:gap-4"
          >
            <div class="flex flex-col gap-1.5 sm:w-64">
              <span
                class="text-xs font-semibold uppercase tracking-wide
                       text-[var(--app-text-muted)]"
              >
                {{ 'publicPages.projects.technology' | translate }}
              </span>

              <p-select
                styleClass="app-select"
                panelStyleClass="app-select-panel"
                [options]="technologyOptions()"
                optionLabel="label"
                optionValue="value"
                [ngModel]="technologyId()"
                (ngModelChange)="onTechnologyChange($event)"
                [placeholder]="
                  'publicPages.projects.allTechnologies' | translate
                "
                [filter]="technologies().length > 8"
                [fluid]="true"
                appendTo="body"
                [ariaLabel]="
                  'publicPages.projects.technology' | translate
                "
              />
            </div>

            <div
              class="inline-flex min-h-11 items-center gap-2.5
                     rounded-xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] px-3.5 py-2
                     transition
                     hover:border-[var(--p-primary-color)]"
            >
              <p-checkbox
                inputId="projects-featured-only"
                [binary]="true"
                [ngModel]="featuredOnly()"
                (ngModelChange)="onFeaturedChange($event)"
              />

              <label
                for="projects-featured-only"
                class="cursor-pointer select-none text-sm
                       font-medium"
              >
                {{ 'publicPages.projects.featuredOnly' | translate }}
              </label>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center
                   gap-2 rounded-xl border border-[var(--app-border)]
                   px-4 py-2 text-sm font-semibold transition
                   hover:border-[var(--p-primary-color)]
                   hover:text-[var(--p-primary-color)]"
            (click)="resetFilters()"
          >
            <i
              class="pi pi-filter-slash text-xs"
              aria-hidden="true"
            ></i>

            {{ 'common.reset' | translate }}
          </button>
        </div>
      </section>

      <!-- Contenu -->
      @if (loading()) {
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of [1, 2, 3, 4, 5, 6]; track item) {
            <div
              class="animate-pulse overflow-hidden rounded-2xl border
                     border-[var(--app-border)] bg-[var(--app-surface)]"
            >
              <div class="h-48 bg-[var(--app-surface-muted)]"></div>

              <div class="space-y-3 p-6">
                <div class="h-4 w-2/3 rounded bg-[var(--app-surface-muted)]"></div>
                <div class="h-3 w-full rounded bg-[var(--app-surface-muted)]"></div>
                <div class="h-3 w-5/6 rounded bg-[var(--app-surface-muted)]"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div
          class="rounded-2xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-8 text-center"
        >
          <i
            class="pi pi-exclamation-triangle text-3xl text-amber-500"
            aria-hidden="true"
          ></i>

          <p class="mt-3 text-sm text-[var(--app-text-muted)]">
            {{ 'common.loadingError' | translate }}
          </p>

          <button
            type="button"
            class="mt-5 inline-flex min-h-10 items-center gap-2
                   rounded-xl bg-[var(--p-primary-color)] px-4 py-2
                   text-sm font-semibold
                   text-[var(--p-primary-inverse-color)]"
            (click)="loadProjects()"
          >
            <i
              class="pi pi-refresh text-xs"
              aria-hidden="true"
            ></i>

            {{ 'common.retry' | translate }}
          </button>
        </div>
      } @else if (!projects().length) {
        <div
          class="rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-search text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'publicPages.projects.empty' | translate }}
          </p>

          <button
            type="button"
            class="mt-5 inline-flex min-h-10 items-center gap-2
                   rounded-xl border border-[var(--app-border)] px-4
                   py-2 text-sm font-semibold transition
                   hover:border-[var(--p-primary-color)]
                   hover:text-[var(--p-primary-color)]"
            (click)="resetFilters()"
          >
            {{ 'common.reset' | translate }}
          </button>
        </div>
      } @else {
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (project of projects(); track project.id) {
            <a
              [routerLink]="['/projects', project.slug]"
              class="group flex flex-col overflow-hidden rounded-2xl
                     border border-[var(--app-border)]
                     bg-[var(--app-surface)] transition
                     hover:-translate-y-0.5
                     hover:border-[var(--p-primary-color)]
                     hover:shadow-[0_20px_50px_-32px_rgba(79,70,229,0.6)]"
            >
              <div
                class="relative h-48 overflow-hidden
                       bg-[var(--app-surface-muted)]"
              >
                @if (projectImage(project); as image) {
                  <img
                    [src]="image"
                    alt=""
                    aria-hidden="true"
                    class="absolute inset-0 h-full w-full scale-125
                           object-cover opacity-70 blur-xl"
                    loading="lazy"
                  />

                  <img
                    [src]="image"
                    [alt]="project.title"
                    class="relative z-10 h-full w-full object-contain
                           transition duration-300
                           group-hover:scale-105"
                    loading="lazy"
                  />
                } @else {
                  <div
                    class="flex h-full items-center justify-center
                           bg-gradient-to-br from-indigo-500/15 to-blue-500/10"
                  >
                    <i
                      class="pi pi-image text-4xl text-[var(--p-primary-color)]"
                      aria-hidden="true"
                    ></i>
                  </div>
                }

                @if (project.featured) {
                  <span
                    class="absolute start-3 top-3 rounded-full
                           bg-[var(--p-primary-color)] px-2.5 py-1
                           text-[0.65rem] font-bold uppercase
                           tracking-wide
                           text-[var(--p-primary-inverse-color)]"
                  >
                    {{ 'publicPages.projects.featured' | translate }}
                  </span>
                }
              </div>

              <div class="flex flex-1 flex-col p-6">
                @if (project.role) {
                  <p
                    class="text-xs font-semibold uppercase tracking-wide
                           text-[var(--p-primary-color)]"
                  >
                    {{ project.role }}
                  </p>
                }

                <h2 class="mt-1 text-lg font-semibold">
                  {{ project.title }}
                </h2>

                <p
                  class="mt-2 line-clamp-3 flex-1 text-sm leading-7
                         text-[var(--app-text-muted)]"
                >
                  {{ project.summary }}
                </p>

                @if (project.technologies.length) {
                  <div class="mt-4 flex flex-wrap gap-1.5">
                    @for (
                      technology of project.technologies.slice(0, 5);
                      track technology.id
                    ) {
                      <span
                        class="rounded-full border
                               border-[var(--app-border)] px-2.5 py-1
                               text-[0.65rem] font-semibold uppercase
                               tracking-wide text-[var(--app-text-muted)]"
                      >
                        {{ technology.name }}
                      </span>
                    }
                  </div>
                }

                <span
                  class="mt-5 inline-flex items-center gap-2 text-sm
                         font-semibold text-[var(--p-primary-color)]"
                >
                  {{ 'publicPages.projects.viewProject' | translate }}

                  <i
                    class="pi pi-arrow-right text-xs rtl:rotate-180"
                    aria-hidden="true"
                  ></i>
                </span>
              </div>
            </a>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <nav
            class="flex flex-col items-center justify-between gap-3
                   border-t border-[var(--app-border)] pt-6
                   sm:flex-row"
            [attr.aria-label]="'common.page' | translate"
          >
            <p class="text-sm text-[var(--app-text-muted)]">
              {{ 'common.page' | translate }}
              {{ page() + 1 }}
              {{ 'common.of' | translate }}
              {{ totalPages() }}
            </p>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex min-h-10 items-center gap-2 rounded-xl
                       border border-[var(--app-border)] px-4 py-2
                       text-sm font-semibold transition
                       hover:border-[var(--p-primary-color)]
                       hover:text-[var(--p-primary-color)]
                       disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="page() === 0"
                (click)="goToPage(page() - 1)"
              >
                <i
                  class="pi pi-angle-left text-xs rtl:rotate-180"
                  aria-hidden="true"
                ></i>

                {{ 'common.previous' | translate }}
              </button>

              <button
                type="button"
                class="inline-flex min-h-10 items-center gap-2 rounded-xl
                       border border-[var(--app-border)] px-4 py-2
                       text-sm font-semibold transition
                       hover:border-[var(--p-primary-color)]
                       hover:text-[var(--p-primary-color)]
                       disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="page() >= totalPages() - 1"
                (click)="goToPage(page() + 1)"
              >
                {{ 'common.next' | translate }}

                <i
                  class="pi pi-angle-right text-xs rtl:rotate-180"
                  aria-hidden="true"
                ></i>
              </button>
            </div>
          </nav>
        }
      }
    </div>
  `,

  styles: `
    :host ::ng-deep .app-select.p-select {
      width: 100%;
      min-height: 2.75rem;
      border-radius: 0.75rem;
      border-color: var(--app-border);
      background: var(--app-surface);
    }

    :host ::ng-deep .app-select .p-select-label {
      display: flex;
      align-items: center;
      padding-block: 0.6rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    :host ::ng-deep .app-select:not(.p-disabled):hover {
      border-color: var(--p-primary-color);
    }

    :host ::ng-deep .app-select:not(.p-disabled).p-focus {
      border-color: var(--p-primary-color);
    }
  `
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);
  private readonly technologyService = inject(
    TechnologyService
  );
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private readonly pageSize = 9;

  private requestId = 0;

  readonly projects = signal<ProjectPublic[]>([]);
  readonly technologies = signal<Technology[]>([]);

  readonly loading = signal(true);
  readonly error = signal(false);

  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalRecords = signal(0);

  readonly featuredOnly = signal(false);
  readonly technologyId = signal<string | null>(null);

  constructor() {
    this.technologyService
      .getPublicTechnologies()
      .subscribe({
        next: technologies => this.technologies.set(technologies),
        error: () => this.technologies.set([])
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const page = Number(params.get('page') ?? '0');

        this.page.set(
          Number.isFinite(page) && page > 0 ? page : 0
        );

        this.featuredOnly.set(
          params.get('featured') === 'true'
        );

        this.technologyId.set(
          params.get('technologyId')
        );

        this.loadProjects();
      });
  }

  loadProjects(): void {
    const requestId = ++this.requestId;

    this.loading.set(true);
    this.error.set(false);

    this.projectService
      .getPublicProjects({
        page: this.page(),
        size: this.pageSize,
        featured: this.featuredOnly() || undefined,
        technologyId: this.technologyId() || undefined
      })
      .subscribe({
        next: page => {
          if (requestId !== this.requestId) {
            return;
          }

          this.projects.set(page.content);
          this.totalPages.set(page.totalPages);
          this.totalRecords.set(page.totalElements);
          this.loading.set(false);
        },

        error: () => {
          if (requestId !== this.requestId) {
            return;
          }

          this.projects.set([]);
          this.totalPages.set(0);
          this.totalRecords.set(0);
          this.loading.set(false);
          this.error.set(true);
        }
      });
  }

  technologyOptions(): {
    label: string;
    value: string | null;
  }[] {
    return [
      {
        label: this.translate.instant(
          'publicPages.projects.allTechnologies'
        ),
        value: null
      },
      ...this.technologies().map(technology => ({
        label: technology.name,
        value: technology.id
      }))
    ];
  }

  onTechnologyChange(value: string | null): void {
    this.navigate({
      page: 0,
      technologyId: value || null
    });
  }

  onFeaturedChange(value: boolean): void {
    this.navigate({
      page: 0,
      featured: value
    });
  }

  resetFilters(): void {
    this.navigate({
      page: 0,
      featured: false,
      technologyId: null
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }

    this.navigate({ page });
  }

  projectImage(project: ProjectPublic): string | null {
    return resolveMediaUrl(project.images?.[0]);
  }

  private navigate(filters: {
    page: number;
    featured?: boolean;
    technologyId?: string | null;
  }): void {
    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        page: filters.page,

        featured:
          (filters.featured ?? this.featuredOnly())
            ? 'true'
            : null,

        technologyId:
          filters.technologyId !== undefined
            ? filters.technologyId
            : this.technologyId()
      }
    });
  }
}
