import {
  Injectable,
  computed,
  inject
} from '@angular/core';

import Keycloak from 'keycloak-js';

import {
  KEYCLOAK_EVENT_SIGNAL
} from 'keycloak-angular';

import {
  environment
} from '../../../environments/environment';

import {
  LanguageService
} from '../services/language.service';

import {
  APP_ROLES,
  AppRole
} from './app-role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly keycloak = inject(Keycloak);

  private readonly keycloakEvents =
    inject(KEYCLOAK_EVENT_SIGNAL);

  private readonly languageService =
    inject(LanguageService);

  private refreshPromise: Promise<string | null> | null = null;

  readonly authenticated = computed(() => {
    this.keycloakEvents();

    return this.keycloak.authenticated === true;
  });

  readonly username = computed(() => {
    this.keycloakEvents();

    const username =
      this.keycloak.tokenParsed?.['preferred_username'];

    return typeof username === 'string' ? username : '';
  });

  readonly customerId = computed(() => {
    this.keycloakEvents();

    return this.keycloak.subject ?? '';
  });

  readonly roles = computed<AppRole[]>(() => {
    this.keycloakEvents();

    if (!this.keycloak.authenticated) {
      return [];
    }

    return Object.values(APP_ROLES).filter(role =>
      this.keycloak.hasRealmRole(role)
    );
  });

  readonly isClient = computed(() =>
    this.roles().includes(APP_ROLES.CLIENT)
  );

  readonly isAdmin = computed(() =>
    this.roles().includes(APP_ROLES.ADMIN)
  );

  hasAnyRole(requiredRoles: readonly AppRole[]): boolean {
    return requiredRoles.some(role =>
      this.roles().includes(role)
    );
  }

  login(returnUrl = '/'): Promise<void> {
    return this.keycloak.login({
      redirectUri: this.internalRedirectUrl(returnUrl),
      locale: this.languageService.current()
    });
  }

  logout(): Promise<void> {
    return this.keycloak.logout({
      redirectUri: `${window.location.origin}/`
    });
  }

  async getValidToken(): Promise<string | null> {
    if (!this.keycloak.authenticated) {
      return null;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken()
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  private async refreshToken(): Promise<string | null> {
    try {
      await this.keycloak.updateToken(30);

      if (!this.keycloak.token) {
        throw new Error('No access token available');
      }

      return this.keycloak.token;
    } catch (error) {
      this.keycloak.clearToken();

      throw error;
    }
  }

  private internalRedirectUrl(path: string): string {
    const fallback = new URL('/', window.location.origin);

    if (!path.startsWith('/') || path.startsWith('//')) {
      return fallback.href;
    }

    const target = new URL(path, window.location.origin);

    return target.origin === window.location.origin
      ? target.href
      : fallback.href;
  }
}