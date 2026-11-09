import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

import { finalize } from 'rxjs';

import {
  ApiError
} from '../../../core/models/api-error.model';

import { AppLang } from '../../../core/models/common.model';
import { CvAdmin } from '../../../core/models/cv.model';

import { CvService } from '../../../core/services/cv.service';

interface LanguageOption {
  code: AppLang;
  label: string;
  native: string;
  dir: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-cv-admin',
  standalone: true,

  imports: [
    TranslatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    MessageModule,
    TooltipModule
  ],

  providers: [ConfirmationService],

  template: `
    <div class="space-y-6">
      <section
        class="flex flex-col justify-between gap-4
               sm:flex-row sm:items-end"
      >
        <div>
          <p
            class="text-xs font-bold uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)]"
          >
            {{ 'adminNav.content' | translate }}
          </p>

          <h1
            class="mt-2 text-2xl font-bold tracking-[-0.035em]
                   sm:text-3xl"
          >
            {{ 'adminCv.title' | translate }}
          </h1>

          <p class="mt-2 max-w-2xl app-muted">
            {{ 'adminCv.subtitle' | translate }}
          </p>
        </div>

        <p-button
          icon="pi pi-refresh"
          severity="secondary"
          [outlined]="true"
          [loading]="loading()"
          [label]="'adminCv.refresh' | translate"
          (onClick)="load()"
        />
      </section>

      @if (loadError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      <div class="grid gap-5 lg:grid-cols-3">
        @for (lang of languages; track lang.code) {
          <p-card styleClass="rounded-2xl">
            <div class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span
                    class="inline-grid h-11 w-11 place-items-center
                           rounded-xl bg-indigo-50 text-sm font-bold
                           uppercase text-indigo-600
                           dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    {{ lang.code }}
                  </span>

                  <div>
                    <p class="font-semibold">{{ lang.label }}</p>
                    <p
                      class="text-xs app-muted"
                      [dir]="lang.dir"
                    >
                      {{ lang.native }}
                    </p>
                  </div>
                </div>

                @if (cvFor(lang.code); as cv) {
                  <span
                    class="rounded-full bg-emerald-100 px-2.5 py-0.5
                           text-xs font-semibold text-emerald-700"
                  >
                    {{ 'adminCv.available' | translate }}
                  </span>
                } @else {
                  <span
                    class="rounded-full bg-[var(--app-surface-muted)]
                           px-2.5 py-0.5 text-xs font-semibold app-muted"
                  >
                    {{ 'adminCv.missing' | translate }}
                  </span>
                }
              </div>

              @if (cvFor(lang.code); as cv) {
                <div class="space-y-3">
                  <div
                    class="rounded-xl border border-[var(--app-border)]
                           bg-[var(--app-surface-muted)] p-3"
                  >
                    <p
                      class="truncate text-sm font-medium"
                      [pTooltip]="cv.filename"
                    >
                      {{ cv.filename }}
                    </p>

                    <p class="mt-1 text-xs app-muted">
                      {{ formatSize(cv.fileSize) }}
                      &middot;
                      {{ formatDate(cv.updatedAt) }}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <a
                      [href]="cv.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex min-h-9 items-center gap-2
                             rounded-lg border border-[var(--app-border)]
                             bg-[var(--app-surface)] px-3 py-1.5
                             text-sm font-semibold transition
                             hover:border-[var(--p-primary-color)]
                             hover:text-[var(--p-primary-color)]"
                    >
                      <i
                        class="pi pi-external-link text-xs"
                        aria-hidden="true"
                      ></i>

                      {{ 'adminCv.open' | translate }}
                    </a>

                    <input
                      #replaceInput
                      type="file"
                      class="hidden"
                      accept="application/pdf,.pdf"
                      (change)="onFileSelected(lang.code, $event)"
                    />

                    <p-button
                      type="button"
                      icon="pi pi-upload"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      [label]="'adminCv.replace' | translate"
                      [loading]="uploading() === lang.code"
                      [disabled]="
                        uploading() !== null || deleting() !== null
                      "
                      (onClick)="replaceInput.click()"
                    />

                    <p-button
                      type="button"
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      size="small"
                      [label]="'adminCv.delete' | translate"
                      [loading]="deleting() === lang.code"
                      [disabled]="
                        uploading() !== null || deleting() !== null
                      "
                      (onClick)="confirmDelete(cv)"
                    />
                  </div>
                </div>
              } @else {
                <div
                  class="flex flex-col items-center justify-center gap-3
                         rounded-xl border border-dashed
                         border-[var(--app-border)] px-4 py-8 text-center"
                >
                  <span
                    class="inline-grid h-14 w-14 place-items-center
                           rounded-2xl bg-[var(--app-surface-muted)]
                           text-[var(--p-primary-color)]"
                  >
                    <i
                      class="pi pi-file-pdf text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="text-sm app-muted">
                    {{ 'adminCv.noCv' | translate }}
                  </p>

                  <input
                    #addInput
                    type="file"
                    class="hidden"
                    accept="application/pdf,.pdf"
                    (change)="onFileSelected(lang.code, $event)"
                  />

                  <p-button
                    type="button"
                    icon="pi pi-plus"
                    size="small"
                    [label]="'adminCv.upload' | translate"
                    [loading]="uploading() === lang.code"
                    [disabled]="
                      uploading() !== null || deleting() !== null
                    "
                    (onClick)="addInput.click()"
                  />
                </div>
              }

              <p class="text-xs app-muted">
                {{ 'adminCv.formatHelp' | translate }}
              </p>
            </div>
          </p-card>
        }
      </div>
    </div>

    <p-confirmdialog
      [style]="{
        width: '30rem',
        maxWidth: 'calc(100vw - 2rem)'
      }"
    />
  `
})
export class CvAdminComponent implements OnInit {
  private readonly api = inject(CvService);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly maxSize = 20 * 1024 * 1024;

