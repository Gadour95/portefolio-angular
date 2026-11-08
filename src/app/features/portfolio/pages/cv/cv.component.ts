import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { ActivatedRoute } from '@angular/router';

import {
  catchError,
  finalize,
  forkJoin,
  of
} from 'rxjs';

import { AboutPublic } from '../../../../core/models/about.model';
import {
  SkillCategoryPublic
} from '../../../../core/models/skill.model';
import {
  TimelinePublicItem
} from '../../../../core/models/timeline.model';

import { AboutService } from '../../../../core/services/about.service';
import { LanguageService } from '../../../../core/services/language.service';
import { SkillService } from '../../../../core/services/skill.service';
import { TimelineService } from '../../../../core/services/timeline.service';

@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <div class="app-container space-y-10 py-10 sm:py-14">
      <header
        class="flex flex-col justify-between gap-5
               sm:flex-row sm:items-end"
      >
        <div class="max-w-3xl">
          <p
            class="text-xs font-bold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'nav.cv' | translate }}
          </p>

          <h1
            class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
          >
            {{ 'publicPages.cv.title' | translate }}
          </h1>

          <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
            {{ 'publicPages.cv.subtitle' | translate }}
          </p>
        </div>

        <button
          type="button"
          class="no-print inline-flex min-h-11 shrink-0 items-center
                 justify-center gap-2 rounded-xl border
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 px-5 py-3 text-sm font-semibold transition
                 hover:border-[var(--p-primary-color)]
                 hover:text-[var(--p-primary-color)]"
          (click)="print()"
        >
          <i
            class="pi pi-print text-xs"
            aria-hidden="true"
          ></i>

          {{ 'publicPages.cv.print' | translate }}
        </button>
      </header>

      @if (loading()) {
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div
            class="h-72 animate-pulse rounded-2xl
                   bg-[var(--app-surface-muted)]"
          ></div>

          <div class="space-y-4">
            @for (item of [1, 2, 3]; track item) {
              <div
                class="h-32 animate-pulse rounded-2xl
                       bg-[var(--app-surface-muted)]"
              ></div>
            }
          </div>
        </div>
      } @else {
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <!-- Colonne profil -->
          <aside
            class="space-y-6 rounded-2xl border border-[var(--app-border)]
                   bg-[var(--app-surface)] p-6 sm:p-8"
          >
            <div>
              <span
                class="inline-grid h-16 w-16 place-items-center rounded-2xl
                       bg-gradient-to-br from-indigo-600 to-blue-600
                       text-2xl font-bold text-white"
              >
                {{ initials() }}
              </span>

              <h2 class="mt-4 text-xl font-bold">
                {{ 'app.name' | translate }}
              </h2>

              <p class="text-sm font-medium text-[var(--p-primary-color)]">
                {{ 'app.tagline' | translate }}
              </p>
            </div>

            @if (about()?.description; as description) {
              <p class="text-sm leading-7 app-muted">
                {{ description }}
              </p>
            }

            <div class="border-t border-[var(--app-border)] pt-5">
              <h3
                class="text-xs font-bold uppercase tracking-wide
                       text-[var(--app-text-muted)]"
              >
                {{ 'publicPages.cv.contact' | translate }}
              </h3>

              <ul class="mt-3 space-y-2.5 text-sm">
                @if (about()?.email; as email) {
                  <li class="flex items-start gap-2.5">
                    <i
                      class="pi pi-envelope mt-0.5 text-xs
                             text-[var(--p-primary-color)]"
                      aria-hidden="true"
                    ></i>

                    <a
                      [href]="'mailto:' + email"
                      class="break-all hover:text-[var(--p-primary-color)]"
                    >
                      {{ email }}
                    </a>
                  </li>
                }

                @if (about()?.location; as location) {
                  <li class="flex items-start gap-2.5">
                    <i
                      class="pi pi-map-marker mt-0.5 text-xs
                             text-[var(--p-primary-color)]"
                      aria-hidden="true"
                    ></i>

                    <span class="app-muted">{{ location }}</span>
                  </li>
                }

                @if (about()?.availability; as availability) {
                  <li class="flex items-start gap-2.5">
                    <i
                      class="pi pi-check-circle mt-0.5 text-xs
                             text-[var(--p-primary-color)]"
                      aria-hidden="true"
                    ></i>

                    <span class="app-muted">{{ availability }}</span>
                  </li>
                }
              </ul>
            </div>

            @if (categories().length) {
              <div class="border-t border-[var(--app-border)] pt-5">
                <h3
                  class="text-xs font-bold uppercase tracking-wide
                         text-[var(--app-text-muted)]"
                >
                  {{ 'publicPages.cv.skills' | translate }}
                </h3>

                <div class="mt-3 space-y-4">
                  @for (category of categories(); track category.id) {
                    <div>
                      <p class="text-sm font-semibold">
                        {{ category.name }}
                      </p>

                      <div class="mt-1.5 flex flex-wrap gap-1.5">
                        @for (
                          skill of category.skills;
                          track skill.id
                        ) {
                          <span
                            class="rounded-full border
                                   border-[var(--app-border)] px-2.5
                                   py-0.5 text-xs app-muted"
                          >
                            {{ skill.name }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </aside>

          <!-- Colonne parcours -->
          <div class="space-y-6">
            <!-- Expérience -->
            <section
              class="rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] p-6 sm:p-8"
            >
              <div class="flex items-center gap-3">
                <span
                  class="inline-grid h-10 w-10 place-items-center
                         rounded-xl bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-briefcase"
                    aria-hidden="true"
                  ></i>
                </span>

                <h2 class="text-lg font-bold">
                  {{ 'publicPages.cv.experience' | translate }}
                </h2>
              </div>

              @if (experiences().length) {
                <ol class="mt-6 space-y-5">
                  @for (item of experiences(); track item.id) {
                    <li
                      class="border-s-2 border-[var(--app-border)]
                             ps-4"
                    >
                      <p
                        class="text-xs font-bold uppercase tracking-wide
                               text-[var(--p-primary-color)]"
                      >
                        {{ formatDate(item.startDate) }} —

                        @if (item.current) {
                          {{ 'publicPages.timeline.present' | translate }}
                        } @else {
                          {{ formatDate(item.endDate) }}
                        }
                      </p>

                      <h3 class="mt-1 text-base font-semibold">
                        {{ item.role }}
                      </h3>

                      <p class="text-sm font-medium app-muted">
                        {{ item.organization }}
                      </p>

                      @if (item.description) {
                        <p class="mt-2 text-sm leading-7 app-muted">
                          {{ item.description }}
                        </p>
                      }
                    </li>
                  }
                </ol>
              } @else {
                <p class="mt-4 text-sm app-muted">
                  {{ 'publicPages.cv.noExperience' | translate }}
                </p>
              }
            </section>

            <!-- Formation -->
            <section
              class="rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] p-6 sm:p-8"
            >
              <div class="flex items-center gap-3">
                <span
                  class="inline-grid h-10 w-10 place-items-center
                         rounded-xl bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-graduation-cap"
                    aria-hidden="true"
                  ></i>
                </span>

                <h2 class="text-lg font-bold">
                  {{ 'publicPages.cv.education' | translate }}
                </h2>
              </div>

              @if (education().length) {
                <ol class="mt-6 space-y-5">
                  @for (item of education(); track item.id) {
                    <li
                      class="border-s-2 border-[var(--app-border)]
                             ps-4"
                    >
                      <p
                        class="text-xs font-bold uppercase tracking-wide
                               text-[var(--p-primary-color)]"
                      >
                        {{ formatDate(item.startDate) }} —

                        @if (item.current) {
                          {{ 'publicPages.timeline.present' | translate }}
                        } @else {
                          {{ formatDate(item.endDate) }}
                        }
                      </p>

                      <h3 class="mt-1 text-base font-semibold">
                        {{ item.role }}
                      </h3>

                      <p class="text-sm font-medium app-muted">
                        {{ item.organization }}
                      </p>

                      @if (item.description) {
                        <p class="mt-2 text-sm leading-7 app-muted">
                          {{ item.description }}
                        </p>
                      }
                    </li>
                  }
                </ol>
              } @else {
                <p class="mt-4 text-sm app-muted">
                  {{ 'publicPages.cv.noEducation' | translate }}
                </p>
              }
            </section>
          </div>
        </div>
      }
    </div>
  `
})
export class CvComponent {
  private readonly aboutService = inject(AboutService);
  private readonly timelineService = inject(TimelineService);
  private readonly skillService = inject(SkillService);
  private readonly language = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);

  private printTriggered = false;

  readonly about = signal<AboutPublic | null>(null);
  readonly timeline = signal<TimelinePublicItem[]>([]);
  readonly categories = signal<SkillCategoryPublic[]>([]);
  readonly loading = signal(true);

  readonly experiences = computed(() =>
    this.timeline().filter(item => item.type === 'EXPERIENCE')
  );

  readonly education = computed(() =>
    this.timeline().filter(item => item.type === 'EDUCATION')
  );

  readonly initials = computed(() => {
    const name = this.about()?.email ?? '';

    return name
      ? name.charAt(0).toUpperCase()
      : 'P';
  });

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  private load(): void {
    this.loading.set(true);

    forkJoin({
      about: this.aboutService
        .getPublicAbout()
        .pipe(catchError(() => of(null))),

      timeline: this.timelineService
        .getPublicTimeline()
        .pipe(
          catchError(() => of([] as TimelinePublicItem[]))
        ),

      categories: this.skillService
        .getPublicSkills()
        .pipe(
          catchError(() =>
            of([] as SkillCategoryPublic[])
          )
        )
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.triggerPrintIfRequested();
        })
      )
      .subscribe(result => {
        this.about.set(result.about);
        this.timeline.set(result.timeline);
        this.categories.set(result.categories);
      });
  }

  print(): void {
    window.print();
  }

  private triggerPrintIfRequested(): void {
    if (this.printTriggered) {
      return;
    }

    if (
      this.route.snapshot.queryParamMap.get('download') !==
      '1'
    ) {
      return;
    }

    this.printTriggered = true;

    window.setTimeout(() => window.print(), 400);
  }

  formatDate(value: number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value > 0 && value < 10000) {
      return String(value);
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? String(value)
      : String(date.getFullYear());
  }
}
