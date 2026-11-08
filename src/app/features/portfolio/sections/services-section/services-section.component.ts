import {
  Component,
  computed,
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
  ServiceOfferPublic
} from '../../../../core/models/service-offer.model';

import { LanguageService } from '../../../../core/services/language.service';
import {
  ServiceOfferService
} from '../../../../core/services/service-offer.service';

import {
  ScrollStripComponent
} from '../../../../shared/components/scroll-strip/scroll-strip.component';

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ScrollStripComponent
  ],

  template: `
    <section id="services" class="scroll-mt-32">
      <div
        class="flex flex-col justify-between gap-4
               sm:flex-row sm:items-end"
      >
        <div class="max-w-2xl">
          <p
            class="text-xs font-bold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'home.servicesEyebrow' | translate }}
          </p>

          <h2
            class="mt-2 text-2xl font-bold tracking-[-0.035em]
                   sm:text-3xl"
          >
            {{ 'home.servicesTitle' | translate }}
          </h2>

          <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
            {{ 'home.servicesText' | translate }}
          </p>
        </div>

        <a
          routerLink="/services"
          class="inline-flex shrink-0 items-center gap-2 text-sm
                 font-semibold text-[var(--p-primary-color)]
                 hover:underline"
        >
          {{ 'home.viewAllServices' | translate }}

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
              class="h-64 w-[18rem] shrink-0 animate-pulse rounded-3xl
                     bg-[var(--app-surface-muted)]"
            ></div>
          }
        </div>
      } @else if (!services().length) {
        <div
          class="mt-8 rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-briefcase text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'home.noServices' | translate }}
          </p>
        </div>
      } @else {
        <div class="mt-8">
          <app-scroll-strip>
            @for (service of featuredServices(); track service.id) {
              <article
                class="group relative flex w-[18rem] shrink-0 snap-start
                       flex-col overflow-hidden rounded-3xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]
                       p-6 transition hover:-translate-y-1
                       hover:border-[var(--p-primary-color)]
                       hover:shadow-[0_24px_60px_-38px_rgba(79,70,229,0.6)]
                       sm:w-[20rem]"
              >
                <div
                  class="pointer-events-none absolute -right-10 -top-10
                         h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl
                         transition group-hover:bg-indigo-500/20"
                  aria-hidden="true"
                ></div>

                @if (serviceImageUrl(service); as imageUrl) {
                  <img
                    [src]="imageUrl"
                    [alt]="service.name"
                    class="h-14 w-14 rounded-2xl border
                           border-[var(--app-border)] object-cover"
                    loading="lazy"
                  />
                } @else {
                  <span
                    class="inline-grid h-14 w-14 place-items-center
                           rounded-2xl bg-[var(--app-surface-muted)]
                           text-[var(--p-primary-color)]"
                  >
                    <i
                      class="pi pi-briefcase text-xl"
                      aria-hidden="true"
                    ></i>
                  </span>
                }

                <h3 class="mt-5 text-lg font-semibold">
                  {{ service.name }}
                </h3>

                <p
                  class="mt-2 line-clamp-4 flex-1 text-sm leading-7
                         text-[var(--app-text-muted)]"
                >
                  {{ service.description }}
                </p>

                <a
                  routerLink="/"
                  fragment="contact"
                  class="mt-5 inline-flex items-center gap-2 text-sm
                         font-semibold text-[var(--p-primary-color)]"
                >
                  {{ 'publicPages.services.cta' | translate }}

                  <i
                    class="pi pi-arrow-right text-xs rtl:rotate-180"
                    aria-hidden="true"
                  ></i>
                </a>
              </article>
            }
          </app-scroll-strip>
        </div>
      }
    </section>
  `
})
export class ServicesSectionComponent {
  private readonly serviceOfferService = inject(
    ServiceOfferService
  );

  private readonly language = inject(LanguageService);

  readonly services = signal<ServiceOfferPublic[]>([]);
  readonly loading = signal(true);

  readonly featuredServices = computed(() =>
    this.services().slice(0, 5)
  );

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);

    this.serviceOfferService
      .getPublicServices()
      .subscribe({
        next: services => {
          this.services.set(services);
          this.loading.set(false);
        },

        error: () => {
          this.services.set([]);
          this.loading.set(false);
        }
      });
  }

  serviceImageUrl(service: ServiceOfferPublic): string | null {
    return service.imageUrl ?? resolveMediaUrl(service.image);
  }
}
