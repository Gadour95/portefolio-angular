import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <footer class="border-t border-[var(--app-border)]">
      <div
        class="app-container flex flex-col items-center justify-between
               gap-3 py-6 text-sm sm:flex-row"
      >
        <span class="font-semibold">
          © {{ year }} Portefolio
        </span>

        <span class="app-muted text-center">
          {{ 'footer.description' | translate }}
        </span>
      </div>
    </footer>
  `
})
export class AppFooterComponent {
  readonly year = new Date().getFullYear();
}