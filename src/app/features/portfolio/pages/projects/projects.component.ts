import {
  Component,
  inject,
  signal
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

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
  imports: [RouterLink, TranslatePipe],

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
        class="flex flex-col gap-4 rounded-2xl border
               border-[var(--app-border)] bg-[var(--app-surface)] p-4
               sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label class="flex flex-col gap-1.5">
            <span
              class="text-xs font-semibold uppercase tracking-wide
                     text-[var(--app-text-muted)]"
            >
              {{ 'publicPages.projects.technology' | translate }}
            </span>

            <select
              class="app-control min-w-60"
              [value]="technologyId() ?? ''"
              (change)="onTechnologyChange($event)"
            >
              <option value="">
                {{ 'publicPages.projects.allTechnologies' | translate }}
              </option>

              @for (
                technology of technologies();
                track technology.id
              ) {
                <option [value]="technology.id">
                  {{ technology.name }}
                </option>
              }
            </select>
          </label>

          <label
            class="inline-flex cursor-pointer items-center gap-2
                   self-end pb-3 text-sm font-medium sm:pb-0"
          >
            <input
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded
                     border-[var(--app-border)]
                     accent-[var(--p-primary-color)]"
              [checked]="featuredOnly()"
              (change)="onFeaturedChange($event)"
            />

            {{ 'publicPages.projects.featuredOnly' | translate }}
          </label>
        </div>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center gap-2
                 rounded-xl border border-[var(--app-border)] px-4
                 py-2 text-sm font-semibold transition
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
                    [alt]="project.title"
                    class="h-full w-full object-cover transition
                           duration-300 group-hover:scale-105"
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
  `
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);
  private readonly technologyService = inject(
    TechnologyService
  );
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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

  onTechnologyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.navigate({
      page: 0,
      technologyId: value || null
    });
  }

  onFeaturedChange(event: Event): void {
    const checked = (event.target as HTMLInputElement)
      .checked;

    this.navigate({
      page: 0,
      featured: checked
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
