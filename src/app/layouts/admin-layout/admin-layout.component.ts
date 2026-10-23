import {
  Component,
  computed,
  inject
} from '@angular/core';

import { RouterOutlet } from '@angular/router';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';

import {
  LanguageService
} from '../../core/services/language.service';

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
    RouterOutlet,
    TranslatePipe,
    ButtonModule,
    DrawerModule,
    MenuModule,
    AppHeaderComponent,
    AppFooterComponent
  ],

  template: `
    <div class="flex min-h-screen flex-col">
      <app-header />

      <div class="app-container py-4 lg:hidden">
        <p-button
          icon="pi pi-bars"
          severity="secondary"
          [outlined]="true"
          [label]="'adminNav.navigation' | translate"
          (onClick)="drawerVisible = true"
        />
      </div>

      <div
        class="app-container grid flex-1 gap-6 py-6
               lg:grid-cols-[250px_minmax(0,1fr)]"
      >
        <aside
          class="hidden h-fit rounded-2xl border
                 border-[var(--app-border)]
                 bg-[var(--app-surface)] p-3 lg:block"
        >
          <p class="px-3 pb-3 pt-2 text-sm font-semibold app-muted">
            {{ 'adminNav.title' | translate }}
          </p>

          <p-menu
            [model]="menuItems()"
            styleClass="w-full border-0 bg-transparent"
          />
        </aside>

        <main id="main-content" class="min-w-0">
          <router-outlet />
        </main>
      </div>

      <app-footer />
    </div>

    <p-drawer
      [(visible)]="drawerVisible"
      [position]="drawerPosition()"
      [header]="'adminNav.title' | translate"
    >
      <p-menu
        [model]="menuItems()"
        styleClass="w-full border-0 bg-transparent"
      />
    </p-drawer>
  `
})
export class AdminLayoutComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  drawerVisible = false;

  readonly drawerPosition = computed<'left' | 'right'>(() =>
    this.language.current() === 'ar' ? 'right' : 'left'
  );

  readonly menuItems = computed<MenuItem[]>(() => {
    this.language.current();

    return [
      {
        label: this.translate.instant('adminNav.dashboard'),
        icon: 'pi pi-chart-bar',
        routerLink: '/admin/dashboard',
        command: () => {
          this.drawerVisible = false;
        }
      },

      {
        label: this.translate.instant('adminNav.catalog'),

        items: [
          {
            label: this.translate.instant(
              'adminNav.categories'
            ),
            icon: 'pi pi-folder',
            routerLink: '/admin/categories',

            command: () => {
              this.drawerVisible = false;
            }
          },

          {
            label: this.translate.instant(
              'adminNav.subCategories'
            ),
            icon: 'pi pi-sitemap',
            routerLink: '/admin/sub-categories',

            command: () => {
              this.drawerVisible = false;
            }
          },

          {
            label: this.translate.instant(
              'adminNav.products'
            ),
            icon: 'pi pi-box',
            routerLink: '/admin/products',

            command: () => {
              this.drawerVisible = false;
            }
          },
          {
            label: this.translate.instant(
              'adminOrders.title'
            ),

            icon: 'pi pi-shopping-bag',

            routerLink: '/admin/orders',

            command: () => {
              this.drawerVisible = false;
            }
          }

        ]
      }
    ];
  });
}