import {
  Component,
  inject,
  input,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { MessageService } from 'primeng/api';

import {
  AboutPublic
} from '../../../../core/models/about.model';

import {
  resolveMediaUrl
} from '../../../../core/http/media-url';

import {
  ContactMessageService
} from '../../../../core/services/contact-message.service';

type ContactControlName =
  | 'fullName'
  | 'email'
  | 'subject'
  | 'message';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],

  template: `
    <section id="contact" class="scroll-mt-32 py-4">
      <div
        class="grid items-start gap-10
               lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]
               lg:gap-14 xl:gap-20"
      >
        <!-- Présentation et coordonnées -->
        <div class="min-w-0 py-3 lg:py-6">
          <div class="flex items-center gap-3">
            <span
              class="h-px w-9 bg-[var(--p-primary-color)]"
              aria-hidden="true"
            ></span>

            <p
              class="text-xs font-bold uppercase tracking-[0.2em]
                     text-[var(--p-primary-color)]"
            >
              {{ 'home.contactEyebrow' | translate }}
            </p>
          </div>

          <h2
            class="mt-4 max-w-lg text-balance text-3xl font-bold
                   leading-tight tracking-[-0.045em]
                   sm:text-4xl lg:text-[2.65rem]"
          >
            {{ 'home.contactTitle' | translate }}
          </h2>

          <p
            class="mt-5 max-w-lg text-base leading-8
                   text-[var(--app-text-muted)]"
          >
            {{ 'home.contactText' | translate }}
          </p>

          <!-- Disponibilité -->
          @if (about()?.availability; as availability) {
            <div
              class="mt-6 inline-flex items-center gap-2.5
                     rounded-full border border-emerald-500/20
                     bg-emerald-500/10 px-3.5 py-2
                     text-xs font-semibold text-emerald-700
                     dark:text-emerald-300"
            >
              <span
                class="h-2 w-2 shrink-0 rounded-full
                       bg-emerald-500"
                aria-hidden="true"
              ></span>

              <span>{{ availability }}</span>
            </div>
          }

          <!-- Coordonnées -->
          <div class="mt-8 space-y-3">
            @if (about()?.email; as email) {
              <a
                [href]="'mailto:' + email"
                class="contact-link"
              >
                <span class="contact-icon" aria-hidden="true">
                  <i class="pi pi-envelope text-lg"></i>
                </span>

                <span class="min-w-0 flex-1">
                  <span class="contact-label">
                    {{ 'publicPages.contact.emailLabel' | translate }}
                  </span>

                  <span class="contact-value break-all">
                    {{ email }}
                  </span>
                </span>

                <i
                  class="pi pi-arrow-up-right contact-arrow
                         rtl:-rotate-90"
                  aria-hidden="true"
                ></i>
              </a>
            }

            <!-- Téléphones -->
            @for (
              phone of about()?.phones ?? [];
              track $index
            ) {
              <a
                [href]="phoneHref(phone)"
                class="contact-link"
              >
                <span class="contact-icon" aria-hidden="true">
                  <i class="pi pi-phone text-lg"></i>
                </span>

                <span class="min-w-0 flex-1">
                  <span class="contact-label">
                    {{
                      'publicPages.contact.phoneLabel'
                        | translate
                    }}
                  </span>

                  <span class="contact-value">
                    <bdi dir="ltr">{{ phone }}</bdi>
                  </span>
                </span>

                <i
                  class="pi pi-arrow-up-right contact-arrow
                         rtl:-rotate-90"
                  aria-hidden="true"
                ></i>
              </a>
            }

            <!-- Localisation -->
            @if (about()?.location; as location) {
              <div class="contact-link">
                <span class="contact-icon" aria-hidden="true">
                  <i class="pi pi-map-marker text-lg"></i>
                </span>

                <span class="min-w-0 flex-1">
                  <span class="contact-label">
                    {{
                      'publicPages.contact.locationLabel'
                        | translate
                    }}
                  </span>

                  <span class="contact-value break-words">
                    {{ location }}
                  </span>
                </span>
              </div>
            }
          </div>

          <!-- Réseaux sociaux -->
          @if ((about()?.links?.length ?? 0) > 0) {
            <div
              class="mt-8 border-t border-[var(--app-border)] pt-6"
            >
              <p
                class="text-xs font-semibold
                       text-[var(--app-text-muted)]"
              >
                {{
                  'publicPages.contact.socialTitle' | translate
                }}
              </p>

              <div class="mt-3 flex flex-wrap gap-3">
                @for (
                  link of about()?.links ?? [];
                  track $index
                ) {
                  <a
                    [href]="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="social-link"
                    [attr.aria-label]="
                      link.text + ' — ' +
                      ('publicPages.contact.opensNewTab'
                        | translate)
                    "
                  >
                    @if (
                      resolveLinkImage(link.imageUrl);
                      as imageUrl
                    ) {
                      <img
                        [src]="imageUrl"
                        [alt]="link.text"
                        class="h-5 w-5 rounded object-contain"
                        loading="lazy"
                      />
                    } @else {
                      <i
                        class="pi pi-link text-lg"
                        aria-hidden="true"
                      ></i>
                    }

                    <span>{{ link.text }}</span>

                    <i
                      class="pi pi-arrow-up-right text-[0.65rem]
                             opacity-60 rtl:-rotate-90"
                      aria-hidden="true"
                    ></i>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Délai de réponse -->
          <div
            class="mt-7 flex items-center gap-2.5 text-xs
                   leading-6 text-[var(--app-text-muted)]"
          >
            <i
              class="pi pi-clock text-sm
                     text-[var(--p-primary-color)]"
              aria-hidden="true"
            ></i>

            <span>
              {{ 'publicPages.contact.responseLabel' | translate }}
              :
              {{ 'publicPages.contact.responseTime' | translate }}
            </span>
          </div>
        </div>

        <!-- Formulaire -->
        <div class="contact-form-card">
          <div class="form-accent" aria-hidden="true"></div>

          @if (success()) {
            <div
              class="flex min-h-[32rem] flex-col items-center
                     justify-center px-2 py-10 text-center"
              role="status"
            >
              <span
                class="inline-grid h-20 w-20 place-items-center
                       rounded-3xl bg-emerald-500/10
                       text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              >
                <i class="pi pi-check-circle text-4xl"></i>
              </span>

              <h3 class="mt-6 text-2xl font-bold tracking-tight">
                {{ 'publicPages.contact.successTitle' | translate }}
              </h3>

              <p
                class="mt-3 max-w-sm text-sm leading-7
                       text-[var(--app-text-muted)]"
              >
                {{ 'publicPages.contact.successText' | translate }}
              </p>

              <button
                type="button"
                class="secondary-button mt-7"
                (click)="success.set(false)"
              >
                <i
                  class="pi pi-pencil text-sm"
                  aria-hidden="true"
                ></i>

                {{ 'publicPages.contact.sendAnother' | translate }}
              </button>
            </div>
          } @else {
            <!-- En-tête du formulaire -->
            <div class="flex items-start gap-4">
              <span
                class="inline-grid h-12 w-12 shrink-0
                       place-items-center rounded-2xl
                       bg-[var(--app-surface-muted)]
                       text-[var(--p-primary-color)]"
                aria-hidden="true"
              >
                <i class="pi pi-send text-lg rtl:rotate-180"></i>
              </span>

              <div>
                <h3 class="text-xl font-bold tracking-[-0.025em]">
                  {{ 'publicPages.contact.formTitle' | translate }}
                </h3>

                <p
                  class="mt-1.5 text-sm leading-6
                         text-[var(--app-text-muted)]"
                >
                  {{ 'publicPages.contact.formText' | translate }}
                </p>
              </div>
            </div>

            <form
              class="mt-7"
              [formGroup]="form"
              (ngSubmit)="submit()"
              novalidate
            >
              <fieldset
                class="min-w-0 space-y-5"
                [disabled]="submitting()"
              >
                <!-- Nom et email -->
                <div class="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      class="field-label"
                      for="contact-full-name"
                    >
                      {{ 'publicPages.contact.fullName' | translate }}
                    </label>

                    <div class="input-wrapper">
                      <i
                        class="pi pi-user input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="contact-full-name"
                        type="text"
                        class="contact-input"
                        formControlName="fullName"
                        autocomplete="name"
                        maxlength="120"
                        [class.field-invalid]="isInvalid('fullName')"
                        [attr.aria-invalid]="isInvalid('fullName')"
                        [attr.aria-describedby]="
                          isInvalid('fullName')
                            ? 'contact-full-name-error'
                            : null
                        "
                      />
                    </div>

                    @if (isInvalid('fullName')) {
                      <p
                        id="contact-full-name-error"
                        class="field-error"
                      >
                        {{
                          'publicPages.contact.errors.fullName'
                            | translate
                        }}
                      </p>
                    }
                  </div>

                  <div>
                    <label
                      class="field-label"
                      for="contact-email"
                    >
                      {{ 'publicPages.contact.email' | translate }}
                    </label>

                    <div class="input-wrapper">
                      <i
                        class="pi pi-envelope input-icon"
                        aria-hidden="true"
                      ></i>

                      <input
                        id="contact-email"
                        type="email"
                        class="contact-input"
                        formControlName="email"
                        autocomplete="email"
                        inputmode="email"
                        maxlength="160"
                        [class.field-invalid]="isInvalid('email')"
                        [attr.aria-invalid]="isInvalid('email')"
                        [attr.aria-describedby]="
                          isInvalid('email')
                            ? 'contact-email-error'
                            : null
                        "
                      />
                    </div>

                    @if (isInvalid('email')) {
                      <p
                        id="contact-email-error"
                        class="field-error"
                      >
                        {{
                          'publicPages.contact.errors.email'
                            | translate
                        }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Objet -->
                <div>
                  <label
                    class="field-label"
                    for="contact-subject"
                  >
                    {{ 'publicPages.contact.subject' | translate }}
                  </label>

                  <div class="input-wrapper">
                    <i
                      class="pi pi-tag input-icon"
                      aria-hidden="true"
                    ></i>

                    <input
                      id="contact-subject"
                      type="text"
                      class="contact-input"
                      formControlName="subject"
                      maxlength="160"
                      [class.field-invalid]="isInvalid('subject')"
                      [attr.aria-invalid]="isInvalid('subject')"
                      [attr.aria-describedby]="
                        isInvalid('subject')
                          ? 'contact-subject-error'
                          : null
                      "
                    />
                  </div>

                  @if (isInvalid('subject')) {
                    <p
                      id="contact-subject-error"
                      class="field-error"
                    >
                      {{
                        'publicPages.contact.errors.subject'
                          | translate
                      }}
                    </p>
                  }
                </div>

                <!-- Message -->
                <div>
                  <label
                    class="field-label"
                    for="contact-message"
                  >
                    {{ 'publicPages.contact.message' | translate }}
                  </label>

                  <textarea
                    id="contact-message"
                    rows="6"
                    class="contact-textarea"
                    formControlName="message"
                    maxlength="3000"
                    [class.field-invalid]="isInvalid('message')"
                    [attr.aria-invalid]="isInvalid('message')"
                    [attr.aria-describedby]="
                      isInvalid('message')
                        ? 'contact-message-error'
                        : null
                    "
                  ></textarea>

                  <div
                    class="mt-2 flex items-start
                           justify-between gap-3"
                  >
                    <div>
                      @if (isInvalid('message')) {
                        <p
                          id="contact-message-error"
                          class="field-error message-error"
                        >
                          {{
                            'publicPages.contact.errors.message'
                              | translate
                          }}
                        </p>
                      }
                    </div>

                    <span
                      class="shrink-0 text-[0.68rem]
                             text-[var(--app-text-muted)]"
                    >
                      {{ form.controls.message.value.length }} / 3000
                    </span>
                  </div>
                </div>

                <!-- Bouton compact aligné à droite -->
                <div class="flex justify-end pt-2">
                  <button
                    type="submit"
                    class="submit-button"
                    [disabled]="submitting()"
                  >
                    @if (submitting()) {
                      <i
                        class="pi pi-spin pi-spinner text-sm"
                        aria-hidden="true"
                      ></i>
                    } @else {
                      <i
                        class="pi pi-send text-sm rtl:rotate-180"
                        aria-hidden="true"
                      ></i>
                    }

                    <span>
                      {{ 'publicPages.contact.submit' | translate }}
                    </span>
                  </button>
                </div>
              </fieldset>
            </form>
          }
        </div>
      </div>
    </section>
  `,

  styles: `
    :host {
      display: block;
    }

    .contact-link {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 1rem;
      border-radius: 1rem;
      padding: 0.875rem;
      color: var(--app-text);
      transition:
        background-color 180ms ease,
        transform 180ms ease;
    }

    a.contact-link:hover {
      background: var(--app-surface-muted);
      transform: translateY(-2px);
    }

    .contact-icon {
      display: inline-grid;
      width: 3rem;
      height: 3rem;
      flex-shrink: 0;
      place-items: center;
      border: 1px solid var(--app-border);
      border-radius: 1rem;
      background: var(--app-surface);
      color: var(--p-primary-color);
      box-shadow: 0 5px 14px -12px rgb(15 23 42 / 0.35);
      transition: border-color 180ms ease;
    }

    a.contact-link:hover .contact-icon {
      border-color: var(--p-primary-color);
    }

    .contact-label {
      display: block;
      color: var(--app-text-muted);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .contact-value {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.6;
    }

    .contact-arrow {
      flex-shrink: 0;
      color: var(--app-text-muted);
      font-size: 0.75rem;
      transition: color 180ms ease;
    }

    a.contact-link:hover .contact-arrow {
      color: var(--p-primary-color);
    }

    .social-link {
      display: inline-flex;
      min-height: 2.875rem;
      align-items: center;
      gap: 0.625rem;
      border: 1px solid var(--app-border);
      border-radius: 0.875rem;
      background: var(--app-surface);
      padding: 0.75rem 1rem;
      color: var(--app-text);
      font-size: 0.8125rem;
      font-weight: 600;
      transition:
        border-color 180ms ease,
        color 180ms ease,
        transform 180ms ease;
    }

    .social-link:hover {
      transform: translateY(-2px);
      border-color: var(--p-primary-color);
      color: var(--p-primary-color);
    }

    .contact-form-card {
      position: relative;
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 1.75rem;
      background: var(--app-surface);
      padding: 1.5rem;
      box-shadow: 0 24px 70px -50px rgb(15 23 42 / 0.4);
    }

    .form-accent {
      position: absolute;
      inset-block-start: 0;
      inset-inline: 2rem;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        var(--p-primary-color),
        transparent
      );
      opacity: 0.7;
    }

    .field-label {
      display: block;
      margin-bottom: 0.625rem;
      color: var(--app-text);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      inset-inline-start: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--app-text-muted);
      font-size: 0.875rem;
      pointer-events: none;
    }

    .contact-input,
    .contact-textarea {
      display: block;
      width: 100%;
      border: 1px solid var(--app-border);
      border-radius: 0.875rem;
      background: var(--app-surface);
      color: var(--app-text);
      font-size: 0.875rem;
      outline: none;
      transition:
        border-color 180ms ease,
        box-shadow 180ms ease;
    }

    .contact-input {
      min-height: 3rem;
      padding-block: 0.75rem;
      padding-inline-start: 2.5rem;
      padding-inline-end: 0.875rem;
    }

    .contact-textarea {
      min-height: 10rem;
      resize: vertical;
      padding: 0.875rem 1rem;
      line-height: 1.8;
    }

    .contact-input:hover,
    .contact-textarea:hover {
      border-color: var(--app-text-muted);
    }

    .contact-input:focus,
    .contact-textarea:focus {
      border-color: var(--p-primary-color);
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--p-primary-color) 12%, transparent);
    }

    .field-invalid {
      border-color: #ef4444;
    }

    .field-error {
      margin-top: 0.375rem;
      color: #dc2626;
      font-size: 0.75rem;
      line-height: 1.5;
    }

    .message-error {
      margin-top: 0;
    }

    .submit-button {
      display: inline-flex;
      width: auto;
      min-height: 2.75rem;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;

      border: 1px solid transparent;
      border-radius: 0.75rem;

      background: var(--p-primary-color);
      padding: 0.75rem 1.25rem;
      color: var(--p-primary-inverse-color);

      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.5;
      text-align: center;

      cursor: pointer;

      transition:
        background-color 180ms ease,
        transform 180ms ease;
    }

    .submit-button:hover:not(:disabled) {
      background: var(--p-primary-hover-color);
      transform: translateY(-1px);
    }

    .secondary-button {
      display: inline-flex;
      min-height: 2.875rem;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      border: 1px solid var(--app-border);
      border-radius: 0.875rem;
      background: var(--app-surface);
      padding: 0.75rem 1rem;
      color: var(--app-text);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        border-color 180ms ease,
        color 180ms ease;
    }

    .secondary-button:hover {
      border-color: var(--p-primary-color);
      color: var(--p-primary-color);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    a:focus-visible,
    button:focus-visible {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 4px;
    }

    @media (min-width: 640px) {
      .contact-form-card {
        padding: 2rem;
      }

      .contact-value {
        font-size: 0.9375rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .contact-link,
      .contact-icon,
      .contact-arrow,
      .social-link,
      .contact-input,
      .contact-textarea,
      .submit-button,
      .secondary-button {
        transition: none;
      }

      a.contact-link:hover,
      .social-link:hover,
      .submit-button:hover:not(:disabled) {
        transform: none;
      }
    }
  `
})
export class ContactSectionComponent {
  private readonly contactMessageService = inject(
    ContactMessageService
  );

