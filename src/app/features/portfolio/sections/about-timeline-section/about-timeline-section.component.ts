import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import {
  AboutPublic
} from '../../../../core/models/about.model';

import {
  TimelinePublicItem,
  TimelineType
} from '../../../../core/models/timeline.model';

import {
  LanguageService
} from '../../../../core/services/language.service';

import {
  TimelineService
} from '../../../../core/services/timeline.service';

@Component({
  selector: 'app-about-timeline-section',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <section
      id="about"
      class="grid scroll-mt-32 items-start gap-12 py-4
             lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]
             lg:gap-14 xl:gap-20"
    >
      <!-- À propos : sans carte externe -->
      <div class="min-w-0 px-1 py-3 sm:px-2 lg:py-7">
        <div class="flex items-center gap-3">
          <span
            class="h-px w-9 bg-[var(--p-primary-color)]"
            aria-hidden="true"
          ></span>

          <p
            class="text-xs font-bold uppercase tracking-[0.2em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'home.aboutEyebrow' | translate }}
          </p>
        </div>

        <h2
          class="mt-4 text-3xl font-bold tracking-[-0.045em]
                 sm:text-4xl"
        >
          {{ 'home.aboutTitle' | translate }}
        </h2>

        <p
          class="mt-6 max-w-xl whitespace-pre-line text-base
                 leading-8 text-[var(--app-text-muted)] sm:text-lg"
        >
          {{
            about()?.description ||
              ('portfolio.aboutText' | translate)
          }}
        </p>

        @if (about(); as info) {
          <dl class="mt-8 space-y-5">
            @if (info.location) {
              <div class="flex items-start gap-4">
                <span
                  class="inline-grid h-11 w-11 shrink-0
                         place-items-center rounded-2xl
                         bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                  aria-hidden="true"
                >
                  <i class="pi pi-map-marker text-base"></i>
                </span>

                <div class="min-w-0 pt-0.5">
                  <dt
                    class="text-xs font-medium
                           text-[var(--app-text-muted)]"
                  >
                    {{ 'home.location' | translate }}
                  </dt>

                  <dd class="mt-1 text-sm font-semibold sm:text-base">
                    {{ info.location }}
                  </dd>
                </div>
              </div>
            }

            @if (info.availability) {
              <div class="flex items-start gap-4">
                <span
                  class="inline-grid h-11 w-11 shrink-0
                         place-items-center rounded-2xl
                         bg-emerald-500/10 text-emerald-600
                         dark:text-emerald-400"
                  aria-hidden="true"
                >
                  <i class="pi pi-check-circle text-base"></i>
                </span>

                <div class="min-w-0 pt-0.5">
                  <dt
                    class="text-xs font-medium
                           text-[var(--app-text-muted)]"
                  >
                    {{ 'home.availability' | translate }}
                  </dt>

                  <dd
                    class="mt-1 inline-flex items-center gap-2
                           text-sm font-semibold sm:text-base"
                  >
                    <span
                      class="h-1.5 w-1.5 shrink-0 rounded-full
                             bg-emerald-500"
                      aria-hidden="true"
                    ></span>

                    {{ info.availability }}
                  </dd>
                </div>
              </div>
            }

            @if (info.email) {
              <div class="flex items-start gap-4">
                <span
                  class="inline-grid h-11 w-11 shrink-0
                         place-items-center rounded-2xl
                         bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                  aria-hidden="true"
                >
                  <i class="pi pi-envelope text-base"></i>
                </span>

                <div class="min-w-0 pt-0.5">
                  <dt
                    class="text-xs font-medium
                           text-[var(--app-text-muted)]"
                  >
                    {{ 'home.email' | translate }}
                  </dt>

                  <dd class="mt-1">
                    <a
                      [href]="'mailto:' + info.email"
                      class="break-all text-sm font-semibold
                             underline-offset-4 transition-colors
                             hover:text-[var(--p-primary-color)]
                             hover:underline
                             focus-visible:outline
                             focus-visible:outline-2
                             focus-visible:outline-offset-4
                             focus-visible:outline-[var(--p-primary-color)]
                             sm:text-base"
                    >
                      {{ info.email }}
                    </a>
                  </dd>
                </div>
              </div>
            }
          </dl>
        }

        <!-- Contact -->
        <div class="mt-9">
          <a
            routerLink="/"
            fragment="contact"
            class="group inline-flex min-h-12 items-center
                   justify-center gap-3 rounded-xl
                   bg-[var(--p-primary-color)] px-5 py-3
                   text-sm font-semibold
                   text-[var(--p-primary-inverse-color)]
                   shadow-[0_14px_30px_-18px_rgba(79,70,229,0.65)]
                   transition
                   hover:-translate-y-0.5
                   hover:bg-[var(--p-primary-hover-color)]
                   focus-visible:outline
                   focus-visible:outline-2
                   focus-visible:outline-offset-4
                   focus-visible:outline-[var(--p-primary-color)]
                   motion-reduce:transform-none"
          >
            {{ 'home.contactCta' | translate }}

            <i
              class="pi pi-arrow-up-right text-xs transition-transform
                     group-hover:-translate-y-0.5
                     rtl:-rotate-90
                     motion-reduce:transform-none"
              aria-hidden="true"
            ></i>
          </a>
        </div>
      </div>

      <!-- Parcours : sans carte externe -->
      <div class="min-w-0 px-1 py-3 sm:px-2 lg:py-7">
        <!-- En-tête -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <span
                class="h-px w-9 bg-[var(--p-primary-color)]"
                aria-hidden="true"
              ></span>

              <p
                class="text-xs font-bold uppercase tracking-[0.2em]
                       text-[var(--p-primary-color)]"
              >
                {{ 'nav.timeline' | translate }}
              </p>
            </div>

            <h2
              class="mt-4 text-3xl font-bold tracking-[-0.045em]
                     sm:text-4xl"
            >
              {{ 'publicPages.timeline.title' | translate }}
            </h2>
          </div>

          <span
            class="inline-grid h-12 w-12 shrink-0
                   place-items-center rounded-2xl
                   bg-[var(--app-surface-muted)]
                   text-[var(--p-primary-color)]"
            aria-hidden="true"
          >
            <i class="pi pi-history text-xl"></i>
          </span>
        </div>

        <!-- Filtres -->
        <div
          class="mt-7 grid grid-cols-2 gap-1.5 rounded-2xl
                 border border-[var(--app-border)]
                 bg-[var(--app-surface-muted)] p-1.5"
          role="group"
          [attr.aria-label]="'publicPages.timeline.title' | translate"
        >
          @for (filter of timelineFilters; track filter.type) {
            <button
              type="button"
              class="timeline-filter"
              [class.timeline-filter-active]="
                activeType() === filter.type
              "
              [attr.aria-pressed]="activeType() === filter.type"
              (click)="activeType.set(filter.type)"
            >
              <i
                [class]="filter.icon + ' shrink-0 text-sm'"
                aria-hidden="true"
              ></i>

              <span class="min-w-0">
                {{ filter.label | translate }}
              </span>
            </button>
          }
        </div>

        <!-- Contenu de la timeline -->
        <div class="mt-7" [attr.aria-busy]="loading()">
          @if (loading()) {
            <div class="space-y-5" aria-hidden="true">
              @for (row of [1, 2, 3]; track row) {
                <div class="flex gap-4">
                  <div
                    class="h-10 w-10 shrink-0 animate-pulse
                           rounded-xl bg-[var(--app-surface-muted)]"
                  ></div>

                  <div
                    class="h-36 flex-1 animate-pulse rounded-2xl
                           bg-[var(--app-surface-muted)]"
                  ></div>
                </div>
              }
            </div>
          } @else if (!visibleItems().length) {
            <div class="px-5 py-12 text-center">
              <span
                class="mx-auto grid h-14 w-14 place-items-center
                       rounded-2xl bg-[var(--app-surface-muted)]
                       text-[var(--app-text-muted)]"
                aria-hidden="true"
              >
                <i class="pi pi-history text-2xl"></i>
              </span>

              <p
                class="mt-4 text-sm leading-6
                       text-[var(--app-text-muted)]"
              >
                {{ 'publicPages.timeline.empty' | translate }}
              </p>
            </div>
          } @else {
            <ol>
              @for (
                item of visibleItems();
                track item.id;
                let last = $last
              ) {
                <li class="relative flex gap-3 sm:gap-4">
                  <!-- Axe et icône -->
                  <div
                    class="relative flex w-10 shrink-0
                           justify-center"
                  >
                    @if (!last) {
                      <span
                        class="absolute bottom-0 start-1/2 top-10
                               w-px -translate-x-1/2
                               bg-[var(--app-border)]
                               rtl:translate-x-1/2"
                        aria-hidden="true"
                      ></span>
                    }

                    <span
                      class="relative z-10 inline-grid h-10 w-10
                             place-items-center rounded-xl
                             border border-[var(--app-border)]
                             bg-[var(--app-surface)]
                             text-[var(--p-primary-color)]
                             shadow-sm"
                      aria-hidden="true"
                    >
                      <i
                        [class]="
                          item.type === 'EDUCATION'
                            ? 'pi pi-graduation-cap text-base'
                            : 'pi pi-briefcase text-base'
                        "
                      ></i>
                    </span>
                  </div>

                  <!-- Carte interne -->
                  <article
                    class="timeline-entry mb-5 min-w-0 flex-1"
                    [class.timeline-entry-last]="last"
                  >
                    <!-- Date -->
                    <div
                      class="flex flex-wrap items-center gap-x-2
                             gap-y-1 text-xs font-semibold
                             text-[var(--p-primary-color)]"
                    >
                      <i
                        class="pi pi-calendar text-xs"
                        aria-hidden="true"
                      ></i>

                      <span dir="auto">
                        {{ formatDate(item.startDate) }}
                        —

                        @if (item.current) {
                          {{
                            'publicPages.timeline.present'
                              | translate
                          }}
                        } @else {
                          {{ formatDate(item.endDate) }}
                        }
                      </span>

                      @if (item.current) {
                        <span
                          class="h-1.5 w-1.5 rounded-full
                                 bg-emerald-500"
                          aria-hidden="true"
                        ></span>
                      }
                    </div>

                    <!-- Diplôme ou poste -->
                    <h3
                      class="mt-3 flex items-start gap-2.5
                             text-base font-bold leading-7
                             tracking-[-0.015em] sm:text-lg"
                    >
                      <i
                        [class]="
                          item.type === 'EDUCATION'
                            ? 'pi pi-verified mt-1.5 shrink-0 text-sm text-[var(--p-primary-color)]'
                            : 'pi pi-briefcase mt-1.5 shrink-0 text-sm text-[var(--p-primary-color)]'
                        "
                        aria-hidden="true"
                      ></i>

                      <span class="min-w-0 break-words">
                        {{ item.role }}
                      </span>
                    </h3>

                    <!-- Université ou organisation -->
                    <p
                      class="mt-2 flex items-start gap-2.5
                             text-sm font-medium leading-6
                             text-[var(--app-text-muted)]"
                    >
                      <i
                        [class]="
                          item.type === 'EDUCATION'
                            ? 'pi pi-building-columns mt-1 shrink-0 text-sm'
                            : 'pi pi-building mt-1 shrink-0 text-sm'
                        "
                        aria-hidden="true"
                      ></i>

                      <span class="min-w-0 break-words">
                        {{ item.organization }}
                      </span>
                    </p>

                    <!-- Description -->
                    @if (item.description) {
                      <p
                        class="mt-4 whitespace-pre-line
                               border-t border-[var(--app-border)]
                               pt-3 text-sm leading-7
                               text-[var(--app-text-muted)]"
                      >
                        {{ item.description }}
                      </p>
                    }
                  </article>
                </li>
              }
            </ol>
          }
        </div>
      </div>
    </section>
  `,

  styles: `
    :host {
      display: block;
    }

    .timeline-filter {
      display: inline-flex;
      min-height: 2.75rem;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-radius: 0.75rem;
      padding: 0.625rem 0.75rem;
      color: var(--app-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.4;
      cursor: pointer;
      transition:
        background-color 180ms ease,
        color 180ms ease,
        box-shadow 180ms ease;
    }

    .timeline-filter:hover {
      color: var(--p-primary-color);
    }

    .timeline-filter-active {
      background: var(--app-surface);
      color: var(--p-primary-color);
      box-shadow: 0 2px 8px -4px rgb(15 23 42 / 0.25);
    }

    .timeline-filter:focus-visible {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 2px;
    }

    .timeline-entry {
      border: 1px solid var(--app-border);
      border-radius: 1rem;
      background: var(--app-surface);
      padding: 1.125rem;
      box-shadow: 0 8px 24px -20px rgb(15 23 42 / 0.2);
      transition:
        border-color 200ms ease,
        box-shadow 200ms ease,
        transform 200ms ease;
    }

    .timeline-entry:hover {
      border-color: var(--p-primary-color);
      box-shadow: 0 12px 30px -24px rgb(15 23 42 / 0.45);
      transform: translateY(-2px);
    }

    .timeline-entry-last {
      margin-bottom: 0;
    }

    @media (min-width: 640px) {
      .timeline-entry {
        padding: 1.25rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .timeline-filter,
      .timeline-entry {
        transition: none;
      }

      .timeline-entry:hover {
        transform: none;
      }
    }
  `
})
export class AboutTimelineSectionComponent {
  private readonly timelineService = inject(TimelineService);
  private readonly language = inject(LanguageService);

  readonly about = input<AboutPublic | null>(null);

  readonly items = signal<TimelinePublicItem[]>([]);
  readonly loading = signal(true);

  readonly activeType = signal<TimelineType>('EXPERIENCE');

  readonly timelineFilters: ReadonlyArray<{
    type: TimelineType;
    label: string;
    icon: string;
  }> = [
    {
      type: 'EXPERIENCE',
      label: 'publicPages.timeline.experience',
      icon: 'pi pi-briefcase'
    },
    {
      type: 'EDUCATION',
      label: 'publicPages.timeline.education',
      icon: 'pi pi-graduation-cap'
    }
  ];

  readonly visibleItems = computed(() =>
    this.items().filter(
      item => item.type === this.activeType()
    )
  );

  constructor() {
    effect(onCleanup => {
      this.language.current();

      const subscription = untracked(() => this.load());

      onCleanup(() => subscription.unsubscribe());
    });
  }

  private load() {
    this.loading.set(true);

    return this.timelineService.getPublicTimeline().subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },

      error: () => {
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  formatDate(value: number | null | undefined): string {
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