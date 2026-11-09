import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <footer
      class="border-t border-[var(--app-border)]
             bg-[var(--app-surface)]"
    >
      <div
        class="app-container flex flex-col items-center
               justify-between gap-5 py-7 sm:flex-row"
      >
        <!-- Logo -->
        <a
          routerLink="/"
          fragment="home"
          class="footer-logo"
        >
          <span class="logo-icon" aria-hidden="true">
            <i class="pi pi-code text-lg"></i>
          </span>

          <span class="text-base font-bold tracking-tight">
            Abdelkader
            <span class="text-[var(--p-primary-color)]">
              SNIHA
            </span>
          </span>
        </a>

        <!-- Copyright traduit -->
        <p
          class="text-center text-xs leading-6
                 text-[var(--app-text-muted)] sm:text-sm"
        >
          {{ 'footer.copyright' | translate }}
        </p>
      </div>
    </footer>
  `,

  styles: `
    :host {
      display: block;
    }

    .footer-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      border-radius: 0.75rem;
      color: var(--app-text);
      text-decoration: none;
    }

    .logo-icon {
      display: inline-grid;
      width: 2.5rem;
      height: 2.5rem;
      flex-shrink: 0;
      place-items: center;
      border: 1px solid var(--app-border);
      border-radius: 0.875rem;
      background: var(--app-surface-muted);
      color: var(--p-primary-color);
      transition:
        border-color 180ms ease,
        transform 180ms ease;
    }

    .footer-logo:hover .logo-icon {
      border-color: var(--p-primary-color);
      transform: translateY(-2px);
    }

    .footer-logo:focus-visible {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 5px;
    }

    @media (prefers-reduced-motion: reduce) {
      .logo-icon {
        transition: none;
      }

      .footer-logo:hover .logo-icon {
        transform: none;
      }
    }
  `
})
export class AppFooterComponent {}