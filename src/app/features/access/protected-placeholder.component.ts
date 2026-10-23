import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-protected-placeholder',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <section class="app-container py-8">
      <div class="app-panel">
        <div class="flex items-center gap-3">
          <i
            class="pi pi-shield text-2xl text-primary"
            aria-hidden="true"
          ></i>

          <h1 class="text-2xl font-bold">
            {{ titleKey | translate }}
          </h1>
        </div>

        <p class="mt-4 leading-7 app-muted">
          {{ 'auth.protectedPlaceholder' | translate }}
        </p>
      </div>
    </section>
  `
})
export class ProtectedPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey =
    this.route.snapshot.data['titleKey'] as string;
}