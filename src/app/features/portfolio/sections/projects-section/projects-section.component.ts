import {
  Component,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import {
  resolveMediaUrl
} from '../../../../core/http/media-url';

import {
  ProjectPublic
} from '../../../../core/models/project.model';

import { LanguageService } from '../../../../core/services/language.service';
import { ProjectService } from '../../../../core/services/project.service';

import {
  ScrollStripComponent
} from '../../../../shared/components/scroll-strip/scroll-strip.component';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ScrollStripComponent
  ],

  template: `
    <section id="projects" class="scroll-mt-32">
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
        <div class="mt-8 flex gap-4 overflow-hidden">
          @for (item of [1, 2, 3]; track item) {
            <div
              class="w-[21rem] shrink-0 animate-pulse overflow-hidden
                     rounded-3xl border border-[var(--app-border)]
                     bg-[var(--app-surface)]"
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
      } @else if (!projects().length) {
        <div
          class="mt-8 rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-folder-open text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'home.noProjects' | translate }}
          </p>
        </div>
      } @else {
        <div class="mt-8">
          <app-scroll-strip>
            @for (project of projects(); track project.id) {
              <a
                [routerLink]="['/projects', project.slug]"
                class="group flex w-[21rem] shrink-0 snap-start flex-col
                       overflow-hidden rounded-3xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]
                       transition hover:-translate-y-1
                       hover:border-[var(--p-primary-color)]
                       hover:shadow-[0_24px_60px_-38px_rgba(79,70,229,0.6)]
                       sm:w-[23rem]"
              >
                <div
                  class="relative h-44 overflow-hidden
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
                             transition duration-500
                             group-hover:scale-105"
                      loading="lazy"
                    />
                  } @else {
                    <div
                      class="flex h-full items-center justify-center
                             bg-gradient-to-br from-indigo-500/15
                             to-blue-500/10"
                    >
                      <i
                        class="pi pi-image text-4xl
                               text-[var(--p-primary-color)]"
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
                      class="text-[0.68rem] font-bold uppercase
                             tracking-[0.12em]
                             text-[var(--p-primary-color)]"
                    >
                      {{ project.role }}
                    </p>
                  }

                  <h3 class="mt-1 text-base font-semibold">
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
                          class="rounded-full border
                                 border-[var(--app-border)] px-2.5 py-1
                                 text-[0.65rem] font-semibold uppercase
                                 tracking-wide
                                 text-[var(--app-text-muted)]"
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
          </app-scroll-strip>
        </div>
      }
    </section>
  `
})
export class ProjectsSectionComponent {
  private readonly projectService = inject(ProjectService);
  private readonly language = inject(LanguageService);

  readonly projects = signal<ProjectPublic[]>([]);
  readonly loading = signal(true);

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);

    this.projectService
      .getTopPublicProjects(5)
      .subscribe({
        next: projects => {
          this.projects.set(projects);
          this.loading.set(false);
        },

        error: () => {
          this.projects.set([]);
          this.loading.set(false);
        }
      });
  }

  projectImage(project: ProjectPublic): string | null {
    return resolveMediaUrl(project.images?.[0]);
  }
}
