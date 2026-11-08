import {
  Component,
  inject,
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

import { AboutPublic } from '../../../../core/models/about.model';

import { AboutService } from '../../../../core/services/about.service';
import {
  ContactMessageService
} from '../../../../core/services/contact-message.service';

type ContactControlName =
  | 'fullName'
  | 'email'
  | 'subject'
  | 'message';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],

  template: `
    <div class="app-container space-y-10 py-10 sm:py-14">
      <header class="max-w-3xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'nav.contact' | translate }}
        </p>

        <h1
          class="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          {{ 'publicPages.contact.title' | translate }}
        </h1>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.contact.subtitle' | translate }}
        </p>
      </header>

      <div class="grid items-start gap-8 lg:grid-cols-2">
        <!-- Coordonnées -->
        <aside
          class="space-y-5 rounded-2xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-6 sm:p-8"
        >
          <h2 class="text-lg font-bold">
            {{ 'publicPages.contact.infoTitle' | translate }}
          </h2>

          <p class="text-sm leading-7 app-muted">
            {{
              about()?.description ||
                ('publicPages.contact.infoText' | translate)
            }}
          </p>

          <div class="space-y-3">
            @if (about()?.email; as email) {
              <a
                [href]="'mailto:' + email"
                class="flex items-start gap-3 rounded-xl border
                       border-[var(--app-border)] p-4 transition
                       hover:border-[var(--p-primary-color)]"
              >
                <span
                  class="inline-grid h-10 w-10 shrink-0 place-items-center
                         rounded-lg bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-envelope"
                    aria-hidden="true"
                  ></i>
                </span>

                <span class="min-w-0">
                  <span
                    class="block text-xs font-bold uppercase
                           tracking-wide text-[var(--app-text-muted)]"
                  >
                    {{ 'publicPages.contact.emailLabel' | translate }}
                  </span>

                  <span class="mt-0.5 block truncate text-sm font-semibold">
                    {{ email }}
                  </span>
                </span>
              </a>
            }

            @if (about()?.location; as location) {
              <div
                class="flex items-start gap-3 rounded-xl border
                       border-[var(--app-border)] p-4"
              >
                <span
                  class="inline-grid h-10 w-10 shrink-0 place-items-center
                         rounded-lg bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-map-marker"
                    aria-hidden="true"
                  ></i>
                </span>

                <span>
                  <span
                    class="block text-xs font-bold uppercase
                           tracking-wide text-[var(--app-text-muted)]"
                  >
                    {{ 'publicPages.contact.locationLabel' | translate }}
                  </span>

                  <span class="mt-0.5 block text-sm font-semibold">
                    {{ location }}
                  </span>
                </span>
              </div>
            }

            @if (about()?.availability; as availability) {
              <div
                class="flex items-start gap-3 rounded-xl border
                       border-[var(--app-border)] p-4"
              >
                <span
                  class="inline-grid h-10 w-10 shrink-0 place-items-center
                         rounded-lg bg-[var(--app-surface-muted)]
                         text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-check-circle"
                    aria-hidden="true"
                  ></i>
                </span>

                <span>
                  <span
                    class="block text-xs font-bold uppercase
                           tracking-wide text-[var(--app-text-muted)]"
                  >
                    {{ 'publicPages.contact.availabilityLabel' | translate }}
                  </span>

                  <span class="mt-0.5 block text-sm font-semibold">
                    {{ availability }}
                  </span>
                </span>
              </div>
            }

            <div
              class="flex items-start gap-3 rounded-xl border
                     border-[var(--app-border)] p-4"
            >
              <span
                class="inline-grid h-10 w-10 shrink-0 place-items-center
                       rounded-lg bg-[var(--app-surface-muted)]
                       text-[var(--p-primary-color)]"
              >
                <i
                  class="pi pi-clock"
                  aria-hidden="true"
                ></i>
              </span>

              <span>
                <span
                  class="block text-xs font-bold uppercase
                         tracking-wide text-[var(--app-text-muted)]"
                >
                  {{ 'publicPages.contact.responseLabel' | translate }}
                </span>

                <span class="mt-0.5 block text-sm font-semibold">
                  {{ 'publicPages.contact.responseTime' | translate }}
                </span>
              </span>
            </div>
          </div>
        </aside>

        <!-- Formulaire -->
        <section
          class="rounded-2xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-6 sm:p-8"
        >
          @if (success()) {
            <div class="py-8 text-center" role="status">
              <span
                class="inline-grid h-14 w-14 place-items-center
                       rounded-full bg-emerald-100 text-emerald-700
                       dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <i
                  class="pi pi-check text-2xl"
                  aria-hidden="true"
                ></i>
              </span>

              <h2 class="mt-5 text-xl font-bold">
                {{ 'publicPages.contact.successTitle' | translate }}
              </h2>

              <p class="mx-auto mt-2 max-w-md text-sm leading-7 app-muted">
                {{ 'publicPages.contact.successText' | translate }}
              </p>

              <button
                type="button"
                class="mt-6 inline-flex min-h-10 items-center gap-2
                       rounded-xl border border-[var(--app-border)]
                       px-4 py-2 text-sm font-semibold transition
                       hover:border-[var(--p-primary-color)]
                       hover:text-[var(--p-primary-color)]"
                (click)="success.set(false)"
              >
                <i
                  class="pi pi-pencil text-xs"
                  aria-hidden="true"
                ></i>

                {{ 'publicPages.contact.sendAnother' | translate }}
              </button>
            </div>
          } @else {
            <h2 class="text-lg font-bold">
              {{ 'publicPages.contact.formTitle' | translate }}
            </h2>

            <p class="mt-2 text-sm leading-6 app-muted">
              {{ 'publicPages.contact.formText' | translate }}
            </p>

            <form
              class="mt-6 space-y-5"
              [formGroup]="form"
              (ngSubmit)="submit()"
              novalidate
            >
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    class="app-label"
                    for="contact-full-name"
                  >
                    {{ 'publicPages.contact.fullName' | translate }}
                  </label>

                  <input
                    id="contact-full-name"
                    type="text"
                    class="app-control w-full"
                    formControlName="fullName"
                    autocomplete="name"
                    [style.borderColor]="
                      isInvalid('fullName') ? '#ef4444' : null
                    "
                  />

                  @if (isInvalid('fullName')) {
                    <p class="mt-1.5 text-xs text-red-600">
                      {{ 'publicPages.contact.errors.fullName' | translate }}
                    </p>
                  }
                </div>

                <div>
                  <label
                    class="app-label"
                    for="contact-email"
                  >
                    {{ 'publicPages.contact.email' | translate }}
                  </label>

                  <input
                    id="contact-email"
                    type="email"
                    class="app-control w-full"
                    formControlName="email"
                    autocomplete="email"
                    [style.borderColor]="
                      isInvalid('email') ? '#ef4444' : null
                    "
                  />

                  @if (isInvalid('email')) {
                    <p class="mt-1.5 text-xs text-red-600">
                      {{ 'publicPages.contact.errors.email' | translate }}
                    </p>
                  }
                </div>
              </div>

              <div>
                <label
                  class="app-label"
                  for="contact-subject"
                >
                  {{ 'publicPages.contact.subject' | translate }}
                </label>

                <input
                  id="contact-subject"
                  type="text"
                  class="app-control w-full"
                  formControlName="subject"
                  [style.borderColor]="
                    isInvalid('subject') ? '#ef4444' : null
                  "
                />

                @if (isInvalid('subject')) {
                  <p class="mt-1.5 text-xs text-red-600">
                    {{ 'publicPages.contact.errors.subject' | translate }}
                  </p>
                }
              </div>

              <div>
                <label
                  class="app-label"
                  for="contact-message"
                >
                  {{ 'publicPages.contact.message' | translate }}
                </label>

                <textarea
                  id="contact-message"
                  rows="7"
                  class="app-control w-full py-2"
                  formControlName="message"
                  [style.borderColor]="
                    isInvalid('message') ? '#ef4444' : null
                  "
                ></textarea>

                @if (isInvalid('message')) {
                  <p class="mt-1.5 text-xs text-red-600">
                    {{ 'publicPages.contact.errors.message' | translate }}
                  </p>
                }
              </div>

              <button
                type="submit"
                class="inline-flex min-h-11 w-full items-center justify-center
                       gap-2 rounded-xl bg-[var(--p-primary-color)] px-5
                       py-3 text-sm font-semibold
                       text-[var(--p-primary-inverse-color)]
                       transition hover:bg-[var(--p-primary-hover-color)]
                       disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="submitting()"
              >
                @if (submitting()) {
                  <i
                    class="pi pi-spin pi-spinner text-xs"
                    aria-hidden="true"
                  ></i>
                } @else {
                  <i
                    class="pi pi-send text-xs rtl:rotate-180"
                    aria-hidden="true"
                  ></i>
                }

                {{ 'publicPages.contact.submit' | translate }}
              </button>
            </form>
          }
        </section>
      </div>
    </div>
  `
})
export class ContactComponent {
  private readonly contactMessageService = inject(
    ContactMessageService
  );

  private readonly aboutService = inject(AboutService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly about = signal<AboutPublic | null>(null);

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

  constructor() {
    this.aboutService.getPublicAbout().subscribe({
      next: about => this.about.set(about),
      error: () => this.about.set(null)
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitting.set(true);

    this.contactMessageService
      .createContactMessage({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        subject: value.subject.trim(),
        message: value.message.trim()
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
            summary: this.translate.instant(
              'common.error'
            ),
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
