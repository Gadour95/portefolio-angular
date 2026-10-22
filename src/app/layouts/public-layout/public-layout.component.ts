import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  AppHeaderComponent
} from '../../shared/components/app-header/app-header.component';

import {
  AppFooterComponent
} from '../../shared/components/app-footer/app-footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AppHeaderComponent,
    AppFooterComponent
  ],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-header />

      <main id="main-content" class="flex-1">
        <router-outlet />
      </main>

      <app-footer />
    </div>
  `
})
export class PublicLayoutComponent {}