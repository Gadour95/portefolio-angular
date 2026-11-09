import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RouterLink } from '@angular/router';

import { catchError, of } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';

import {
  resolveMediaUrl
} from '../../../../core/http/media-url';

import {
  AppLang
} from '../../../../core/models/common.model';

import {
  CvPublic
} from '../../../../core/models/cv.model';

import {
  Technology
} from '../../../../core/models/technology.model';

import {
  CvService
} from '../../../../core/services/cv.service';

import {
  LanguageService
} from '../../../../core/services/language.service';

import {
  TechnologyService
} from '../../../../core/services/technology.service';

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
      <!-- Décoration -->
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
        <!-- Présentation statique traduite -->
        <div class="min-w-0">
          <span
            class="inline-flex items-center gap-2 rounded-full border
                   border-[var(--p-primary-color)]/25
                   bg-[var(--p-primary-color)]/10 px-3.5 py-2
                   text-xs font-semibold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            <i
              class="pi pi-code text-sm"
              aria-hidden="true"
            ></i>

            {{ 'hero.role' | translate }}
          </span>

          <h1
            class="mt-6 max-w-4xl text-balance text-4xl font-bold
                   leading-[1.05] tracking-[-0.055em] sm:text-5xl
                   lg:text-[3.75rem]"
          >
            {{ 'hero.firstName' | translate }}

            <span class="text-[var(--p-primary-color)]">
              {{ 'hero.lastName' | translate }}
            </span>
          </h1>

          <p
            class="mt-6 max-w-2xl text-base leading-8
                   text-[var(--app-text-muted)] sm:text-lg"
          >
            {{ 'hero.description' | translate }}
          </p>

          <!-- Actions -->
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
              [attr.href]="cvDownloadUrl()"
              [attr.aria-disabled]="cvDownloadUrl() ? null : 'true'"
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

          <!-- Technologies : icônes uniquement -->
          @if (loading() || technologies().length) {
            <div
              class="mt-9 border-t border-[var(--app-border)] pt-6"
              [attr.aria-busy]="loading()"
            >
              @if (loading()) {
                <div
                  class="flex flex-wrap gap-3"
                  aria-hidden="true"
                >
                  @for (item of [1, 2, 3, 4, 5, 6]; track item) {
                    <div
                      class="h-14 w-14 animate-pulse rounded-2xl
                             bg-[var(--app-surface-muted)]"
                    ></div>
                  }
                </div>
              } @else {
                <div class="flex flex-wrap gap-3">
                  @for (
                    technology of technologies();
                    track technology.id
                  ) {
                    <div
                      tabindex="0"
                      class="group relative inline-grid h-14 w-14
                             shrink-0 place-items-center rounded-2xl
                             border border-white/60 bg-white/60
                             shadow-sm backdrop-blur-md transition
                             hover:-translate-y-1
                             hover:border-[var(--p-primary-color)]
                             hover:shadow-[0_14px_28px_-16px_rgba(79,70,229,0.6)]
                             focus-visible:-translate-y-1
                             focus-visible:outline
                             focus-visible:outline-2
                             focus-visible:outline-offset-2
                             focus-visible:outline-[var(--p-primary-color)]
                             dark:border-white/10
                             dark:bg-white/[0.05]"
                      [attr.aria-label]="technology.name"
                    >
                      @if (technologyImage(technology); as image) {
                        <img
                          [src]="image"
                          alt=""
                          class="h-8 w-8 object-contain"
                          loading="lazy"
                        />
                      } @else {
                        <span
                          aria-hidden="true"
                          class="text-lg font-bold"
                          [style.color]="
                            technology.color ||
                            'var(--p-primary-color)'
                          "
                        >
                          {{ technology.name.charAt(0) }}
                        </span>
                      }

                      <!-- Nom au survol et au focus clavier -->
                      <span
                        aria-hidden="true"
                        class="pointer-events-none absolute bottom-full
                               start-1/2 z-20 mb-2
                               -translate-x-1/2 whitespace-nowrap
                               rounded-lg bg-[var(--app-text)]
                               px-2.5 py-1.5 text-xs font-semibold
                               text-[var(--app-surface)] opacity-0
                               shadow-lg transition
                               group-hover:opacity-100
                               group-focus-visible:opacity-100
                               rtl:translate-x-1/2"
                      >
                        {{ technology.name }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Carte profil statique traduite -->
        <div class="relative mx-auto w-full max-w-md lg:mx-0">
          <div
            class="absolute -inset-4 rounded-[2rem] bg-gradient-to-br
                   from-indigo-500/20 via-blue-500/10 to-transparent
                   blur-2xl"
            aria-hidden="true"
          ></div>

          <div
            class="relative overflow-hidden rounded-3xl border
                   border-white/60 bg-white/70
                   shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]
                   backdrop-blur-xl dark:border-white/10
                   dark:bg-white/[0.06]"
          >
            <!-- En-tête de la carte -->
            <div
              class="flex items-center gap-2 border-b
                     border-[var(--app-border)] px-5 py-3.5"
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
                class="ms-2 font-mono text-xs
                       text-[var(--app-text-muted)]"
              >
                profile.ts
              </span>
            </div>

            <!-- Contenu de la carte -->
            <div
              dir="ltr"
              class="space-y-2 break-words p-5 text-left font-mono
                     text-[0.78rem] leading-7 sm:p-6"
            >
              <p>
                <span class="text-fuchsia-500">const</span>
                <span class="text-sky-500"> profile</span>
                <span class="text-[var(--app-text-muted)]">
                  = {{ '{' }}
                </span>
              </p>

              <p class="ps-4">
                <span class="text-emerald-600 dark:text-emerald-400">
                  name
                </span>
                <span class="text-[var(--app-text-muted)]">: </span>
                <span class="text-amber-600 dark:text-amber-400">
                  '<bdi>{{ 'hero.firstName' | translate }} {{ 'hero.lastName' | translate }}</bdi>'
                </span>
                <span class="text-[var(--app-text-muted)]">,</span>
              </p>

              @for (field of profileFields; track field.key) {
                <p class="ps-4">
                  <span class="text-emerald-600 dark:text-emerald-400">
                    {{ field.key }}
                  </span>
                  <span class="text-[var(--app-text-muted)]">: </span>
                  <span class="text-amber-600 dark:text-amber-400">
                    '<bdi>{{ field.translationKey | translate }}</bdi>'
                  </span>
                  <span class="text-[var(--app-text-muted)]">,</span>
                </p>
              }

              <p class="text-[var(--app-text-muted)]">
                {{ '}' }};
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {
  private readonly technologyService = inject(TechnologyService);
  private readonly cvService = inject(CvService);
  private readonly language = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly technologyItems = signal<Technology[]>([]);
  private readonly cvItems = signal<CvPublic[]>([]);

  readonly loading = signal(true);

  readonly technologies = computed(() =>
    [...this.technologyItems()].sort(
      (a, b) => a.position - b.position
    )
  );

  readonly cvDownloadUrl = computed(() => {
    const cvs = this.cvItems();

    if (!cvs.length) {
      return null;
    }

    const preferred: AppLang[] = [
      this.language.current(),
      'fr',
      'en',
      'ar'
    ];

    for (const code of preferred) {
      if (cvs.some(cv => cv.locale === code)) {
        return this.cvService.downloadUrl(code);
      }
    }

    return null;
  });

  readonly profileFields = [
    {
      key: 'role',
      translationKey: 'hero.role'
    },
    {
      key: 'focus',
      translationKey: 'hero.focus'
    }
  ] as const;

  constructor() {
    effect(onCleanup => {
      this.language.current();

      const subscription = untracked(() => {
        this.loading.set(true);

        return this.technologyService
          .getPublicTechnologies()
          .subscribe({
            next: technologies => {
              this.technologyItems.set(technologies);
              this.loading.set(false);
            },

            error: () => {
              this.technologyItems.set([]);
              this.loading.set(false);
            }
          });
      });

      onCleanup(() => subscription.unsubscribe());
    });

    this.cvService.getPublicCvs().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => of([] as CvPublic[]))
    ).subscribe(cvs => this.cvItems.set(cvs));
  }

  technologyImage(technology: Technology): string | null {
    return resolveMediaUrl(technology.imageUrl);
  }
}