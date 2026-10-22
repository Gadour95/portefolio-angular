import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';

import {
  environment
} from '../../../environments/environment';

@Component({
  selector: 'app-api-check',
  standalone: true,
  imports: [JsonPipe],

  template: `
    <section class="app-container py-8">
      <div class="app-panel space-y-4">
        <p>
          Diagnostic temporaire — requête GET /api/cart
        </p>

        <button
          type="button"
          class="app-control"
          [disabled]="loading()"
          (click)="check()"
        >
          Tester le panier
        </button>

        <pre class="overflow-auto text-sm">{{ result() | json }}</pre>
      </div>
    </section>
  `
})
export class ApiCheckComponent {
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly result = signal<unknown>(null);

  check(): void {
    this.loading.set(true);

    this.http.get(`${environment.apiUrl}/api/cart`)
      .subscribe({
        next: response => {
          this.result.set(response);
          this.loading.set(false);
        },

        error: error => {
          this.result.set({
            status: error.status,
            message: error.error?.message ?? error.message
          });

          this.loading.set(false);
        }
      });
  }
}