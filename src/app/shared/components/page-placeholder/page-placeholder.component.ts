import { Component, Input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

/**
 * Coquille temporaire utilisée par les pages dont le contenu
 * sera développé dans une étape ultérieure.
 */
@Component({
  selector: 'app-page-placeholder',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <section class="space-y-3">
      <p
        class="text-xs font-bold uppercase tracking-[0.14em]
               text-[var(--p-primary-color)]"
      >
        {{ eyebrowKey | translate }}
      </p>

      <h1 class="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
        {{ titleKey | translate }}
      </h1>

      <p class="max-w-2xl leading-7 text-[var(--app-text-muted)]">
        {{ subtitleKey | translate }}
      </p>

      <div
        class="mt-8 rounded-2xl border border-[var(--app-border)]
               bg-[var(--app-surface)] p-6"
      >
        <p class="text-sm text-[var(--app-text-muted)]">
          {{ 'common.toComplete' | translate }}
        </p>
      </div>
    </section>
  `
})
export class PagePlaceholderComponent {
  @Input({ required: true }) titleKey = '';
  @Input({ required: true }) subtitleKey = '';
  @Input() eyebrowKey = 'app.name';
}