  readonly languages: LanguageOption[] = [
    { code: 'fr', label: 'Français', native: 'Français', dir: 'ltr' },
    { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
    { code: 'ar', label: 'العربية', native: 'العربية', dir: 'rtl' }
  ];

  readonly cvs = signal<CvAdmin[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly uploading = signal<AppLang | null>(null);
  readonly deleting = signal<AppLang | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.api.getAdminCvs().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: cvs => {
        this.cvs.set(cvs);
      },

      error: () => {
        this.loadError.set(
          this.translate.instant('common.loadingError')
        );
      }
    });
  }

  cvFor(locale: AppLang): CvAdmin | null {
    return this.cvs().find(cv => cv.locale === locale) ?? null;
  }

  onFileSelected(locale: AppLang, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file || this.uploading() !== null) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminCv.error'),
        detail: this.translate.instant('adminCv.pdfOnly'),
        life: 6000
      });
      return;
    }

    if (file.size > this.maxSize) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminCv.error'),
        detail: this.translate.instant('adminCv.sizeError'),
        life: 6000
      });
      return;
    }

    this.uploading.set(locale);

    this.api.uploadCv(locale, file).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploading.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminCv.uploaded');
        this.load();
      },

      error: (error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          (error.status === 401 || error.status === 403)
        ) {
          return;
        }

        this.messages.add({
          severity: 'error',
          summary: this.translate.instant('adminCv.error'),
          detail: this.errorMessage(error, 'adminCv.uploadError'),
          life: 6000
        });
      }
    });
  }

  confirmDelete(cv: CvAdmin): void {
    if (this.deleting() !== null) {
      return;
    }

    const language = this.languageLabel(cv.locale);

    this.confirmation.confirm({
      header: this.translate.instant('adminCv.deleteTitle'),

      message: this.translate.instant('adminCv.deleteQuestion', {
        language
      }),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant('adminCv.delete'),
      rejectLabel: this.translate.instant('adminCv.cancel'),

      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteCv(cv.locale)
    });
  }

  formatSize(bytes: number | null): string {
    if (bytes === null) {
      return '—';
    }

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(1)} Mo`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleString();
  }

  private deleteCv(locale: AppLang): void {
    this.deleting.set(locale);

    this.api.deleteCv(locale).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deleting.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminCv.deleted');
        this.load();
      },

      error: (error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          (error.status === 401 || error.status === 403)
        ) {
          return;
        }

        this.messages.add({
          severity: 'error',
          summary: this.translate.instant('adminCv.error'),
          detail: this.errorMessage(error, 'adminCv.deleteError'),
          life: 6000
        });
      }
    });
  }

  private languageLabel(locale: AppLang): string {
    return (
      this.languages.find(lang => lang.code === locale)?.label ??
      locale
    );
  }

  private notify(key: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('adminCv.success'),
      detail: this.translate.instant(key),
      life: 3500
    });
  }

  private errorMessage(error: unknown, fallbackKey: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | null;

      if (
        body &&
        typeof body.message === 'string' &&
        body.message.trim()
      ) {
        return body.message;
      }
    }

    return this.translate.instant(fallbackKey);
  }
}
