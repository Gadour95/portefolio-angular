import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <section class="app-container py-16">
      <div class="app-panel mx-auto max-w-xl text-center">
        <i
          class="pi pi-lock mb-5 text-5xl text-primary"
          aria-hidden="true"
        ></i>

        <h1 class="text-2xl font-bold">
          {{ 'auth.forbiddenTitle' | translate }}
        </h1>

        <p class="mt-4 leading-7 app-muted">
          {{ 'auth.forbiddenText' | translate }}
        </p>

        <a
          routerLink="/"
          class="mt-6 inline-flex rounded-xl bg-primary
                 px-5 py-3 font-semibold text-primary-contrast"
        >
          {{ 'auth.backHome' | translate }}
        </a>
      </div>
    </section>
  `
})
export class ForbiddenComponent {}