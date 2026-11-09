import {
  Component,
  inject,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import {
  ServiceOfferPublic
} from '../../../../core/models/service-offer.model';

import {
  ServiceOfferService
} from '../../../../core/services/service-offer.service';

import {
  resolveMediaUrl
} from '../../../../core/http/media-url';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <div class="app-container space-y-10 py-10 sm:py-14">
      <header class="max-w-3xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'nav.services' | translate }}
        </p>

        <h1
          class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {{ 'publicPages.services.title' | translate }}
        </h1>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.services.subtitle' | translate }}
        </p>
      </header>

      @if (loading()) {
        <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          @for (item of [1, 2, 3, 4, 5, 6]; track item) {
            <div
              class="h-52 animate-pulse rounded-2xl
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
      } @else if (!services().length) {
        <div
          class="rounded-2xl border border-dashed
                 border-[var(--app-border)] bg-[var(--app-surface)]
                 p-10 text-center"
        >
          <i
            class="pi pi-briefcase text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <p class="mt-4 text-sm text-[var(--app-text-muted)]">
            {{ 'publicPages.services.empty' | translate }}
          </p>
        </div>
      } @else {
        <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          @for (service of services(); track service.id) {
            <article
              class="flex flex-col rounded-2xl border
                     border-[var(--app-border)] bg-[var(--app-surface)]
                     p-6 transition hover:-translate-y-0.5
                     hover:border-[var(--p-primary-color)]
                     hover:shadow-[0_18px_40px_-30px_rgba(79,70,229,0.6)]"
            >
              @if (serviceImageUrl(service); as imageUrl) {
                <span
                  class="relative inline-block h-12 w-12 overflow-hidden
                         rounded-xl border border-[var(--app-border)]
                         bg-[var(--app-surface-muted)]"
                >
                  <img
                    [src]="imageUrl"
                    alt=""
                    aria-hidden="true"
                    class="absolute inset-0 h-full w-full scale-125
                           object-cover opacity-60 blur-md"
                    loading="lazy"
                  />

                  <img
                    [src]="imageUrl"
                    [alt]="service.name"
                    class="relative z-10 h-full w-full object-contain"
                    loading="lazy"
                  />
                </span>
              } @else {
                <span
                  class="inline-grid h-12 w-12 place-items-center
                         rounded-xl bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-briefcase text-lg"
                    aria-hidden="true"
                  ></i>
                </span>
              }

              <h2 class="mt-5 text-lg font-semibold">
                {{ service.name }}
              </h2>

              <p
                class="mt-2 flex-1 text-sm leading-7
                       text-[var(--app-text-muted)]"
              >
                {{ service.description }}
              </p>
            </article>
          }
        </div>

        <section
          class="rounded-3xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-8 text-center sm:p-10"
        >
          <h2 class="text-xl font-bold">
            {{ 'publicPages.services.ctaTitle' | translate }}
          </h2>

          <p class="mx-auto mt-2 max-w-xl text-sm leading-7 app-muted">
            {{ 'publicPages.services.ctaText' | translate }}
          </p>

          <a
            routerLink="/"
            fragment="contact"
            class="mt-6 inline-flex min-h-11 items-center gap-2
                   rounded-xl bg-[var(--p-primary-color)] px-5 py-3
                   text-sm font-semibold
                   text-[var(--p-primary-inverse-color)]
                   transition hover:bg-[var(--p-primary-hover-color)]"
          >
            {{ 'publicPages.services.cta' | translate }}

            <i
              class="pi pi-arrow-right text-xs rtl:rotate-180"
              aria-hidden="true"
            ></i>
          </a>
        </section>
      }
    </div>
  `
})
export class ServicesComponent {
  private readonly serviceOfferService = inject(
    ServiceOfferService
  );

  readonly services = signal<ServiceOfferPublic[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

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
          this.error.set(true);
        }
      });
  }

  serviceImageUrl(service: ServiceOfferPublic): string | null {
    return service.imageUrl ?? resolveMediaUrl(service.image);
  }
}
