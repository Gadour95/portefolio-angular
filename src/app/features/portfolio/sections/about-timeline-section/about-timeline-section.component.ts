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

import { AboutPublic } from '../../../../core/models/about.model';
import {
  TimelinePublicItem,
  TimelineType
} from '../../../../core/models/timeline.model';

import { LanguageService } from '../../../../core/services/language.service';
import { TimelineService } from '../../../../core/services/timeline.service';

@Component({
  selector: 'app-about-timeline-section',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <section
      id="about"
      class="grid scroll-mt-32 items-start gap-6
             lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
    >
      <!-- À propos -->
      <div
        class="rounded-3xl border border-[var(--app-border)]
               bg-[var(--app-surface)] p-7 sm:p-9"
      >
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'home.aboutEyebrow' | translate }}
        </p>

        <h2
          class="mt-2 text-2xl font-bold tracking-[-0.035em] sm:text-3xl"
        >
          {{ 'home.aboutTitle' | translate }}
        </h2>

        <p
          class="mt-5 text-base leading-8
                 text-[var(--app-text-muted)]"
        >
          {{
            about()?.description ||
              ('portfolio.aboutText' | translate)
          }}
        </p>

        @if (about(); as info) {
          <div class="mt-7 grid gap-3 sm:grid-cols-2">
            @if (info.location) {
              <div
                class="rounded-2xl border border-[var(--app-border)]
                       bg-[var(--app-surface-muted)] p-4"
              >
                <p
                  class="flex items-center gap-2 text-xs font-bold
                         uppercase tracking-wide
                         text-[var(--app-text-muted)]"
                >
                  <i
                    class="pi pi-map-marker text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  {{ 'home.location' | translate }}
                </p>

                <p class="mt-1.5 text-sm font-semibold">
                  {{ info.location }}
                </p>
              </div>
            }

            @if (info.availability) {
              <div
                class="rounded-2xl border border-[var(--app-border)]
                       bg-[var(--app-surface-muted)] p-4"
              >
                <p
                  class="flex items-center gap-2 text-xs font-bold
                         uppercase tracking-wide
                         text-[var(--app-text-muted)]"
                >
                  <i
                    class="pi pi-check-circle text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  {{ 'home.availability' | translate }}
                </p>

                <p class="mt-1.5 text-sm font-semibold">
                  {{ info.availability }}
                </p>
              </div>
            }

            @if (info.email) {
              <div
                class="rounded-2xl border border-[var(--app-border)]
                       bg-[var(--app-surface-muted)] p-4 sm:col-span-2"
              >
                <p
                  class="flex items-center gap-2 text-xs font-bold
                         uppercase tracking-wide
                         text-[var(--app-text-muted)]"
                >
                  <i
                    class="pi pi-envelope text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  {{ 'home.email' | translate }}
                </p>

                <a
                  [href]="'mailto:' + info.email"
                  class="mt-1.5 block break-all text-sm font-semibold
                         transition hover:text-[var(--p-primary-color)]"
                >
                  {{ info.email }}
                </a>
              </div>
            }
          </div>
        }

        <div class="mt-7 flex flex-wrap items-center gap-3">
          <a
            routerLink="/timeline"
            class="inline-flex min-h-11 items-center gap-2
                   rounded-xl border border-[var(--app-border)]
                   px-4 py-2.5 text-sm font-semibold transition
                   hover:border-[var(--p-primary-color)]
                   hover:text-[var(--p-primary-color)]"
          >
            {{ 'home.viewTimeline' | translate }}

            <i
              class="pi pi-arrow-right text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>

          <a
            routerLink="/"
            fragment="contact"
            class="inline-flex min-h-11 items-center gap-2
                   rounded-xl bg-[var(--p-primary-color)] px-4 py-2.5
                   text-sm font-semibold
                   text-[var(--p-primary-inverse-color)] transition
                   hover:bg-[var(--p-primary-hover-color)]"
          >
            {{ 'home.contactCta' | translate }}

            <i
              class="pi pi-send text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        </div>
      </div>

      <!-- Parcours avec filtres -->
      <div
        class="rounded-3xl border border-[var(--app-border)]
               bg-[var(--app-surface)] p-7 sm:p-9"
      >
        <div
          class="flex flex-col justify-between gap-4
                 sm:flex-row sm:items-start"
        >
          <div>
            <p
              class="text-xs font-bold uppercase tracking-[0.14em]
                     text-[var(--p-primary-color)]"
            >
              {{ 'nav.timeline' | translate }}
            </p>

            <h2
              class="mt-2 text-2xl font-bold tracking-[-0.035em]
                     sm:text-3xl"
            >
              {{ 'publicPages.timeline.title' | translate }}
            </h2>
          </div>

          <div
            class="inline-flex shrink-0 rounded-xl border
                   border-[var(--app-border)] bg-[var(--app-surface-muted)]
                   p-1"
            role="tablist"
            [attr.aria-label]="'publicPages.timeline.title' | translate"
          >
            <button
              type="button"
              role="tab"
              class="inline-flex items-center gap-2 rounded-lg px-3 py-2
                     text-xs font-semibold transition"
              [style.background]="
                activeType() === 'EXPERIENCE'
                  ? 'var(--app-surface)'
                  : null
              "
              [style.color]="
                activeType() === 'EXPERIENCE'
                  ? 'var(--p-primary-color)'
                  : null
              "
              [style.box-shadow]="
                activeType() === 'EXPERIENCE'
                  ? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  : null
              "
              [attr.aria-selected]="activeType() === 'EXPERIENCE'"
              (click)="activeType.set('EXPERIENCE')"
            >
              <i
                class="pi pi-briefcase text-[0.7rem]"
                aria-hidden="true"
              ></i>

              {{ 'publicPages.timeline.experience' | translate }}
            </button>

            <button
              type="button"
              role="tab"
              class="inline-flex items-center gap-2 rounded-lg px-3 py-2
                     text-xs font-semibold transition"
              [style.background]="
                activeType() === 'EDUCATION'
                  ? 'var(--app-surface)'
                  : null
              "
              [style.color]="
                activeType() === 'EDUCATION'
                  ? 'var(--p-primary-color)'
                  : null
              "
              [style.box-shadow]="
                activeType() === 'EDUCATION'
                  ? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  : null
              "
              [attr.aria-selected]="activeType() === 'EDUCATION'"
              (click)="activeType.set('EDUCATION')"
            >
              <i
                class="pi pi-graduation-cap text-[0.7rem]"
                aria-hidden="true"
              ></i>

              {{ 'publicPages.timeline.education' | translate }}
            </button>
          </div>
        </div>

        @if (loading()) {
          <div class="mt-7 space-y-4">
            @for (row of [1, 2, 3]; track row) {
              <div
                class="h-28 animate-pulse rounded-2xl
                       bg-[var(--app-surface-muted)]"
              ></div>
            }
          </div>
        } @else if (!visibleItems().length) {
          <div
            class="mt-7 rounded-2xl border border-dashed
                   border-[var(--app-border)] p-8 text-center"
          >
            <i
              class="pi pi-history text-3xl text-[var(--app-text-muted)]"
              aria-hidden="true"
            ></i>

            <p class="mt-3 text-sm text-[var(--app-text-muted)]">
              {{ 'publicPages.timeline.empty' | translate }}
            </p>
          </div>
        } @else {
          <ol
            class="mt-7 space-y-0 border-s border-[var(--app-border)]
                   ps-6"
          >
            @for (item of visibleItems(); track item.id) {
              <li class="relative pb-5 last:pb-0">
                <span
                  class="absolute -start-[1.9rem] top-1.5 grid h-3.5 w-3.5
                         place-items-center rounded-full border-2
                         border-[var(--app-surface)]
                         bg-[var(--p-primary-color)]"
                  aria-hidden="true"
                ></span>

                <article
                  class="rounded-2xl border border-[var(--app-border)]
                         bg-[var(--app-surface-muted)]/60 p-5
                         transition hover:border-[var(--p-primary-color)]/40"
                >
                  <p
                    class="text-[0.68rem] font-bold uppercase
                           tracking-[0.12em] text-[var(--p-primary-color)]"
                  >
                    {{ formatDate(item.startDate) }} —

                    @if (item.current) {
                      {{ 'publicPages.timeline.present' | translate }}
                    } @else {
                      {{ formatDate(item.endDate) }}
                    }
                  </p>

                  <h3 class="mt-1.5 text-base font-semibold">
                    {{ item.role }}
                  </h3>

                  <p
                    class="mt-0.5 text-sm font-medium
                           text-[var(--app-text-muted)]"
                  >
                    {{ item.organization }}
                  </p>

                  @if (item.description) {
                    <p
                      class="mt-2.5 text-sm leading-7
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
    </section>
  `
})
export class AboutTimelineSectionComponent {
  private readonly timelineService = inject(
    TimelineService
  );

  private readonly language = inject(LanguageService);

  readonly about = input<AboutPublic | null>(null);

  readonly items = signal<TimelinePublicItem[]>([]);
  readonly loading = signal(true);
  readonly activeType = signal<TimelineType>('EXPERIENCE');

  readonly visibleItems = computed(() =>
    this.items().filter(
      item => item.type === this.activeType()
    )
  );

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);

    this.timelineService.getPublicTimeline().subscribe({
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
