import {
  Component,
  inject,
  signal
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import {
  SkillCategoryPublic
} from '../../../../core/models/skill.model';

import { SkillService } from '../../../../core/services/skill.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <div class="app-container space-y-10 py-10 sm:py-14">
      <header class="max-w-3xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'nav.skills' | translate }}
        </p>

        <h1
          class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {{ 'publicPages.skills.title' | translate }}
        </h1>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.skills.subtitle' | translate }}
        </p>
      </header>

      @if (loading()) {
        <div class="grid gap-6 lg:grid-cols-2">
          @for (item of [1, 2, 3, 4]; track item) {
            <div
              class="h-56 animate-pulse rounded-2xl
                     bg-[var(--app-surface-muted)]"
            ></div>
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
      } @else if (!categories().length) {
        <div
          class="rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-chart-line text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'publicPages.skills.empty' | translate }}
          </p>
        </div>
      } @else {
        <div class="grid gap-6 lg:grid-cols-2">
          @for (category of categories(); track category.id) {
            <section
              class="rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] p-6 sm:p-8"
            >
              <div class="flex items-center gap-3">
                <span
                  class="inline-grid h-11 w-11 place-items-center
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

                <h2 class="text-lg font-bold">
                  {{ category.name }}
                </h2>
              </div>

              @if (category.skills.length) {
                <ul class="mt-6 space-y-5">
                  @for (skill of category.skills; track skill.id) {
                    <li>
                      <div
                        class="flex items-center justify-between gap-4
                               text-sm"
                      >
                        <span class="font-medium">
                          {{ skill.name }}
                        </span>

                        <span
                          class="text-xs font-semibold
                                 text-[var(--app-text-muted)]"
                        >
                          {{ scorePercent(skill.score) }}%
                        </span>
                      </div>

                      <div
                        class="mt-2 h-2 overflow-hidden rounded-full
                               bg-[var(--app-surface-muted)]"
                        role="progressbar"
                        [attr.aria-valuenow]="scorePercent(skill.score)"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        [attr.aria-label]="skill.name"
                      >
                        <div
                          class="h-full rounded-full transition-all"
                          [style.width.%]="scorePercent(skill.score)"
                          [style.background]="
                            skill.color ||
                            category.color ||
                            'var(--p-primary-color)'
                          "
                        ></div>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-5 text-sm text-[var(--app-text-muted)]">
                  {{ 'common.empty' | translate }}
                </p>
              }
            </section>
          }
        </div>
      }
    </div>
  `
})
export class SkillsComponent {
  private readonly skillService = inject(SkillService);

  readonly categories = signal<SkillCategoryPublic[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.skillService.getPublicSkills().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.loading.set(false);
      },

      error: () => {
        this.categories.set([]);
        this.loading.set(false);
        this.error.set(true);
      }
    });
  }

  scorePercent(score: number): number {
    const value = score > 0 && score <= 10
      ? score * 10
      : score;

    return Math.min(100, Math.max(0, Math.round(value)));
  }
}
