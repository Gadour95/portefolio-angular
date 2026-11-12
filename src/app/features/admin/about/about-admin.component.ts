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
  FormArray,
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
  AboutAdminRequest,
  AboutLink
} from '../../../core/models/about.model';

import { AboutService } from '../../../core/services/about.service';

import { MediaService } from '../../../core/services/media.service';

import { resolveMediaUrl } from '../../../core/http/media-url';

type LocalizedGroup =
  | 'description'
  | 'location'
  | 'availability';

interface LanguageOption {
  code: AppLang;
  label: string;
  dir: 'ltr' | 'rtl';
}

type LinkGroup = FormGroup<{
  image: FormControl<string | null>;
  text: FormControl<string>;
  url: FormControl<string>;
}>;

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

              <div class="border-t border-[var(--app-border)] pt-5">
                <div
                  class="flex flex-wrap items-start justify-between gap-3"
                >
                  <div>
                    <h3 class="text-sm font-semibold">
                      {{ 'adminAbout.phones' | translate }}
                    </h3>

                    <p class="mt-1 text-xs app-muted">
                      {{ 'adminAbout.phonesHelp' | translate }}
                    </p>
                  </div>

                  <p-button
                    type="button"
                    icon="pi pi-plus"
                    severity="secondary"
                    [outlined]="true"
                    [label]="'adminAbout.addPhone' | translate"
                    [disabled]="saving() || phones.length >= 20"
                    (onClick)="addPhone()"
                  />
                </div>

                @if (phones.length === 0) {
                  <p
                    class="mt-3 rounded-xl border border-dashed
                           border-[var(--app-border)] px-4 py-3
                           text-xs app-muted"
                  >
                    {{ 'adminAbout.noPhones' | translate }}
                  </p>
                } @else {
                  <div class="mt-3 space-y-3">
                    @for (
                      phone of phones.controls;
                      track phone;
                      let i = $index
                    ) {
                      <div class="flex items-start gap-2">
                        <div class="min-w-0 flex-1">
                          <input
                            pInputText
                            type="tel"
                            dir="ltr"
                            class="w-full"
                            [formControl]="phone"
                            [placeholder]="
                              'adminAbout.phonePlaceholder'
                                | translate
                            "
                            [readonly]="saving()"
                            [class.ng-invalid]="
                              phone.invalid && phone.touched
                            "
                            [class.ng-dirty]="phone.touched"
                          />

                          @if (phone.invalid && phone.touched) {
                            <p-message
                              severity="error"
                              variant="simple"
                              styleClass="mt-2"
                            >
                              {{
                                phone.hasError('maxlength')
                                  ? ('adminAbout.phoneTooLong'
                                    | translate)
                                  : ('adminAbout.phoneRequired'
                                    | translate)
                              }}
                            </p-message>
                          }
                        </div>

                        <p-button
                          type="button"
                          icon="pi pi-trash"
                          severity="danger"
                          [text]="true"
                          [rounded]="true"
                          [ariaLabel]="
                            'adminAbout.removePhone' | translate
                          "
                          [disabled]="saving()"
                          (onClick)="removePhone(i)"
                        />
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="border-t border-[var(--app-border)] pt-5">
                <div
                  class="flex flex-wrap items-start justify-between gap-3"
                >
                  <div>
                    <h3 class="text-sm font-semibold">
                      {{ 'adminAbout.links' | translate }}
                    </h3>

                    <p class="mt-1 text-xs app-muted">
                      {{ 'adminAbout.linksHelp' | translate }}
                    </p>
                  </div>

                  <p-button
                    type="button"
                    icon="pi pi-plus"
                    severity="secondary"
                    [outlined]="true"
                    [label]="'adminAbout.addLink' | translate"
                    [disabled]="saving() || links.length >= 30"
                    (onClick)="addLink()"
                  />
                </div>

                @if (links.length === 0) {
                  <p
                    class="mt-3 rounded-xl border border-dashed
                           border-[var(--app-border)] px-4 py-3
                           text-xs app-muted"
                  >
                    {{ 'adminAbout.noLinks' | translate }}
                  </p>
                } @else {
                  <div class="mt-3 space-y-4">
                    @for (
                      link of links.controls;
                      track link;
                      let i = $index
                    ) {
                      <div
                        class="rounded-2xl border
                               border-[var(--app-border)] p-4"
                      >
                        <div
                          class="flex items-start justify-between gap-3"
                        >
                          <p
                            class="text-xs font-semibold app-muted"
                          >
                            #{{ i + 1 }}
                          </p>

                          <p-button
                            type="button"
                            icon="pi pi-trash"
                            severity="danger"
                            [text]="true"
                            [rounded]="true"
                            [ariaLabel]="
                              'adminAbout.removeLink' | translate
                            "
                            [disabled]="saving()"
                            (onClick)="removeLink(i)"
                          />
                        </div>

                        <div
                          class="mt-3 grid gap-4
                                 md:grid-cols-[auto_minmax(0,1fr)]"
                        >
                          <div>
                            <span class="app-label">
                              {{
                                'adminAbout.linkImage'
                                  | translate
                              }}
                            </span>

                            <div class="flex items-start gap-3">
                              @if (
                                linkAt(i).controls.image.value
                              ) {
                                <img
                                  [src]="linkImageUrl(i)"
                                  [alt]="
                                    linkAt(i).controls.text.value
                                      || ('adminAbout.linkImage'
                                        | translate)
                                  "
                                  class="h-14 w-14 rounded-xl
                                         border
                                         border-[var(--app-border)]
                                         object-cover"
                                />
                              } @else {
                                <span
                                  class="flex h-14 w-14
                                         items-center justify-center
                                         rounded-xl border
                                         border-dashed
                                         border-[var(--app-border)]"
                                  aria-hidden="true"
                                >
                                  <i
                                    class="pi pi-image text-lg
                                           app-muted"
                                  ></i>
                                </span>
                              }

                              <div
                                class="flex flex-col items-start
                                       gap-2"
                              >
                                <input
                                  #linkImageInput
                                  type="file"
                                  class="hidden"
                                  accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                                  (change)="
                                    onLinkImageSelected(
                                      i,
                                      $event
                                    )
                                  "
                                />

                                <p-button
                                  type="button"
                                  icon="pi pi-upload"
                                  severity="secondary"
                                  [outlined]="true"
                                  [label]="
                                    'adminAbout.uploadImage'
                                      | translate
                                  "
                                  [loading]="
                                    uploadingLinkImage() === i
                                  "
                                  [disabled]="
                                    saving() ||
                                    uploadingLinkImage() !== null
                                  "
                                  (onClick)="linkImageInput.click()"
                                />

                                @if (
                                  linkAt(i).controls.image.value
                                ) {
                                  <p-button
                                    type="button"
                                    icon="pi pi-times"
                                    severity="danger"
                                    [text]="true"
                                    [label]="
                                      'adminAbout.removeImage'
                                        | translate
                                    "
                                    [disabled]="
                                      saving() ||
                                      uploadingLinkImage() !==
                                        null
                                    "
                                    (onClick)="removeLinkImage(i)"
                                  />
                                }
                              </div>
                            </div>

                            <p
                              class="mt-2 max-w-52 text-xs
                                     app-muted"
                            >
                              {{
                                'adminAbout.linkImageHelp'
                                  | translate
                              }}
                            </p>
                          </div>

                          <div class="grid gap-4">
                            <div>
                              <label
                                class="app-label"
                                [for]="'about-link-text-' + i"
                              >
                                {{
                                  'adminAbout.linkText'
                                    | translate
                                }}
                                <span
                                  class="text-red-500"
                                  aria-hidden="true"
                                >*</span>
                              </label>

                              <input
                                pInputText
                                [id]="'about-link-text-' + i"
                                type="text"
                                class="w-full"
                                [formControl]="
                                  linkAt(i).controls.text
                                "
                                [placeholder]="
                                  'adminAbout.linkTextPlaceholder'
                                    | translate
                                "
                                [readonly]="saving()"
                                [class.ng-invalid]="
                                  linkAt(i).controls.text.invalid &&
                                  linkAt(i).controls.text.touched
                                "
                                [class.ng-dirty]="
                                  linkAt(i).controls.text.touched
                                "
                              />

                              @if (
                                linkAt(i).controls.text.invalid &&
                                linkAt(i).controls.text.touched
                              ) {
                                <p-message
                                  severity="error"
                                  variant="simple"
                                  styleClass="mt-2"
                                >
                                  {{
                                    linkAt(i).controls.text.hasError(
                                      'maxlength'
                                    )
                                      ? ('adminAbout.linkTextTooLong'
                                        | translate)
                                      : ('adminAbout.linkTextRequired'
                                        | translate)
                                  }}
                                </p-message>
                              }
                            </div>

                            <div>
                              <label
                                class="app-label"
                                [for]="'about-link-url-' + i"
                              >
                                {{
                                  'adminAbout.linkUrl'
                                    | translate
                                }}
                                <span
                                  class="text-red-500"
                                  aria-hidden="true"
                                >*</span>
                              </label>

                              <input
                                pInputText
                                [id]="'about-link-url-' + i"
                                type="url"
                                dir="ltr"
                                class="w-full"
                                [formControl]="
                                  linkAt(i).controls.url
                                "
                                [placeholder]="
                                  'adminAbout.linkUrlPlaceholder'
                                    | translate
                                "
                                [readonly]="saving()"
                                [class.ng-invalid]="
                                  linkAt(i).controls.url.invalid &&
                                  linkAt(i).controls.url.touched
                                "
                                [class.ng-dirty]="
                                  linkAt(i).controls.url.touched
                                "
                              />

                              @if (
                                linkAt(i).controls.url.invalid &&
                                linkAt(i).controls.url.touched
                              ) {
                                <p-message
                                  severity="error"
                                  variant="simple"
                                  styleClass="mt-2"
                                >
                                  {{
                                    linkAt(i).controls.url.hasError(
                                      'maxlength'
                                    )
                                      ? ('adminAbout.linkUrlTooLong'
                                        | translate)
                                      : linkAt(i).controls.url.hasError(
                                            'pattern'
                                          )
                                        ? ('adminAbout.linkUrlInvalid'
                                          | translate)
                                        : ('adminAbout.linkUrlRequired'
                                          | translate)
                                  }}
                                </p-message>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
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
  private readonly media = inject(MediaService);
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
  readonly uploadingLinkImage = signal<number | null>(null);

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
    }),

    phones: new FormArray<FormControl<string>>([]),
    links: new FormArray<LinkGroup>([])
  });

  get phones(): FormArray<FormControl<string>> {
    return this.form.controls.phones;
  }

  get links(): FormArray<LinkGroup> {
    return this.form.controls.links;
  }

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

  addPhone(value = ''): void {
    if (this.phones.length >= 20) {
      return;
    }

    this.phones.push(this.phoneControl(value));
  }

  removePhone(index: number): void {
    if (index < 0 || index >= this.phones.length) {
      return;
    }

    this.phones.removeAt(index);
  }

  addLink(link?: AboutLink): void {
    if (this.links.length >= 30) {
      return;
    }

    this.links.push(this.linkGroup(link));
  }

  removeLink(index: number): void {
    if (index < 0 || index >= this.links.length) {
      return;
    }

    this.links.removeAt(index);
  }

  linkAt(index: number): LinkGroup {
    return this.links.at(index);
  }

  linkImageUrl(index: number): string {
    return (
      resolveMediaUrl(this.linkAt(index).controls.image.value) ??
      ''
    );
  }

  onLinkImageSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file || this.uploadingLinkImage() !== null) {
      return;
    }

    this.uploadingLinkImage.set(index);

    this.media.uploadImages([file]).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploadingLinkImage.set(null))
    ).subscribe({
      next: media => {
        const path = media[0]?.path;

        if (!path || index >= this.links.length) {
          return;
        }

        const control = this.linkAt(index).controls.image;

        control.setValue(path);
        control.markAsDirty();
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
          summary: this.translate.instant(
            'adminAbout.imageUploadError'
          ),
          detail: this.translate.instant(
            'adminAbout.imageUploadErrorDetail'
          ),
          life: 6000
        });
      }
    });
  }

  removeLinkImage(index: number): void {
    if (index < 0 || index >= this.links.length) {
      return;
    }

    const control = this.linkAt(index).controls.image;

    control.setValue(null);
    control.markAsDirty();
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
      email: values.email.trim(),
      phones: values.phones
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0),
      links: values.links
        .map(link => ({
          image: link.image?.trim() || null,
          text: link.text.trim(),
          url: link.url.trim()
        }))
        .filter(
          link => link.text.length > 0 && link.url.length > 0
        )
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

    this.setPhones(about.phones ?? []);
    this.setLinks(about.links ?? []);

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

    this.setPhones([]);
    this.setLinks([]);

    this.formError.set(null);
    this.serverFieldErrors.set({});
  }

  private setPhones(phones: string[]): void {
    this.phones.clear();

    phones.forEach(phone => {
      this.phones.push(this.phoneControl(phone));
    });
  }

  private setLinks(links: AboutLink[]): void {
    this.links.clear();

    links.forEach(link => {
      this.links.push(this.linkGroup(link));
    });
  }

  private phoneControl(value = ''): FormControl<string> {
    return new FormControl(value, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(40)
      ]
    });
  }

  private linkGroup(link?: AboutLink): LinkGroup {
    return new FormGroup({
      image: new FormControl<string | null>(
        link?.image ?? null,
        {
          validators: [Validators.maxLength(500)]
        }
      ),

      text: new FormControl(link?.text ?? '', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(120)
        ]
      }),

      url: new FormControl(link?.url ?? '', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^(https?:\/\/|\/\/)/i),
          Validators.maxLength(500)
        ]
      })
    });
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
