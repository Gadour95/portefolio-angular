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
  Technology
} from '../../../../core/models/technology.model';

import {
  TechnologyService
} from '../../../../core/services/technology.service';

import {
  LanguageService
} from '../../../../core/services/language.service';

@Component({
  selector: 'app-technologies-section',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <section
      id="technologies"
      class="scroll-mt-32 rounded-3xl border
             border-[var(--app-border)] bg-[var(--app-surface)]/70
             p-6 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.55)]
             backdrop-blur-xl sm:p-8"
    >
      <div
        class="flex flex-col gap-6
               lg:flex-row lg:items-center lg:gap-10"
      >
        <div class="shrink-0 lg:max-w-xs">
          <p
            class="text-xs font-bold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'publicPages.technologies.title' | translate }}
          </p>

          <p
            class="mt-2 text-sm leading-6
                   text-[var(--app-text-muted)]"
          >
            {{ 'publicPages.technologies.subtitle' | translate }}
          </p>

          <a
            routerLink="/technologies"
            class="mt-3 inline-flex items-center gap-2 text-sm
                   font-semibold text-[var(--p-primary-color)]
                   hover:underline"
          >
            {{ 'home.viewAllTechnologies' | translate }}

            <i
              class="pi pi-arrow-right text-[0.65rem] rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        </div>

        <div class="min-w-0 flex-1">
          @if (loading()) {
            <div class="flex flex-wrap gap-3">
              @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
                <div
                  class="h-14 w-14 animate-pulse rounded-2xl
                         bg-[var(--app-surface-muted)]"
                ></div>
              }
            </div>
          } @else if (technologies().length) {
            <div class="flex flex-wrap gap-3">
              @for (
                technology of technologies();
                track technology.id
              ) {
                <div
                  class="group relative inline-grid h-14 w-14 shrink-0
                         place-items-center rounded-2xl border
                         border-white/60 bg-white/60 shadow-sm
                         backdrop-blur-md transition
                         hover:-translate-y-1 hover:border-[var(--p-primary-color)]
                         hover:shadow-[0_14px_28px_-16px_rgba(79,70,229,0.6)]
                         dark:border-white/10 dark:bg-white/[0.05]"
                  [attr.title]="technology.name"
                  [attr.aria-label]="technology.name"
                >
                  @if (technologyImage(technology); as image) {
                    <img
                      [src]="image"
                      [alt]="technology.name"
                      class="h-8 w-8 object-contain"
                      loading="lazy"
                    />
                  } @else {
                    <span
                      class="text-lg font-bold"
                      [style.color]="
                        technology.color ||
                        'var(--p-primary-color)'
                      "
                    >
                      {{ technology.name.charAt(0) }}
                    </span>
                  }

                  <span
                    class="pointer-events-none absolute -top-10 start-1/2 z-20
                           -translate-x-1/2 whitespace-nowrap rounded-lg
                           bg-[var(--app-text)] px-2.5 py-1.5 text-xs
                           font-semibold text-[var(--app-surface)] opacity-0
                           shadow-lg transition group-hover:opacity-100
                           rtl:translate-x-1/2"
                  >
                    {{ technology.name }}
                  </span>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-[var(--app-text-muted)]">
              {{ 'publicPages.technologies.empty' | translate }}
            </p>
          }
        </div>
      </div>
    </section>
  `
})
export class TechnologiesSectionComponent {
  private readonly technologyService = inject(
    TechnologyService
  );

  private readonly language = inject(LanguageService);

  readonly technologies = signal<Technology[]>([]);
  readonly loading = signal(true);

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);

    this.technologyService
      .getPublicTechnologies()
      .subscribe({
        next: technologies => {
          this.technologies.set(technologies);
          this.loading.set(false);
        },

        error: () => {
          this.technologies.set([]);
          this.loading.set(false);
        }
      });
  }

  technologyImage(technology: Technology): string | null {
    return resolveMediaUrl(technology.imageUrl);
  }
}