  private readonly formBuilder = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly about = input<AboutPublic | null>(null);

  readonly submitting = signal(false);
  readonly success = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    fullName: [
      '',
      [
        Validators.required,
        Validators.maxLength(120)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(160)
      ]
    ],

    subject: [
      '',
      [
        Validators.required,
        Validators.maxLength(160)
      ]
    ],

    message: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(3000)
      ]
    ]
  });

  phoneHref(phone: string): string {
    const normalized = phone.replace(/[^\d+]/g, '');

    return normalized ? `tel:${normalized}` : 'tel:';
  }

  resolveLinkImage(
    imageUrl: string | null | undefined
  ): string | null {
    return resolveMediaUrl(imageUrl);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    const rawValue = this.form.getRawValue();

    this.form.patchValue({
      fullName: rawValue.fullName.trim(),
      email: rawValue.email.trim(),
      subject: rawValue.subject.trim(),
      message: rawValue.message.trim()
    });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitting.set(true);

    this.contactMessageService
      .createContactMessage({
        fullName: value.fullName,
        email: value.email,
        subject: value.subject,
        message: value.message
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.success.set(true);

          this.form.reset({
            fullName: '',
            email: '',
            subject: '',
            message: ''
          });

          this.messages.add({
            severity: 'success',
            summary: this.translate.instant(
              'publicPages.contact.successTitle'
            ),
            detail: this.translate.instant(
              'publicPages.contact.successText'
            ),
            life: 5000
          });
        },

        error: () => {
          this.submitting.set(false);

          this.messages.add({
            severity: 'error',
            summary: this.translate.instant('common.error'),
            detail: this.translate.instant(
              'publicPages.contact.error'
            ),
            life: 5000
          });
        }
      });
  }

  isInvalid(controlName: ContactControlName): boolean {
    const control = this.form.controls[controlName];

    return (
      control.invalid &&
      (control.touched || control.dirty)
    );
  }
}