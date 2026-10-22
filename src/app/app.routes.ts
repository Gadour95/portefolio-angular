import { Routes } from '@angular/router';

import {
  authChildGuard,
  authGuard
} from './core/guards/auth.guard';

import {
  APP_ROLES
} from './core/auth/app-role';

const loadPlaceholder = () =>
  import(
    './core/features/access/protected-placeholder.component'
  ).then(component =>
    component.ProtectedPlaceholderComponent
  );

export const routes: Routes = [
  {
    path: '',

    loadComponent: () =>
      import(
        './layouts/public-layout/public-layout.component'
      ).then(component =>
        component.PublicLayoutComponent
      ),

    children: [
      {
        path: '',
        pathMatch: 'full',

        loadComponent: () =>
          import(
            './features/design-system/design-system.component'
          ).then(component =>
            component.DesignSystemComponent
          )
      },

      {
        path: 'cart',

        canActivate: [authGuard],

        data: {
          roles: [APP_ROLES.CLIENT],
          titleKey: 'auth.cart'
        },

        loadComponent: loadPlaceholder
      },

      {
        path: 'orders',

        canActivate: [authGuard],

        data: {
          roles: [APP_ROLES.CLIENT],
          titleKey: 'auth.orders'
        },

        loadComponent: loadPlaceholder
      },

      {
        path: 'auth-check',

        canActivate: [authGuard],

        data: {
          roles: [APP_ROLES.CLIENT]
        },

        loadComponent: () =>
          import('./features/access/api-check.component')
            .then(component => component.ApiCheckComponent)
      },

      {
        path: 'forbidden',

        loadComponent: () =>
          import(
            './core/features/access/forbidden.component'
          ).then(component =>
            component.ForbiddenComponent
          )
      }
    ]
  },

  {
    path: 'admin',

    canActivate: [authGuard],
    canActivateChild: [authChildGuard],

    data: {
      roles: [APP_ROLES.ADMIN]
    },

    loadComponent: () =>
      import(
        './layouts/admin-layout/admin-layout.component'
      ).then(component =>
        component.AdminLayoutComponent
      ),

    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },

      {
        path: 'dashboard',

        data: {
          roles: [APP_ROLES.ADMIN],
          titleKey: 'auth.dashboard'
        },

        loadComponent: loadPlaceholder
      }
    ]
  },

  {
    path: 'admin-preview',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: ''
  }
];