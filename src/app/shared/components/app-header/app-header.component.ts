import {
  Component,
  DestroyRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  MenuItem,
  MessageService
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';

import {
  Menu,
  MenuModule
} from 'primeng/menu';

import { TooltipModule } from 'primeng/tooltip';

import {
  filter
} from 'rxjs';

import {
  AuthService
} from '../../../core/auth/auth.service';

import {
  AppLanguage,
  LanguageService
} from '../../../core/services/language.service';

import {
  ThemeMode,
  ThemeService
} from '../../../core/services/theme.service';


@Component({
  selector: 'app-header',
  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    ButtonModule,
    MenuModule,
    TooltipModule
  ],

  templateUrl: './app-header.component.html',

  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 40;
    }
  `]
})
export class AppHeaderComponent {
  readonly auth = inject(AuthService);

  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('languageMenu')
  private languageMenu?: Menu;

  @ViewChild('themeMenu')
  private themeMenu?: Menu;

  @ViewChild('accountMenu')
  private accountMenu?: Menu;

  readonly authBusy = signal(false);

  readonly themeIcon = computed(() => {
    switch (this.themeService.mode()) {
      case 'light':
        return 'pi pi-sun';

      case 'dark':
        return 'pi pi-moon';

      default:
        return 'pi pi-desktop';
    }
  });

  readonly accountLabel = computed(() => {
    this.languageService.current();

    const label = this.translate.instant(
      'header.account'
    );

    const username = this.auth.username();

    return username
      ? `${label} — ${username}`
      : label;
  });

  readonly languageItems = computed<MenuItem[]>(() => {
    const current = this.languageService.current();

    const languages: {
      value: AppLanguage;
      label: string;
    }[] = [
      {
        value: 'fr',
        label: 'Français'
      },
      {
        value: 'en',
        label: 'English'
      },
      {
        value: 'ar',
        label: 'العربية'
      }
    ];

    return languages.map(language => ({
      label: language.label,

      icon:
        current === language.value
          ? 'pi pi-check'
          : 'pi pi-globe',

      styleClass:
        current === language.value
          ? 'siw-menu-selected'
          : '',

      command: () => {
        void this.selectLanguage(language.value);
      }
    }));
  });

  readonly themeItems = computed<MenuItem[]>(() => {
    this.languageService.current();

    const current = this.themeService.mode();

    const themes: {
      value: ThemeMode;
      label: string;
      icon: string;
    }[] = [
      {
        value: 'light',
        label: this.translate.instant(
          'preferences.light'
        ),
        icon: 'pi pi-sun'
      },
      {
        value: 'dark',
        label: this.translate.instant(
          'preferences.dark'
        ),
        icon: 'pi pi-moon'
      },
      {
        value: 'system',
        label: this.translate.instant(
          'preferences.system'
        ),
        icon: 'pi pi-desktop'
      }
    ];

    return themes.map(theme => ({
      label: theme.label,

      icon:
        current === theme.value
          ? 'pi pi-check'
          : theme.icon,

      styleClass:
        current === theme.value
          ? 'siw-menu-selected'
          : '',

      command: () => {
        this.selectTheme(theme.value);
      }
    }));
  });

  readonly accountItems = computed<MenuItem[]>(() => {
    this.languageService.current();

    if (!this.auth.authenticated()) {
      return [];
    }

    const items: MenuItem[] = [];

    items.push({
      label: this.translate.instant(
        'auth.manageAccount'
      ),

      icon: 'pi pi-external-link',
      url: this.auth.accountManagementUrl(),
      target: '_blank'
    });

    items.push({
      separator: true
    });

    items.push({
      label: this.translate.instant(
        'auth.logout'
      ),

      icon: 'pi pi-sign-out',

      styleClass: 'siw-menu-danger',

      command: () => {
        void this.logout();
      }
    });

    return [
      {
        label:
          this.auth.username() ||
          this.translate.instant('header.account'),

        items
      }
    ];
  });

  constructor() {
    this.router.events.pipe(
      filter(
        (event): event is NavigationEnd =>
          event instanceof NavigationEnd
      ),

      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.hideMenus();
    });
  }

  togglePopup(menu: Menu, event: Event): void {
    if (menu !== this.languageMenu) {
      this.languageMenu?.hide();
    }

    if (menu !== this.themeMenu) {
      this.themeMenu?.hide();
    }

    if (menu !== this.accountMenu) {
      this.accountMenu?.hide();
    }

    menu.toggle(event);
  }

  async selectLanguage(
    language: AppLanguage
  ): Promise<void> {
    this.languageMenu?.hide();

    try {
      await this.languageService.setLanguage(language);
    } catch {
      this.notifyError(
        'header.preferenceError'
      );
    }
  }

  selectTheme(mode: ThemeMode): void {
    this.themeMenu?.hide();
    this.themeService.setMode(mode);
  }

  async logout(): Promise<void> {
    if (this.authBusy()) {
      return;
    }

    this.hideMenus();
    this.authBusy.set(true);

    try {
      await this.auth.logout();
    } catch {
      this.notifyError(
        'auth.actionError'
      );
    } finally {
      this.authBusy.set(false);
    }
  }

  private hideMenus(): void {
    this.languageMenu?.hide();
    this.themeMenu?.hide();
    this.accountMenu?.hide();
  }

  private notifyError(key: string): void {
    this.messages.add({
      severity: 'error',

      summary: this.translate.instant(
        'common.error'
      ),

      detail: this.translate.instant(key),

      life: 5000
    });
  }
}