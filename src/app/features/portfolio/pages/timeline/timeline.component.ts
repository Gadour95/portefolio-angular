import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import {
  TimelinePublicItem
} from '../../../../core/models/timeline.model';

import { TimelineService } from '../../../../core/services/timeline.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <div class="app-container space-y-10 py-10 sm:py-14">
      <header class="max-w-3xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'nav.timeline' | translate }}
        </p>

        <h1
          class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {{ 'publicPages.timeline.title' | translate }}
        </h1>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.timeline.subtitle' | translate }}
        </p>
      </header>

      @if (loading()) {
        <div class="grid gap-8 lg:grid-cols-2">
          @for (item of [1, 2]; track item) {
            <div class="space-y-4">
              <div
                class="h-6 w-40 animate-pulse rounded
                       bg-[var(--app-surface-muted)]"
              ></div>

              @for (row of [1, 2, 3]; track row) {
                <div
                  class="h-32 animate-pulse rounded-2xl
                         bg-[var(--app-surface-muted)]"
                ></div>
              }
            </div>
          }
        </div>
      } @else if (error()) {
        <div
          class="rounded-2xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-8 text-center"
        >
          <p class="text-sm text-[var(--app-text-muted)]">
            {{ 'common.loadingError' | translate }}
          </p>

          <button
            type="button"
            class="mt-5 inline-flex min-h-10 items-center gap-2
                   rounded-xl bg-[var(--p-primary-color)] px-4 py-2
                   text-sm font-semibold
                   text-[var(--p-primary-inverse-color)]"
            (click)="load()"
          >
            <i
              class="pi pi-refresh text-xs"
              aria-hidden="true"
            ></i>

            {{ 'common.retry' | translate }}
          </button>
        </div>
      } @else if (!items().length) {
        <div
          class="rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-history text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'publicPages.timeline.empty' | translate }}
          </p>
        </div>
      } @else {
        <div class="grid gap-10 lg:grid-cols-2">
          @if (experiences().length) {
            <section>
              <div class="flex items-center gap-3">
                <span
                  class="inline-grid h-10 w-10 place-items-center
                         rounded-xl bg-[var(--p-primary-color)]
                         text-[var(--p-primary-inverse-color)]"
                >
                  <i
                    class="pi pi-briefcase"
                    aria-hidden="true"
                  ></i>
                </span>

                <h2 class="text-xl font-bold">
                  {{ 'publicPages.timeline.experience' | translate }}
                </h2>
              </div>

              <ol class="mt-6 space-y-4 border-s border-[var(--app-border)] ps-6">
                @for (item of experiences(); track item.id) {
                  <li class="relative">
                    <span
                      class="absolute -start-[1.9rem] top-2 h-3 w-3
                             rounded-full border-2 border-[var(--app-surface)]
                             bg-[var(--p-primary-color)]"
                      aria-hidden="true"
                    ></span>

                    <article
                      class="rounded-2xl border border-[var(--app-border)]
                             bg-[var(--app-surface)] p-6"
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

                      <h3 class="mt-2 text-base font-semibold">
                        {{ item.role }}
                      </h3>

                      <p
                        class="mt-1 text-sm font-medium
                               text-[var(--app-text-muted)]"
                      >
                        {{ item.organization }}
                      </p>

                      @if (item.description) {
                        <p
                          class="mt-3 text-sm leading-7
                                 text-[var(--app-text-muted)]"
                        >
                          {{ item.description }}
                        </p>
                      }
                    </article>
                  </li>
                }
              </ol>
            </section>
          }

          @if (education().length) {
            <section>
              <div class="flex items-center gap-3">
                <span
                  class="inline-grid h-10 w-10 place-items-center
                         rounded-xl bg-[var(--p-primary-color)]
                         text-[var(--p-primary-inverse-color)]"
                >
                  <i
                    class="pi pi-graduation-cap"
                    aria-hidden="true"
                  ></i>
                </span>

                <h2 class="text-xl font-bold">
                  {{ 'publicPages.timeline.education' | translate }}
                </h2>
              </div>

              <ol class="mt-6 space-y-4 border-s border-[var(--app-border)] ps-6">
                @for (item of education(); track item.id) {
                  <li class="relative">
                    <span
                      class="absolute -start-[1.9rem] top-2 h-3 w-3
                             rounded-full border-2 border-[var(--app-surface)]
                             bg-[var(--p-primary-color)]"
                      aria-hidden="true"
                    ></span>

                    <article
                      class="rounded-2xl border border-[var(--app-border)]
                             bg-[var(--app-surface)] p-6"
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

                      <h3 class="mt-2 text-base font-semibold">
                        {{ item.role }}
                      </h3>

                      <p
                        class="mt-1 text-sm font-medium
                               text-[var(--app-text-muted)]"
                      >
                        {{ item.organization }}
                      </p>

                      @if (item.description) {
                        <p
                          class="mt-3 text-sm leading-7
                                 text-[var(--app-text-muted)]"
                        >
                          {{ item.description }}
                        </p>
                      }
                    </article>
                  </li>
                }
              </ol>
            </section>
          }
        </div>
      }
    </div>
  `
})
export class TimelineComponent {
  private readonly timelineService = inject(
    TimelineService
  );

  private readonly language = inject(LanguageService);

  readonly items = signal<TimelinePublicItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly experiences = computed(() =>
    this.items().filter(item => item.type === 'EXPERIENCE')
  );

  readonly education = computed(() =>
    this.items().filter(item => item.type === 'EDUCATION')
  );

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.timelineService.getPublicTimeline().subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },

      error: () => {
        this.items.set([]);
        this.loading.set(false);
        this.error.set(true);
      }
    });
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
