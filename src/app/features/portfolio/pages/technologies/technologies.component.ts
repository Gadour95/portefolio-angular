import {
  Component,
  inject,
  signal
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { resolveMediaUrl } from '../../../../core/http/media-url';

import {
  Technology
} from '../../../../core/models/technology.model';

import {
  TechnologyService
} from '../../../../core/services/technology.service';

@Component({
  selector: 'app-technologies',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <div class="app-container space-y-10 py-10 sm:py-14">
      <header class="max-w-3xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'nav.technologies' | translate }}
        </p>

        <h1
          class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {{ 'publicPages.technologies.title' | translate }}
        </h1>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.technologies.subtitle' | translate }}
        </p>
      </header>

      @if (loading()) {
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
            <div
              class="h-40 animate-pulse rounded-2xl
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
      } @else if (!technologies().length) {
        <div
          class="rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-desktop text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'publicPages.technologies.empty' | translate }}
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          @for (technology of technologies(); track technology.id) {
            <article
              class="group flex flex-col items-center justify-center
                     rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] p-6 text-center
                     transition hover:-translate-y-0.5
                     hover:border-[var(--p-primary-color)]
                     hover:shadow-[0_18px_40px_-30px_rgba(79,70,229,0.6)]"
            >
              <div
                class="flex h-16 w-16 items-center justify-center
                       overflow-hidden rounded-2xl
                       bg-[var(--app-surface-muted)]"
                [style.box-shadow]="
                  technology.color
                    ? 'inset 0 0 0 2px ' + technology.color
                    : null
                "
              >
                @if (technologyImage(technology); as image) {
                  <img
                    [src]="image"
                    [alt]="technology.name"
                    class="h-10 w-10 object-contain"
                    loading="lazy"
                  />
                } @else {
                  <span
                    class="text-xl font-bold"
                    [style.color]="
                      technology.color ||
                      'var(--p-primary-color)'
                    "
                  >
                    {{ technology.name.charAt(0) }}
                  </span>
                }
              </div>

              <h2 class="mt-4 text-sm font-semibold">
                {{ technology.name }}
              </h2>
            </article>
          }
        </div>
      }
    </div>
  `
})
export class TechnologiesComponent {
  private readonly technologyService = inject(
    TechnologyService
  );

  readonly technologies = signal<Technology[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

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
          this.error.set(true);
        }
      });
  }

  technologyImage(technology: Technology): string | null {
    return resolveMediaUrl(technology.imageUrl);
  }
}
