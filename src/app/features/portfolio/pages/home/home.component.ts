import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import {
  catchError,
  finalize,
  forkJoin,
  of,
  switchMap
} from 'rxjs';

import { resolveMediaUrl } from '../../../../core/http/media-url';

import { AboutPublic } from '../../../../core/models/about.model';
import { PageResponse } from '../../../../core/models/page-response.model';
import {
  ProjectPublic
} from '../../../../core/models/project.model';
import {
  ServiceOfferPublic
} from '../../../../core/models/service-offer.model';
import {
  SkillCategoryPublic
} from '../../../../core/models/skill.model';

import { AboutService } from '../../../../core/services/about.service';
import { ProjectService } from '../../../../core/services/project.service';
import { ServiceOfferService } from '../../../../core/services/service-offer.service';
import { SkillService } from '../../../../core/services/skill.service';

const EMPTY_PROJECT_PAGE: PageResponse<ProjectPublic> = {
  content: [],
  page: 0,
  size: 3,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <div class="app-container flex flex-col gap-16 py-10 sm:py-14">
      <!-- Hero -->
      <section
        class="relative overflow-hidden rounded-3xl border
               border-[var(--app-border)] bg-[var(--app-surface)]
               px-6 py-12 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.5)]
               sm:px-10 sm:py-16 lg:px-16"
      >
        <div
          class="pointer-events-none absolute -right-24 -top-24 h-72 w-72
                 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden="true"
        ></div>

        <div
          class="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80
                 rounded-full bg-blue-500/10 blur-3xl"
          aria-hidden="true"
        ></div>

        <div class="relative max-w-3xl">
          <span
            class="inline-flex items-center gap-2 rounded-full border
                   border-[var(--app-border)] bg-[var(--app-surface-muted)]
                   px-3 py-1.5 text-xs font-semibold uppercase
                   tracking-[0.14em] text-[var(--p-primary-color)]"
          >
            <span
              class="h-1.5 w-1.5 rounded-full bg-current"
              aria-hidden="true"
            ></span>

            {{ 'portfolio.heroEyebrow' | translate }}
          </span>

          <h1
            class="mt-6 text-balance text-4xl font-bold leading-tight
                   tracking-[-0.045em] sm:text-5xl lg:text-6xl"
          >
            {{ 'portfolio.heroTitle' | translate }}
          </h1>

          <p
            class="mt-5 max-w-2xl text-base leading-8
                   text-[var(--app-text-muted)] sm:text-lg"
          >
            {{
              about()?.description ||
                ('portfolio.heroText' | translate)
            }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <a
              routerLink="/projects"
              class="inline-flex min-h-11 items-center justify-center
                     gap-2 rounded-xl bg-[var(--p-primary-color)] px-5
                     py-3 text-sm font-semibold
                     text-[var(--p-primary-inverse-color)]
                     transition hover:bg-[var(--p-primary-hover-color)]"
            >
              {{ 'portfolio.viewProjects' | translate }}

              <i
                class="pi pi-arrow-right text-xs rtl:rotate-180"
                aria-hidden="true"
              ></i>
            </a>

            <a
              routerLink="/contact"
              class="inline-flex min-h-11 items-center justify-center
                     gap-2 rounded-xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] px-5 py-3 text-sm
                     font-semibold transition hover:border-[var(--p-primary-color)]
                     hover:text-[var(--p-primary-color)]"
            >
              {{ 'portfolio.contactMe' | translate }}

              <i
                class="pi pi-envelope text-xs"
                aria-hidden="true"
              ></i>
            </a>
          </div>

          @if (about(); as info) {
            <div
              class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3
                     border-t border-[var(--app-border)] pt-6 text-sm"
            >
              @if (info.availability) {
                <span class="inline-flex items-center gap-2">
                  <i
                    class="pi pi-check-circle text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  {{ info.availability }}
                </span>
              }

              @if (info.location) {
                <span class="inline-flex items-center gap-2">
                  <i
                    class="pi pi-map-marker text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  {{ info.location }}
                </span>
              }

              @if (info.email) {
                <a
                  [href]="'mailto:' + info.email"
                  class="inline-flex items-center gap-2
                         hover:text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-envelope text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  {{ info.email }}
                </a>
              }
            </div>
          }
        </div>
      </section>

      <!-- Projets mis en avant -->
      <section>
        <div
          class="flex flex-col justify-between gap-4
                 sm:flex-row sm:items-end"
        >
          <div class="max-w-2xl">
            <p
              class="text-xs font-bold uppercase tracking-[0.14em]
                     text-[var(--p-primary-color)]"
            >
              {{ 'home.featuredEyebrow' | translate }}
            </p>

            <h2
              class="mt-2 text-2xl font-bold tracking-[-0.035em]
                     sm:text-3xl"
            >
              {{ 'home.featuredTitle' | translate }}
            </h2>

            <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
              {{ 'home.featuredText' | translate }}
            </p>
          </div>

          <a
            routerLink="/projects"
            class="inline-flex shrink-0 items-center gap-2 text-sm
                   font-semibold text-[var(--p-primary-color)]
                   hover:underline"
          >
            {{ 'home.viewAllProjects' | translate }}

            <i
              class="pi pi-arrow-right text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        </div>

        @if (loading()) {
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            @for (item of [1, 2, 3]; track item) {
              <div
                class="animate-pulse overflow-hidden rounded-2xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]"
              >
                <div class="h-44 bg-[var(--app-surface-muted)]"></div>

                <div class="space-y-3 p-6">
                  <div class="h-4 w-2/3 rounded bg-[var(--app-surface-muted)]"></div>
                  <div class="h-3 w-full rounded bg-[var(--app-surface-muted)]"></div>
                  <div class="h-3 w-5/6 rounded bg-[var(--app-surface-muted)]"></div>
                </div>
              </div>
            }
          </div>
        } @else if (projects().length) {
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            @for (project of projects(); track project.id) {
              <a
                [routerLink]="['/projects', project.slug]"
                class="group flex flex-col overflow-hidden rounded-2xl
                       border border-[var(--app-border)]
                       bg-[var(--app-surface)] transition
                       hover:-translate-y-0.5 hover:border-[var(--p-primary-color)]
                       hover:shadow-[0_20px_50px_-32px_rgba(79,70,229,0.6)]"
              >
                <div
                  class="relative h-44 overflow-hidden
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
                             tracking-wide text-[var(--p-primary-inverse-color)]"
                    >
                      {{ 'publicPages.projects.featured' | translate }}
                    </span>
                  }
                </div>

                <div class="flex flex-1 flex-col p-6">
                  <h3 class="text-base font-semibold">
                    {{ project.title }}
                  </h3>

                  <p
                    class="mt-2 line-clamp-3 flex-1 text-sm leading-7
                           text-[var(--app-text-muted)]"
                  >
                    {{ project.summary }}
                  </p>

                  @if (project.technologies.length) {
                    <div class="mt-4 flex flex-wrap gap-1.5">
                      @for (
                        technology of project.technologies.slice(0, 4);
                        track technology.id
                      ) {
                        <span
                          class="rounded-full border border-[var(--app-border)]
                                 px-2.5 py-1 text-[0.65rem] font-semibold
                                 uppercase tracking-wide
                                 text-[var(--app-text-muted)]"
                        >
                          {{ technology.name }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </a>
            }
          </div>
        } @else {
          <div
            class="mt-8 rounded-2xl border border-dashed
                   border-[var(--app-border)] bg-[var(--app-surface)]
                   p-8 text-center"
          >
            <i
              class="pi pi-folder-open text-3xl text-[var(--app-text-muted)]"
              aria-hidden="true"
            ></i>

            <p class="mt-3 text-sm text-[var(--app-text-muted)]">
              {{ 'home.noProjects' | translate }}
            </p>
          </div>
        }
      </section>

      <!-- Compétences -->
      <section>
        <div class="max-w-2xl">
          <p
            class="text-xs font-bold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'home.skillsEyebrow' | translate }}
          </p>

          <h2
            class="mt-2 text-2xl font-bold tracking-[-0.035em]
                   sm:text-3xl"
          >
            {{ 'home.skillsTitle' | translate }}
          </h2>

          <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
            {{ 'home.skillsText' | translate }}
          </p>
        </div>

        @if (loading()) {
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            @for (item of [1, 2, 3]; track item) {
              <div
                class="h-40 animate-pulse rounded-2xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]"
              ></div>
            }
          </div>
        } @else if (homeSkillCategories().length) {
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            @for (
              category of homeSkillCategories();
              track category.id
            ) {
              <article
                class="rounded-2xl border border-[var(--app-border)]
                       bg-[var(--app-surface)] p-6"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="inline-grid h-10 w-10 place-items-center
                           rounded-xl text-white"
                    [style.background]="
                      category.color || 'var(--p-primary-color)'
                    "
                  >
                    <i
                      class="pi pi-chart-line"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <h3 class="text-base font-semibold">
                    {{ category.name }}
                  </h3>
                </div>

                <ul class="mt-5 space-y-2 text-sm">
                  @for (
                    skill of category.skills.slice(0, 6);
                    track skill.id
                  ) {
                    <li class="flex items-center gap-2">
                      <i
                        class="pi pi-check text-xs
                               text-[var(--p-primary-color)]"
                        aria-hidden="true"
                      ></i>

                      <span class="text-[var(--app-text-muted)]">
                        {{ skill.name }}
                      </span>
                    </li>
                  }
                </ul>
              </article>
            }
          </div>

          <a
            routerLink="/skills"
            class="mt-6 inline-flex items-center gap-2 text-sm
                   font-semibold text-[var(--p-primary-color)]
                   hover:underline"
          >
            {{ 'home.viewAllSkills' | translate }}

            <i
              class="pi pi-arrow-right text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        } @else {
          <div
            class="mt-8 rounded-2xl border border-dashed
                   border-[var(--app-border)] bg-[var(--app-surface)]
                   p-8 text-center"
          >
            <p class="text-sm text-[var(--app-text-muted)]">
              {{ 'home.noSkills' | translate }}
            </p>
          </div>
        }
      </section>

      <!-- Services -->
      <section>
        <div
          class="flex flex-col justify-between gap-4
                 sm:flex-row sm:items-end"
        >
          <div class="max-w-2xl">
            <p
              class="text-xs font-bold uppercase tracking-[0.14em]
                     text-[var(--p-primary-color)]"
            >
              {{ 'home.servicesEyebrow' | translate }}
            </p>

            <h2
              class="mt-2 text-2xl font-bold tracking-[-0.035em]
                     sm:text-3xl"
            >
              {{ 'home.servicesTitle' | translate }}
            </h2>

            <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
              {{ 'home.servicesText' | translate }}
            </p>
          </div>

          <a
            routerLink="/services"
            class="inline-flex shrink-0 items-center gap-2 text-sm
                   font-semibold text-[var(--p-primary-color)]
                   hover:underline"
          >
            {{ 'home.viewAllServices' | translate }}

            <i
              class="pi pi-arrow-right text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        </div>

        @if (loading()) {
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            @for (item of [1, 2, 3]; track item) {
              <div
                class="h-40 animate-pulse rounded-2xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]"
              ></div>
            }
          </div>
        } @else if (homeServices().length) {
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            @for (service of homeServices(); track service.id) {
              <article
                class="rounded-2xl border border-[var(--app-border)]
                       bg-[var(--app-surface)] p-6"
              >
                @if (serviceImageUrl(service); as imageUrl) {
                  <img
                    [src]="imageUrl"
                    [alt]="service.name"
                    class="h-11 w-11 rounded-xl object-cover
                           border border-[var(--app-border)]"
                    loading="lazy"
                  />
                } @else {
                  <span
                    class="inline-grid h-11 w-11 place-items-center
                           rounded-xl bg-[var(--app-surface-muted)]
                           text-[var(--p-primary-color)]"
                  >
                    <i
                      class="pi pi-briefcase text-base"
                      aria-hidden="true"
                    ></i>
                  </span>
                }

                <h3 class="mt-5 text-base font-semibold">
                  {{ service.name }}
                </h3>

                <p
                  class="mt-2 text-sm leading-7
                         text-[var(--app-text-muted)]"
                >
                  {{ service.description }}
                </p>
              </article>
            }
          </div>
        } @else {
          <div
            class="mt-8 rounded-2xl border border-dashed
                   border-[var(--app-border)] bg-[var(--app-surface)]
                   p-8 text-center"
          >
            <p class="text-sm text-[var(--app-text-muted)]">
              {{ 'home.noServices' | translate }}
            </p>
          </div>
        }
      </section>

      <!-- À propos -->
      <section
        id="about"
        class="scroll-mt-24 rounded-3xl border
               border-[var(--app-border)] bg-[var(--app-surface)]
               p-8 sm:p-10"
      >
        <div
          class="grid items-start gap-8
                 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
        >
          <div>
            <p
              class="text-xs font-bold uppercase tracking-[0.14em]
                     text-[var(--p-primary-color)]"
            >
              {{ 'home.aboutEyebrow' | translate }}
            </p>

            <h2
              class="mt-2 text-2xl font-bold tracking-[-0.035em]
                     sm:text-3xl"
            >
              {{ 'home.aboutTitle' | translate }}
            </h2>

            <a
              routerLink="/cv"
              class="mt-6 inline-flex items-center gap-2 text-sm
                     font-semibold text-[var(--p-primary-color)]
                     hover:underline"
            >
              {{ 'home.viewTimeline' | translate }}

              <i
                class="pi pi-arrow-right text-xs rtl:rotate-180"
                aria-hidden="true"
              ></i>
            </a>
          </div>

          <div class="space-y-6">
            <p class="text-base leading-8 text-[var(--app-text-muted)]">
              {{
                about()?.description ||
                  ('portfolio.aboutText' | translate)
              }}
            </p>

            @if (about(); as info) {
              <div class="grid gap-3 sm:grid-cols-2">
                @if (info.location) {
                  <div
                    class="rounded-xl border border-[var(--app-border)]
                           bg-[var(--app-surface-muted)] p-4"
                  >
                    <p
                      class="text-xs font-bold uppercase tracking-wide
                             text-[var(--app-text-muted)]"
                    >
                      {{ 'home.location' | translate }}
                    </p>

                    <p class="mt-1 text-sm font-semibold">
                      {{ info.location }}
                    </p>
                  </div>
                }

                @if (info.availability) {
                  <div
                    class="rounded-xl border border-[var(--app-border)]
                           bg-[var(--app-surface-muted)] p-4"
                  >
                    <p
                      class="text-xs font-bold uppercase tracking-wide
                             text-[var(--app-text-muted)]"
                    >
                      {{ 'home.availability' | translate }}
                    </p>

                    <p class="mt-1 text-sm font-semibold">
                      {{ info.availability }}
                    </p>
                  </div>
                }

                @if (info.email) {
                  <div
                    class="rounded-xl border border-[var(--app-border)]
                           bg-[var(--app-surface-muted)] p-4"
                  >
                    <p
                      class="text-xs font-bold uppercase tracking-wide
                             text-[var(--app-text-muted)]"
                    >
                      {{ 'home.email' | translate }}
                    </p>

                    <a
                      [href]="'mailto:' + info.email"
                      class="mt-1 block text-sm font-semibold
                             hover:text-[var(--p-primary-color)]"
                    >
                      {{ info.email }}
                    </a>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Appel à l'action -->
      <section
        id="contact"
        class="relative scroll-mt-24 overflow-hidden rounded-3xl
               bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600
               px-8 py-12 text-white shadow-premium sm:px-12"
      >
        <div
          class="pointer-events-none absolute -end-16 -top-16 h-64 w-64
                 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        ></div>

        <div
          class="relative flex flex-col items-start justify-between
                 gap-8 lg:flex-row lg:items-center"
        >
          <div class="max-w-2xl">
            <p
              class="text-xs font-bold uppercase tracking-[0.14em]
                     text-indigo-100"
            >
              {{ 'home.contactEyebrow' | translate }}
            </p>

            <h2
              class="mt-2 text-2xl font-bold tracking-[-0.035em]
                     sm:text-3xl"
            >
              {{ 'home.contactTitle' | translate }}
            </h2>

            <p class="mt-3 leading-7 text-indigo-100">
              {{ 'home.contactText' | translate }}
            </p>
          </div>

          <a
            routerLink="/contact"
            class="inline-flex min-h-11 shrink-0 items-center
                   justify-center gap-2 rounded-xl bg-white px-5 py-3
                   text-sm font-semibold text-indigo-700
                   transition hover:bg-indigo-50"
          >
            {{ 'home.contactCta' | translate }}

            <i
              class="pi pi-send text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {
  private readonly aboutService = inject(AboutService);
  private readonly projectService = inject(ProjectService);
  private readonly skillService = inject(SkillService);
  private readonly serviceOfferService = inject(
    ServiceOfferService
  );

  readonly about = signal<AboutPublic | null>(null);
  readonly projects = signal<ProjectPublic[]>([]);
  readonly skillCategories = signal<SkillCategoryPublic[]>([]);
  readonly services = signal<ServiceOfferPublic[]>([]);
  readonly loading = signal(true);

  readonly homeSkillCategories = computed(() =>
    this.skillCategories().slice(0, 3)
  );

  readonly homeServices = computed(() =>
    this.services().slice(0, 3)
  );

  constructor() {
    forkJoin({
      about: this.aboutService
        .getPublicAbout()
        .pipe(catchError(() => of(null))),

      projects: this.projectService
        .getPublicProjects({
          page: 0,
          size: 3,
          featured: true
        })
        .pipe(
          switchMap(page =>
            page.content.length
              ? of(page)
              : this.projectService.getPublicProjects({
                  page: 0,
                  size: 3
                })
          ),
          catchError(() => of(EMPTY_PROJECT_PAGE))
        ),

      skills: this.skillService
        .getPublicSkills()
        .pipe(
          catchError(() =>
            of([] as SkillCategoryPublic[])
          )
        ),

      services: this.serviceOfferService
        .getPublicServices()
        .pipe(
          catchError(() =>
            of([] as ServiceOfferPublic[])
          )
        )
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(result => {
        this.about.set(result.about);
        this.projects.set(result.projects.content);
        this.skillCategories.set(result.skills);
        this.services.set(result.services);
      });
  }

  projectImage(project: ProjectPublic): string | null {
    return resolveMediaUrl(project.images?.[0]);
  }

  serviceImageUrl(service: ServiceOfferPublic): string | null {
    return service.imageUrl ?? resolveMediaUrl(service.image);
  }
}
