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
import { Technology } from '../../../../core/models/technology.model';
import { LanguageService } from '../../../../core/services/language.service';
import { TechnologyService } from '../../../../core/services/technology.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <section
      class="relative overflow-hidden rounded-[2rem] border
             border-[var(--app-border)] bg-[var(--app-surface)]
             px-6 py-12 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]
             sm:px-10 sm:py-16 lg:px-16"
    >
      <div
        class="pointer-events-none absolute -right-32 -top-32 h-96 w-96
               rounded-full bg-indigo-500/15 blur-3xl"
        aria-hidden="true"
      ></div>

      <div
        class="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96
               rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden="true"
      ></div>

      <div
        class="pointer-events-none absolute inset-0 opacity-[0.35]
               [background-image:linear-gradient(to_right,var(--app-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--app-border)_1px,transparent_1px)]
               [background-size:48px_48px]
               [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        aria-hidden="true"
      ></div>

      <div
        class="relative grid items-center gap-12
               lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]"
      >
        <div>
          <span
            class="inline-flex items-center gap-2 rounded-full border
                   border-[var(--p-primary-color)]/25
                   bg-[var(--p-primary-color)]/10 px-3.5 py-2
                   text-xs font-semibold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            <span class="relative flex h-2 w-2" aria-hidden="true">
              <span
                class="absolute inline-flex h-full w-full animate-ping
                       rounded-full bg-[var(--p-primary-color)] opacity-60"
              ></span>

              <span
                class="relative inline-flex h-2 w-2 rounded-full
                       bg-[var(--p-primary-color)]"
              ></span>
            </span>

            {{ 'portfolio.heroEyebrow' | translate }}
          </span>

          <h1
            class="mt-6 max-w-4xl text-balance text-4xl font-bold
                   leading-[1.05] tracking-[-0.055em] sm:text-5xl
                   lg:text-[3.75rem]"
          >
            {{ 'portfolio.heroTitle' | translate }}
          </h1>

          <p
            class="mt-6 max-w-2xl text-base leading-8
                   text-[var(--app-text-muted)] sm:text-lg"
          >
            {{
              about()?.description ||
                ('portfolio.heroText' | translate)
            }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <a
              routerLink="/"
              fragment="contact"
              class="inline-flex min-h-12 items-center justify-center
                     gap-2 rounded-xl bg-[var(--p-primary-color)] px-6
                     py-3 text-sm font-semibold
                     text-[var(--p-primary-inverse-color)]
                     shadow-[0_14px_30px_-18px_rgba(79,70,229,0.9)]
                     transition hover:bg-[var(--p-primary-hover-color)]"
            >
              {{ 'portfolio.contactMe' | translate }}

              <i
                class="pi pi-send text-xs rtl:rotate-180"
                aria-hidden="true"
              ></i>
            </a>

            <a
              routerLink="/cv"
              [queryParams]="{ download: 1 }"
              class="inline-flex min-h-12 items-center justify-center
                     gap-2 rounded-xl border border-[var(--app-border)]
                     bg-[var(--app-surface)] px-6 py-3 text-sm
                     font-semibold transition
                     hover:border-[var(--p-primary-color)]
                     hover:text-[var(--p-primary-color)]"
            >
              <i
                class="pi pi-download text-xs"
                aria-hidden="true"
              ></i>

              {{ 'home.downloadCv' | translate }}
            </a>
          </div>

          @if (about(); as info) {
            <div
              class="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3
                     border-t border-[var(--app-border)] pt-6 text-sm"
            >
              @if (info.availability) {
                <span class="inline-flex items-center gap-2 font-medium">
                  <span
                    class="inline-grid h-7 w-7 place-items-center rounded-lg
                           bg-emerald-500/10 text-emerald-600
                           dark:text-emerald-400"
                  >
                    <i
                      class="pi pi-check-circle text-xs"
                      aria-hidden="true"
                    ></i>
                  </span>

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
                  class="inline-flex min-w-0 items-center gap-2
                         transition hover:text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-envelope text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  ></i>

                  <span class="truncate">{{ info.email }}</span>
                </a>
              }
            </div>
          }
        </div>

        <!-- Carte profil / code -->
        <div class="relative mx-auto w-full max-w-md lg:mx-0">
          <div
            class="absolute -inset-4 rounded-[2rem] bg-gradient-to-br
                   from-indigo-500/20 via-blue-500/10 to-transparent
                   blur-2xl"
            aria-hidden="true"
          ></div>

          <div
            class="relative overflow-hidden rounded-3xl border
                   border-white/60 bg-white/70 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]
                   backdrop-blur-xl dark:border-white/10
                   dark:bg-white/[0.06]"
          >
            <div
              class="flex items-center gap-2 border-b border-[var(--app-border)]
                     px-5 py-3.5"
            >
              <span
                class="h-2.5 w-2.5 rounded-full bg-red-400"
                aria-hidden="true"
              ></span>

              <span
                class="h-2.5 w-2.5 rounded-full bg-amber-400"
                aria-hidden="true"
              ></span>

              <span
                class="h-2.5 w-2.5 rounded-full bg-emerald-400"
                aria-hidden="true"
              ></span>

              <span
                class="ms-2 font-mono text-xs text-[var(--app-text-muted)]"
              >
                profile.ts
              </span>
            </div>

            <div class="space-y-1 p-5 font-mono text-[0.78rem] leading-7">
              <p class="text-[var(--app-text-muted)]">
                <span class="text-fuchsia-500">const</span>
                <span class="text-sky-500"> profile</span>
                <span class="text-[var(--app-text-muted)]"> = {{ '{' }}</span>
              </p>

              <p class="ps-4">
                <span class="text-emerald-600 dark:text-emerald-400">
                  role
                </span>
                <span class="text-[var(--app-text-muted)]">: </span>
                <span class="text-amber-600 dark:text-amber-400">
                  '{{ 'app.tagline' | translate }}'
                </span>
                <span class="text-[var(--app-text-muted)]">,</span>
              </p>

              <p class="ps-4">
                <span class="text-emerald-600 dark:text-emerald-400">
                  location
                </span>
                <span class="text-[var(--app-text-muted)]">: </span>
                <span class="text-amber-600 dark:text-amber-400">
                  '{{ about()?.location || '—' }}'
                </span>
                <span class="text-[var(--app-text-muted)]">,</span>
              </p>

              <p class="ps-4">
                <span class="text-emerald-600 dark:text-emerald-400">
                  availability
                </span>
                <span class="text-[var(--app-text-muted)]">: </span>
                <span class="text-amber-600 dark:text-amber-400">
                  '{{ about()?.availability || '—' }}'
                </span>
                <span class="text-[var(--app-text-muted)]">,</span>
              </p>

              <p class="ps-4">
                <span class="text-emerald-600 dark:text-emerald-400">
                  email
                </span>
                <span class="text-[var(--app-text-muted)]">: </span>

                @if (about()?.email; as email) {
                  <a
                    [href]="'mailto:' + email"
                    class="break-all text-sky-600 hover:underline
                           dark:text-sky-400"
                  >
                    '{{ email }}'
                  </a>
                } @else {
                  <span class="text-amber-600 dark:text-amber-400">
                    '—'
                  </span>
                }
              </p>

              <p class="text-[var(--app-text-muted)]">{{ '}' }};</p>
            </div>

            <div class="border-t border-[var(--app-border)] p-5">
              @if (stack().length) {
                <p
                  class="text-[0.65rem] font-bold uppercase tracking-[0.16em]
                         text-[var(--app-text-muted)]"
                >
                  {{ 'home.stackLabel' | translate }}
                </p>

                <div class="mt-3 flex flex-wrap gap-1.5">
                  @for (technology of stack(); track technology.id) {
                    <span
                      class="rounded-lg border border-[var(--app-border)]
                             bg-[var(--app-surface)]/70 px-2.5 py-1
                             font-mono text-[0.68rem] font-medium"
                    >
                      {{ technology.name }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          @if (about()?.availability) {
            <span
              class="absolute -bottom-4 start-6 inline-flex items-center
                     gap-2 rounded-full border border-emerald-300/60
                     bg-emerald-50 px-3.5 py-2 text-xs font-semibold
                     text-emerald-700 shadow-lg dark:border-emerald-700/50
                     dark:bg-emerald-950/80 dark:text-emerald-300"
            >
              <span
                class="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              ></span>

              {{ about()?.availability }}
            </span>
          }
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {
  readonly about = input<AboutPublic | null>(null);

  private readonly technologyService = inject(TechnologyService);
  private readonly language = inject(LanguageService);

  readonly technologies = signal<Technology[]>([]);

  readonly stack = computed(() =>
    [...this.technologies()]
      .sort((a, b) => a.position - b.position)
      .slice(0, 5)
  );

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.loadTechnologies());
    });
  }

  private loadTechnologies(): void {
    this.technologyService
      .getPublicTechnologies()
      .subscribe({
        next: technologies => this.technologies.set(technologies),
        error: () => this.technologies.set([])
      });
  }
}
