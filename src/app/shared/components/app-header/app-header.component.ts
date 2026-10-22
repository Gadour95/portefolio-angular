import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import {
  AppLanguage,
  LanguageService
} from '../../../core/services/language.service';

import {
  ThemeMode,
  ThemeService
} from '../../../core/services/theme.service';

import {
  AuthActionsComponent
} from '../auth-actions/auth-actions.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, AuthActionsComponent],
  templateUrl: './app-header.component.html'
})
export class AppHeaderComponent {
  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  readonly mobileMenuOpen = signal(false);

  toggleMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  async changeLanguage(event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'fr' || value === 'en' || value === 'ar') {
      await this.languageService.setLanguage(value as AppLanguage);
    }
  }

  changeTheme(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'light' || value === 'dark' || value === 'system') {
      this.themeService.setMode(value as ThemeMode);
    }
  }
}