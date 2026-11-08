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
  Skill,
  SkillCategoryPublic
} from '../../../../core/models/skill.model';

import { LanguageService } from '../../../../core/services/language.service';
import { SkillService } from '../../../../core/services/skill.service';

import {
  ScrollStripComponent
} from '../../../../shared/components/scroll-strip/scroll-strip.component';

@Component({
  selector: 'app-skills-section',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ScrollStripComponent
  ],

  template: `
    <section id="skills" class="scroll-mt-32">
      <div
        class="flex flex-col justify-between gap-4
               sm:flex-row sm:items-end"
      >
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

        <a
          routerLink="/skills"
          class="inline-flex shrink-0 items-center gap-2 text-sm
                 font-semibold text-[var(--p-primary-color)]
                 hover:underline"
        >
          {{ 'home.viewAllSkills' | translate }}

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
              class="h-96 w-[21rem] shrink-0 animate-pulse rounded-3xl
                     bg-[var(--app-surface-muted)]"
            ></div>
          }
        </div>
      } @else if (!categories().length) {
        <div
          class="mt-8 rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-chart-line text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'home.noSkills' | translate }}
          </p>
        </div>
      } @else {
        <div class="mt-8">
          <app-scroll-strip>
            @for (category of categories(); track category.id) {
              <article
                class="group relative flex w-[20rem] shrink-0 snap-start
                       flex-col overflow-hidden rounded-3xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]
                       p-6 transition hover:-translate-y-1
                       hover:shadow-[0_24px_60px_-38px_rgba(79,70,229,0.6)]
                       sm:w-[22rem]"
              >
                <span
                  class="absolute inset-x-0 top-0 h-1.5"
                  [style.background]="
                    category.color || 'var(--p-primary-color)'
                  "
                  aria-hidden="true"
                ></span>

                <div class="flex items-center gap-3">
                  <span
                    class="grid h-12 w-12 shrink-0 place-items-center
                           overflow-hidden rounded-2xl border
                           border-[var(--app-border)]"
                    [style.background]="
                      (category.color || '#4f46e5') + '1a'
                    "
                  >
                    @if (categoryImage(category); as image) {
                      <img
                        [src]="image"
                        [alt]="category.name"
                        class="h-7 w-7 object-contain"
                        loading="lazy"
                      />
                    } @else {
                      <i
                        class="pi pi-chart-line text-lg"
                        [style.color]="
                          category.color || 'var(--p-primary-color)'
                        "
                        aria-hidden="true"
                      ></i>
                    }
                  </span>

                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-base font-semibold">
                      {{ category.name }}
                    </h3>

                    <p
                      class="mt-0.5 text-xs
                             text-[var(--app-text-muted)]"
                    >
                      {{ category.skills.length }}
                      {{ 'home.skillCountLabel' | translate }}
                    </p>
                  </div>
                </div>

                <ul class="mt-6 space-y-4">
                  @for (
                    skill of category.skills;
                    track skill.id
                  ) {
                    <li>
                      <div class="flex items-center gap-3">
                        <span
                          class="grid h-9 w-9 shrink-0 place-items-center
                                 overflow-hidden rounded-xl border
                                 border-[var(--app-border)]
                                 bg-[var(--app-surface-muted)]"
                        >
                          @if (skillImage(skill); as image) {
                            <img
                              [src]="image"
                              [alt]="skill.name"
                              class="h-5 w-5 object-contain"
                              loading="lazy"
                            />
                          } @else {
                            <span
                              class="text-xs font-bold"
                              [style.color]="
                                skill.color ||
                                category.color ||
                                'var(--p-primary-color)'
                              "
                            >
                              {{ skill.name.charAt(0) }}
                            </span>
                          }
                        </span>

                        <div class="min-w-0 flex-1">
                          <div
                            class="flex items-baseline justify-between
                                   gap-3 text-sm"
                          >
                            <span class="truncate font-medium">
                              {{ skill.name }}
                            </span>

                            <span
                              class="shrink-0 text-xs font-semibold
                                     text-[var(--app-text-muted)]"
                            >
                              {{ scorePercent(skill.score) }}%
                            </span>
                          </div>

                          <div
                            class="mt-1.5 h-1.5 overflow-hidden rounded-full
                                   bg-[var(--app-surface-muted)]"
                            role="progressbar"
                            [attr.aria-valuenow]="
                              scorePercent(skill.score)
                            "
                            aria-valuemin="0"
                            aria-valuemax="100"
                            [attr.aria-label]="skill.name"
                          >
                            <div
                              class="h-full rounded-full transition-all"
                              [style.width.%]="
                                scorePercent(skill.score)
                              "
                              [style.background]="
                                skill.color ||
                                category.color ||
                                'var(--p-primary-color)'
                              "
                            ></div>
                          </div>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              </article>
            }
          </app-scroll-strip>
        </div>
      }
    </section>
  `
})
export class SkillsSectionComponent {
  private readonly skillService = inject(SkillService);
  private readonly language = inject(LanguageService);

  readonly categories = signal<SkillCategoryPublic[]>([]);
  readonly loading = signal(true);

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);

    this.skillService.getPublicSkills().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.loading.set(false);
      },

      error: () => {
        this.categories.set([]);
        this.loading.set(false);
      }
    });
  }

  categoryImage(category: SkillCategoryPublic): string | null {
    return resolveMediaUrl(category.imageUrl);
  }

  skillImage(skill: Skill): string | null {
    return resolveMediaUrl(skill.technologyImageUrl);
  }

  scorePercent(score: number): number {
    const value = score > 0 && score <= 10
      ? score * 10
      : score;

    return Math.min(100, Math.max(0, Math.round(value)));
  }
}
