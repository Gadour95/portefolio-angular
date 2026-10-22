import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import {
  AppHeaderComponent
} from '../../shared/components/app-header/app-header.component';

import {
  AppFooterComponent
} from '../../shared/components/app-footer/app-footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    TranslatePipe,
    AppHeaderComponent,
    AppFooterComponent
  ],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-header />

      <div
        class="app-container grid flex-1 gap-6 py-6
               lg:grid-cols-[240px_minmax(0,1fr)]"
      >
        <aside class="app-panel h-fit">
          <p class="mb-4 text-sm font-semibold uppercase tracking-wide app-muted">
            {{ 'admin.title' | translate }}
          </p>

          <nav class="flex flex-col gap-2">
            <a
              routerLink="/admin-preview"
              class="app-nav-link active flex items-center gap-3"
            >
              <i class="pi pi-th-large" aria-hidden="true"></i>
              {{ 'nav.showcase' | translate }}
            </a>
          </nav>

          <p class="mt-6 text-sm leading-6 app-muted">
            {{ 'admin.previewNotice' | translate }}
          </p>
        </aside>

        <main id="main-content" class="min-w-0">
          <router-outlet />
        </main>
      </div>

      <app-footer />
    </div>
  `
})
export class AdminLayoutComponent {}