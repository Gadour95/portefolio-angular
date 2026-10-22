import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'siw-theme';

  private mediaQuery: MediaQueryList | null = null;

  readonly mode = signal<ThemeMode>('system');
  readonly isDark = signal(false);

  init(): void {
    let saved: string | null = null;

    try {
      saved = localStorage.getItem(this.storageKey);
    } catch {
      // Le stockage peut être bloqué par le navigateur.
    }

    const mode: ThemeMode =
      saved === 'light' || saved === 'dark' || saved === 'system'
        ? saved
        : 'system';

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mode.set(mode);
    this.applyTheme();

    this.mediaQuery.addEventListener('change', () => {
      if (this.mode() === 'system') {
        this.applyTheme();
      }
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);

    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      // Le changement reste fonctionnel sans persistance.
    }

    this.applyTheme();
  }

  private applyTheme(): void {
    const dark =
      this.mode() === 'dark' ||
      (this.mode() === 'system' && !!this.mediaQuery?.matches);

    this.isDark.set(dark);
    this.document.documentElement.classList.toggle('app-dark', dark);
  }
}