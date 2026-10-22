import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { MessageService } from 'primeng/api';

import {
  AuthService
} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-auth-actions',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <div class="flex flex-wrap items-center gap-2">
      @if (auth.isClient()) {
        <a routerLink="/cart" class="app-nav-link">
          <i
            class="pi pi-shopping-cart me-2"
            aria-hidden="true"
          ></i>

          {{ 'auth.cart' | translate }}
        </a>

        <a routerLink="/orders" class="app-nav-link">
          {{ 'auth.orders' | translate }}
        </a>
      }

      @if (auth.isAdmin()) {
        <a
          routerLink="/admin/dashboard"
          class="app-nav-link"
        >
          {{ 'auth.administration' | translate }}
        </a>
      }

      @if (auth.authenticated()) {
        <span class="px-2 text-sm font-medium">
          <i
            class="pi pi-user me-2"
            aria-hidden="true"
          ></i>

          {{ auth.username() }}
        </span>

        <button
          type="button"
          class="app-control text-sm"
          (click)="logout()"
        >
          {{ 'auth.logout' | translate }}
        </button>
      } @else {
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-3
                 text-sm font-semibold text-primary-contrast"
          (click)="login()"
        >
          {{ 'auth.login' | translate }}
        </button>
      }
    </div>
  `
})
export class AuthActionsComponent {
  readonly auth = inject(AuthService);

  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  async login(): Promise<void> {
    try {
      await this.auth.login(this.router.url);
    } catch {
      this.showError();
    }
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } catch {
      this.showError();
    }
  }

  private showError(): void {
    this.messages.add({
      key: 'auth',
      severity: 'error',
      summary: this.translate.instant('auth.errorTitle'),
      detail: this.translate.instant('auth.actionError'),
      life: 5000
    });
  }
}