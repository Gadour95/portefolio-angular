import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  NgTemplateOutlet
} from '@angular/common';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

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
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
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
          type="button"
          icon="pi pi-bars"
          severity="secondary"
          [outlined]="true"
          [label]="'adminNav.navigation' | translate"
          (onClick)="drawerVisible = true"
        />
      </div>

      <div
        class="app-container grid flex-1 items-start gap-6 py-6
               lg:grid-cols-[250px_minmax(0,1fr)]"
      >
        <aside
          class="hidden rounded-2xl border
                 border-[var(--app-border)]
                 bg-[var(--app-surface)] p-3 lg:block"
        >
          <div
            class="mb-3 flex items-center gap-3
                   border-b border-[var(--app-border)] px-3 pb-4 pt-2"
          >
            <span
              class="flex h-10 w-10 items-center justify-center
                     rounded-xl bg-indigo-50 text-indigo-600
                     dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              <i
                class="pi pi-shield text-lg"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p class="font-semibold">
                {{ 'adminNav.title' | translate }}
              </p>

              <p class="mt-0.5 text-xs app-muted">
                Portefolio
              </p>
            </div>
          </div>

          <ng-container
            [ngTemplateOutlet]="navigation"
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
      [blockScroll]="true"
      styleClass="!w-80"
    >
      <ng-container
        [ngTemplateOutlet]="navigation"
      />
    </p-drawer>

    <ng-template #navigation>
      <p-menu
        [model]="menuItems()"
        [ariaLabel]="'adminNav.navigation' | translate"
        styleClass="siw-sidebar-menu"
      >
        <ng-template #item let-item>
          <a
            [routerLink]="item.routerLink"
            routerLinkActive="siw-sidebar-link-active"
            [routerLinkActiveOptions]="
              item.routerLinkActiveOptions || { exact: false }
            "
            #activeLink="routerLinkActive"
            [attr.aria-current]="
              activeLink.isActive ? 'page' : null
            "
            class="p-menu-item-link siw-sidebar-link"
            (click)="closeDrawer()"
          >
            <i
              [class]="item.icon"
              aria-hidden="true"
            ></i>

            <span>{{ item.label }}</span>

            @if (activeLink.isActive) {
              <span
                class="ms-auto h-1.5 w-1.5 rounded-full bg-current"
                aria-hidden="true"
              ></span>
            }
          </a>
        </ng-template>
      </p-menu>
    </ng-template>
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
        label: this.translate.instant(
          'adminNav.overview'
        ),

        items: [
          {
            label: this.translate.instant(
              'adminNav.dashboard'
            ),

            icon: 'pi pi-chart-bar',

            routerLink: '/admin/dashboard',

            routerLinkActiveOptions: {
              exact: true
            }
          }
        ]
      },

      {
        label: this.translate.instant(
          'adminNav.content'
        ),

        items: [
          {
            label: this.translate.instant(
              'adminNav.about'
            ),

            icon: 'pi pi-user',

            routerLink: '/admin/about'
          },

          {
            label: this.translate.instant(
              'adminNav.cv'
            ),

            icon: 'pi pi-file-pdf',

            routerLink: '/admin/cv'
          },

          {
            label: this.translate.instant(
              'adminNav.timeline'
            ),

            icon: 'pi pi-history',

            routerLink: '/admin/timeline'
          },

          {
            label: this.translate.instant(
              'adminNav.technologies'
            ),

            icon: 'pi pi-desktop',

            routerLink: '/admin/technologies'
          },

          {
            label: this.translate.instant(
              'adminNav.categories'
            ),

            icon: 'pi pi-tags',

            routerLink: '/admin/categories'
          },

          {
            label: this.translate.instant(
              'adminNav.skills'
            ),

            icon: 'pi pi-chart-line',

            routerLink: '/admin/skills'
          },

          {
            label: this.translate.instant(
              'adminNav.services'
            ),

            icon: 'pi pi-briefcase',

            routerLink: '/admin/services'
          },

          {
            label: this.translate.instant(
              'adminNav.projects'
            ),

            icon: 'pi pi-folder',

            routerLink: '/admin/projects'
          }
        ]
      },

      {
        label: this.translate.instant(
          'adminNav.moderation'
        ),

        items: [
          {
            label: this.translate.instant(
              'adminNav.reviews'
            ),

            icon: 'pi pi-star',

            routerLink: '/admin/reviews'
          },

          {
            label: this.translate.instant(
              'adminNav.messages'
            ),

            icon: 'pi pi-envelope',

            routerLink: '/admin/messages'
          }
        ]
      }
    ];
  });

  closeDrawer(): void {
    this.drawerVisible = false;
  }
}