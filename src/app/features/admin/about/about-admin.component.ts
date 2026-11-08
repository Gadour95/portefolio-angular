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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';

import { finalize } from 'rxjs';

import {
  ApiError
} from '../../../core/models/api-error.model';

import {
  AppLang,
  LocalizedText
} from '../../../core/models/common.model';

import {
  AboutAdmin,
  AboutAdminRequest
} from '../../../core/models/about.model';

import { AboutService } from '../../../core/services/about.service';

type LocalizedGroup =
  | 'description'
  | 'location'
  | 'availability';

interface LanguageOption {
  code: AppLang;
  label: string;
  dir: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-admin-about',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    SkeletonModule,
    TextareaModule
  ],

  template: `
    <div class="space-y-6">
      <section>
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
          {{ 'adminPages.about.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.about.subtitle' | translate }}
        </p>
      </section>

      @if (loading()) {
        <p-card styleClass="rounded-2xl">
          <div class="space-y-5" aria-busy="true">
            <p-skeleton height="4.5rem" borderRadius="1rem" />
            <p-skeleton height="9rem" borderRadius="1rem" />
            <p-skeleton height="4.5rem" borderRadius="1rem" />
            <p-skeleton height="4.5rem" borderRadius="1rem" />
          </div>
        </p-card>
      } @else if (loadError()) {
        <p-card styleClass="rounded-2xl">
          <div
            class="flex flex-col items-center gap-4 py-10 text-center"
          >
            <span
              class="flex h-14 w-14 items-center justify-center
                     rounded-2xl bg-red-50 text-red-600
                     dark:bg-red-500/10 dark:text-red-300"
            >
              <i class="pi pi-exclamation-triangle text-2xl"></i>
            </span>

            <p class="font-semibold">{{ loadError() }}</p>

            <p-button
              icon="pi pi-refresh"
              [label]="'common.retry' | translate"
              [outlined]="true"
              (onClick)="load()"
            />
          </div>
        </p-card>
      } @else {
        <p-card styleClass="rounded-2xl">
          <form
            [formGroup]="form"
            (ngSubmit)="save()"
            class="space-y-7"
          >
            @if (notConfigured()) {
              <p-message severity="info" styleClass="w-full">
                {{ 'adminAbout.notConfigured' | translate }}
              </p-message>
            }

            @if (formError(); as error) {
              <p-message severity="error" styleClass="w-full">
                {{ error }}
              </p-message>
            }

            <section class="space-y-4">
              <div>
                <h2 class="text-base font-semibold">
                  {{ 'adminAbout.contact' | translate }}
                </h2>

                <p class="mt-1 text-sm app-muted">
                  {{ 'adminAbout.contactHelp' | translate }}
                </p>
              </div>

              <div>
                <label for="about-email" class="app-label">
                  {{ 'adminAbout.email' | translate }}
                  <span
                    class="text-red-500"
                    aria-hidden="true"
                  >*</span>
                </label>

                <input
                  pInputText
                  id="about-email"
                  type="email"
                  formControlName="email"
                  class="w-full"
                  autocomplete="email"
                  [readonly]="saving()"
                  [class.ng-invalid]="
                    (form.controls.email.invalid &&
                      form.controls.email.touched) ||
                    !!serverFieldErrors()['email']
                  "
                  [class.ng-dirty]="form.controls.email.touched"
                  [attr.aria-invalid]="
                    form.controls.email.invalid &&
                    form.controls.email.touched
                  "
                  aria-describedby="about-email-help about-email-error"
                />

                <p
                  id="about-email-help"
                  class="mt-2 text-xs app-muted"
                >
                  {{ 'adminAbout.emailHelp' | translate }}
                </p>

                @if (
                  form.controls.email.invalid &&
                  form.controls.email.touched
                ) {
                  <p-message
                    id="about-email-error"
                    severity="error"
                    variant="simple"
                    styleClass="mt-2"
                  >
                    {{
                      form.controls.email.hasError('required')
                        ? ('adminAbout.emailRequired' | translate)
                        : form.controls.email.hasError('email')
                          ? ('adminAbout.emailInvalid' | translate)
                          : ('adminAbout.emailTooLong' | translate)
                    }}
                  </p-message>
                }

                @if (serverFieldErrors()['email']; as error) {
                  <p-message
                    severity="error"
                    variant="simple"
                    styleClass="mt-2"
                  >
                    {{ error }}
                  </p-message>
                }
              </div>
            </section>

            <div
              class="border-t border-[var(--app-border)] pt-7"
            >
              <div class="mb-5">
                <h2 class="text-base font-semibold">
                  {{ 'adminAbout.translations' | translate }}
                </h2>

                <p class="mt-1 text-sm app-muted">
                  {{
                    'adminAbout.translationsHelp' | translate
                  }}
                </p>
              </div>

              <div class="space-y-6">
                @for (
                  field of localizedFields;
                  track field.key
                ) {
                  <div>
                    <label class="app-label">
                      {{ field.labelKey | translate }}
                      <span
                        class="text-red-500"
                        aria-hidden="true"
                      >*</span>
                    </label>

                    @if (field.helpKey) {
                      <p class="mt-1 text-xs app-muted">
                        {{ field.helpKey | translate }}
                      </p>
                    }

                    <div class="mt-3 grid gap-3">
                      @for (
                        lang of languages;
                        track lang.code
                      ) {
                        <div>
                          <label
                            [for]="
                              'about-' + field.key + '-' +
                              lang.code
                            "
                            class="mb-1 flex items-center gap-2
                                   text-xs font-semibold app-muted"
                          >
                            <span
                              class="inline-flex min-w-16
                                     items-center justify-center
                                     rounded-md
                                     bg-[var(--app-surface-muted)]
                                     px-2 py-0.5"
                            >
                              {{ lang.label }}
                            </span>

                            <span
                              class="uppercase tracking-wide"
                            >
                              {{ lang.code }}
                            </span>
                          </label>

                          @if (field.multiline) {
                            <textarea
                              pTextarea
                              [id]="
                                'about-' + field.key + '-' +
                                lang.code
                              "
                              rows="5"
                              [formControl]="
                                localizedControl(
                                  field.key,
                                  lang.code
                                )
                              "
                              class="w-full"
                              [dir]="lang.dir"
                              [readonly]="saving()"
                              [class.ng-invalid]="
                                isLocalizedInvalid(
                                  field.key,
                                  lang.code
                                ) ||
                                !!serverLocalizedError(
                                  field.key,
                                  lang.code
                                )
                              "
                              [class.ng-dirty]="
                                localizedControl(
                                  field.key,
                                  lang.code
                                ).touched
                              "
                            ></textarea>
                          } @else {
                            <input
                              pInputText
                              [id]="
                                'about-' + field.key + '-' +
                                lang.code
                              "
                              [formControl]="
                                localizedControl(
                                  field.key,
                                  lang.code
                                )
                              "
                              class="w-full"
                              [dir]="lang.dir"
                              autocomplete="off"
                              [readonly]="saving()"
                              [class.ng-invalid]="
                                isLocalizedInvalid(
                                  field.key,
                                  lang.code
                                ) ||
                                !!serverLocalizedError(
                                  field.key,
                                  lang.code
                                )
                              "
                              [class.ng-dirty]="
                                localizedControl(
                                  field.key,
                                  lang.code
                                ).touched
                              "
                            />
                          }

                          @if (
                            isLocalizedInvalid(
                              field.key,
                              lang.code
                            )
                          ) {
                            <p-message
                              severity="error"
                              variant="simple"
                              styleClass="mt-2"
                            >
                              {{
                                localizedErrorKey(
                                  field.key,
                                  lang.code
                                ) | translate
                              }}
                            </p-message>
                          }

                          @if (
                            serverLocalizedError(
                              field.key,
                              lang.code
                            );
                            as error
                          ) {
                            <p-message
                              severity="error"
                              variant="simple"
                              styleClass="mt-2"
                            >
                              {{ error }}
                            </p-message>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div
              class="flex flex-wrap items-center justify-end gap-2
                     border-t border-[var(--app-border)] pt-5"
            >
              <p-button
                type="button"
                icon="pi pi-undo"
                severity="secondary"
                [text]="true"
                [label]="'adminAbout.reload' | translate"
                [disabled]="saving()"
                (onClick)="load()"
              />

              <p-button
                type="submit"
                icon="pi pi-check"
                [label]="'adminAbout.save' | translate"
                [loading]="saving()"
                [disabled]="saving()"
              />
            </div>
          </form>
        </p-card>
      }
    </div>
  `
})
export class AboutAdminComponent implements OnInit {
  private readonly api = inject(AboutService);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly languages: LanguageOption[] = [
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'ar', label: 'العربية', dir: 'rtl' }
  ];

  readonly localizedFields: {
    key: LocalizedGroup;
    labelKey: string;
    helpKey: string | null;
    multiline: boolean;
  }[] = [
    {
      key: 'description',
      labelKey: 'adminAbout.description',
      helpKey: 'adminAbout.descriptionHelp',
      multiline: true
    },
    {
      key: 'location',
      labelKey: 'adminAbout.location',
      helpKey: null,
      multiline: false
    },
    {
      key: 'availability',
      labelKey: 'adminAbout.availability',
      helpKey: null,
      multiline: false
    }
  ];

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly notConfigured = signal(false);

  readonly formError = signal<string | null>(null);

  readonly serverFieldErrors =
    signal<Record<string, string>>({});

  readonly form = new FormGroup({
    description: this.localizedGroup(4000),
    location: this.localizedGroup(180),
    availability: this.localizedGroup(180),

    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(180)
      ]
    })
  });

  ngOnInit(): void {
    this.load();
  }

  localizedControl(
    group: LocalizedGroup,
    lang: AppLang
  ): FormControl<string> {
    return this.form.controls[group].controls[lang];
  }

  isLocalizedInvalid(
    group: LocalizedGroup,
    lang: AppLang
  ): boolean {
    const control = this.localizedControl(group, lang);

    return control.invalid && control.touched;
  }

  localizedErrorKey(
    group: LocalizedGroup,
    lang: AppLang
  ): string {
    const control = this.localizedControl(group, lang);

    return control.hasError('maxlength')
      ? `adminAbout.${group}TooLong`
      : `adminAbout.${group}Required`;
  }

  serverLocalizedError(
    group: LocalizedGroup,
    lang: AppLang
  ): string | null {
    const errors = this.serverFieldErrors();

    return (
      errors[`${group}.${lang}`] ??
      errors[group] ??
      null
    );
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.api.getAdminAbout().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: about => {
        this.applyAbout(about);
        this.notConfigured.set(false);
      },

      error: (error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 404
        ) {
          this.resetForm();
          this.notConfigured.set(true);
          return;
        }

        this.loadError.set(
          this.translate.instant('adminAbout.loadError')
        );
      }
    });
  }

  save(): void {
    if (this.saving()) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.formError.set(
        this.translate.instant(
          'adminAbout.validationError'
        )
      );

      return;
    }

    this.formError.set(null);
    this.serverFieldErrors.set({});
    this.saving.set(true);

    const values = this.form.getRawValue();

    const payload: AboutAdminRequest = {
      description: this.cleanLocalized(values.description),
      location: this.cleanLocalized(values.location),
      availability: this.cleanLocalized(values.availability),
      email: values.email.trim()
    };

    this.api.upsertAdminAbout(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: about => {
        this.applyAbout(about);
        this.notConfigured.set(false);

        this.messages.add({
          severity: 'success',
          summary: this.translate.instant(
            'adminAbout.success'
          ),
          detail: this.translate.instant('adminAbout.saved'),
          life: 3500
        });
      },

      error: (error: unknown) => {
        this.formError.set(this.errorMessage(error));

        if (error instanceof HttpErrorResponse) {
          const body = error.error as ApiError | null;

          this.serverFieldErrors.set(
            body?.validationErrors ?? {}
          );
        }
      }
    });
  }

  private applyAbout(about: AboutAdmin): void {
    this.form.reset({
      description: this.toLocalized(about.description),
      location: this.toLocalized(about.location),
      availability: this.toLocalized(about.availability),
      email: about.email ?? ''
    });

    this.formError.set(null);
    this.serverFieldErrors.set({});
  }

  private resetForm(): void {
    this.form.reset({
      description: this.emptyLocalized(),
      location: this.emptyLocalized(),
      availability: this.emptyLocalized(),
      email: ''
    });

    this.formError.set(null);
    this.serverFieldErrors.set({});
  }

  private localizedGroup(maxLength: number) {
    const createControl = () =>
      new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(maxLength)
        ]
      });

    return new FormGroup({
      fr: createControl(),
      en: createControl(),
      ar: createControl()
    });
  }

  private emptyLocalized(): LocalizedText {
    return { fr: '', en: '', ar: '' };
  }

  private toLocalized(
    value: LocalizedText | null | undefined
  ): LocalizedText {
    return {
      fr: value?.fr ?? '',
      en: value?.en ?? '',
      ar: value?.ar ?? ''
    };
  }

  private cleanLocalized(
    value: LocalizedText
  ): LocalizedText {
    return {
      fr: value.fr.trim(),
      en: value.en.trim(),
      ar: value.ar.trim()
    };
  }

  private errorMessage(error: unknown): string {
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

    return this.translate.instant('adminAbout.genericError');
  }
}
