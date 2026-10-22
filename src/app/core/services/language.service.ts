import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type AppLanguage = 'fr' | 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);
  private readonly storageKey = 'siw-language';

  readonly current = signal<AppLanguage>('fr');

  async init(): Promise<void> {
    this.translate.addLangs(['fr', 'en', 'ar']);

    let saved: string | null = null;

    try {
      saved = localStorage.getItem(this.storageKey);
    } catch {
      // La langue par défaut reste disponible.
    }

    const language: AppLanguage =
      saved === 'fr' || saved === 'en' || saved === 'ar'
        ? saved
        : 'fr';

    await this.setLanguage(language);
  }

  async setLanguage(language: AppLanguage): Promise<void> {
    await firstValueFrom(this.translate.use(language));

    this.current.set(language);

    const root = this.document.documentElement;

    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';

    try {
      localStorage.setItem(this.storageKey, language);
    } catch {
      // Le changement reste fonctionnel sans persistance.
    }
  }
}