import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection
} from '@angular/core';

import { ViewportScroller } from '@angular/common';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import {
  provideAnimationsAsync
} from '@angular/platform-browser/animations/async';

import { provideKeycloak } from 'keycloak-angular';

import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import {
  provideTranslateService
} from '@ngx-translate/core';

import {
  provideTranslateHttpLoader
} from '@ngx-translate/http-loader';

import {
  environment
} from '../environments/environment';

import { routes } from './app.routes';

import {
  SiwPreset
} from './core/theme/siw.preset';

import {
  ThemeService
} from './core/services/theme.service';

import {
  LanguageService
} from './core/services/language.service';

import { SeoService } from './core/seo/seo.service';

import {
  authInterceptor
} from './core/interceptors/auth.interceptor';

import {
  languageInterceptor
} from './core/interceptors/language.interceptor';

import {
  apiErrorInterceptor
} from './core/interceptors/api-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideKeycloak({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      },

      initOptions: {
        onLoad: 'check-sso',

        pkceMethod: 'S256',

        silentCheckSsoRedirectUri:
          `${window.location.origin}/silent-check-sso.html`,

        silentCheckSsoFallback: true,

        checkLoginIframe: false
      }
    }),

    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled'
      })
    ),

    provideAppInitializer(() => {
      inject(ViewportScroller).setOffset(() => {
        const header = document.querySelector(
          'app-header header'
        );

        const height =
          header?.getBoundingClientRect().height ?? 0;

        return [0, height + 16];
      });
    }),

    provideHttpClient(
      withInterceptors([
        languageInterceptor,
        apiErrorInterceptor,
        authInterceptor
      ])
    ),

    provideAnimationsAsync(),

    providePrimeNG({
      ripple: true,

      theme: {
        preset: SiwPreset,

        options: {
          darkModeSelector: '.app-dark',

          cssLayer: {
            name: 'primeng',
            order:
              'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    }),

    provideTranslateService({
      fallbackLang: 'fr',

      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json'
      })
    }),

    MessageService,

    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      const languageService = inject(LanguageService);
      const seoService = inject(SeoService);

      themeService.init();
      seoService.init();

      return languageService.init();
    })
  ]
};