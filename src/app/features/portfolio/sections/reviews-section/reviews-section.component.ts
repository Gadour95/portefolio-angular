import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild
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
  resolveMediaUrl
} from '../../../../core/http/media-url';

import {
  Review
} from '../../../../core/models/review.model';

import {
  LanguageService
} from '../../../../core/services/language.service';

import {
  ReviewService
} from '../../../../core/services/review.service';

type ReviewControlName =
  | 'fullName'
  | 'jobTitle'
  | 'rating'
  | 'description';

@Component({
  selector: 'app-reviews-section',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],

  template: `
    <section id="reviews" class="scroll-mt-32 py-4">
      <!-- En-tête -->
      <div
        class="flex flex-col justify-between gap-6
               sm:flex-row sm:items-end"
      >
        <div class="max-w-2xl">
          <div class="flex items-center gap-3">
            <span
              class="h-px w-9 bg-[var(--p-primary-color)]"
              aria-hidden="true"
            ></span>

            <p
              class="text-xs font-bold uppercase tracking-[0.2em]
                     text-[var(--p-primary-color)]"
            >
              {{ 'home.reviewsEyebrow' | translate }}
            </p>
          </div>

          <h2
            class="mt-4 text-3xl font-bold tracking-[-0.045em]
                   sm:text-4xl"
          >
            {{ 'publicPages.reviews.title' | translate }}
          </h2>

          <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
            {{ 'publicPages.reviews.subtitle' | translate }}
          </p>
        </div>

        <button
          type="button"
          class="primary-button shrink-0 self-start sm:self-auto"
          aria-haspopup="dialog"
          (click)="openModal()"
        >
          <i class="pi pi-pencil text-sm" aria-hidden="true"></i>

          {{ 'publicPages.reviews.formTitle' | translate }}

          <i
            class="pi pi-arrow-up-right text-xs rtl:-rotate-90"
            aria-hidden="true"
          ></i>
        </button>
      </div>

      <!-- Avis -->
      <div class="mt-8" [attr.aria-busy]="loading()">
        @if (loading()) {
          <div
            class="grid gap-4 sm:grid-cols-2 lg:gap-5"
            aria-hidden="true"
          >
            @for (item of [1, 2, 3, 4]; track item) {
              <div
                class="h-56 animate-pulse rounded-3xl
                       bg-[var(--app-surface-muted)]"
              ></div>
            }
          </div>
        } @else if (!reviews().length) {
          <div
            class="rounded-3xl border border-dashed
                   border-[var(--app-border)] px-6 py-14 text-center"
          >
            <span
              class="mx-auto grid h-14 w-14 place-items-center
                     rounded-2xl bg-[var(--app-surface-muted)]
                     text-[var(--p-primary-color)]"
              aria-hidden="true"
            >
              <i class="pi pi-comments text-2xl"></i>
            </span>

            <p class="mt-4 text-sm text-[var(--app-text-muted)]">
              {{ 'publicPages.reviews.empty' | translate }}
            </p>
          </div>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2 lg:gap-5">
            @for (review of reviews(); track review.id) {
              <article class="review-card">
                <!-- Identité en haut -->
                <div class="relative flex items-start gap-3">
                  @if (reviewImage(review); as image) {
                    <img
                      [src]="image"
                      [alt]="review.fullName"
                      class="h-12 w-12 shrink-0 rounded-2xl
                             object-cover"
                      loading="lazy"
                    />
                  } @else {
                    <span
                      class="inline-grid h-12 w-12 shrink-0
                             place-items-center rounded-2xl
                             bg-[var(--app-surface-muted)]
                             text-sm font-bold
                             text-[var(--p-primary-color)]"
                      aria-hidden="true"
                    >
                      {{ initials(review.fullName) }}
                    </span>
                  }

                  <div class="min-w-0 flex-1 pt-0.5">
                    <h3
                      class="break-words text-sm font-bold
                             leading-6 sm:text-base"
                    >
                      {{ review.fullName }}
                    </h3>

                    @if (review.jobTitle) {
                      <p
                        class="mt-0.5 break-words text-xs leading-5
                               text-[var(--app-text-muted)]"
                      >
                        {{ review.jobTitle }}
                      </p>
                    }
                  </div>

                  <span
                    class="inline-grid h-8 w-8 shrink-0
                           place-items-center rounded-xl
                           bg-[var(--app-surface-muted)]
                           text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  >
                    <i class="pi pi-comment text-xs"></i>
                  </span>
                </div>

                <!-- Note et date -->
                <div
                  class="relative mt-5 flex flex-wrap items-center
                         justify-between gap-2"
                >
                  <div
                    class="flex items-center gap-1"
                    [attr.aria-label]="
                      ('publicPages.reviews.rating' | translate) +
                      ': ' + review.rating + '/5'
                    "
                  >
                    @for (star of stars; track star) {
                      <i
                        class="pi pi-star-fill text-xs"
                        [style.color]="
                          star <= review.rating
                            ? '#f59e0b'
                            : 'var(--app-border)'
                        "
                        aria-hidden="true"
                      ></i>
                    }
                  </div>

                  <time
                    class="inline-flex items-center gap-1.5
                           text-[0.68rem]
                           text-[var(--app-text-muted)]"
                    [attr.datetime]="review.createdAt"
                  >
                    <i
                      class="pi pi-calendar text-[0.65rem]"
                      aria-hidden="true"
                    ></i>

                    {{ formatDate(review.createdAt) }}
                  </time>
                </div>

                <!-- Texte de l'avis en bas -->
                <blockquote
                  class="relative mt-4 border-t
                         border-[var(--app-border)] pt-4"
                >
                  <p
                    class="whitespace-pre-line break-words
                           text-sm leading-7
                           text-[var(--app-text-muted)]"
                  >
                    {{ review.description }}
                  </p>
                </blockquote>
              </article>
            }
          </div>
        }
      </div>
    </section>

    <!-- Modale -->
    <dialog
      #reviewDialog
      class="review-dialog"
      aria-labelledby="review-dialog-title"
      aria-describedby="review-dialog-description"
      (click)="onBackdropClick($event)"
      (cancel)="onDialogCancel($event)"
    >
      <div class="modal-content">
        <!-- En-tête -->
        <div class="modal-header">
          <div class="flex items-start gap-3">
            <span
              class="inline-grid h-12 w-12 shrink-0
                     place-items-center rounded-2xl
                     bg-[var(--app-surface-muted)]
                     text-[var(--p-primary-color)]"
              aria-hidden="true"
            >
              <i class="pi pi-pencil text-lg"></i>
            </span>

            <div class="min-w-0">
              <h3
                id="review-dialog-title"
                class="text-lg font-bold tracking-tight sm:text-xl"
              >
                {{ 'publicPages.reviews.formTitle' | translate }}
              </h3>

              <p
                id="review-dialog-description"
                class="mt-1 text-sm leading-6
                       text-[var(--app-text-muted)]"
              >
                {{ 'publicPages.reviews.formText' | translate }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="close-button"
            [disabled]="submitting()"
            [attr.aria-label]="'common.close' | translate"
            (click)="closeModal()"
          >
            <i class="pi pi-times text-sm" aria-hidden="true"></i>
          </button>
        </div>

        <form
          class="modal-form"
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
        >
          <fieldset
            class="min-w-0 space-y-5"
            [disabled]="submitting()"
          >
            <!-- Nom et fonction -->
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="field-label" for="review-full-name">
                  {{ 'publicPages.reviews.fullName' | translate }}
                </label>

                <div class="input-wrapper">
                  <i
                    class="pi pi-user field-icon"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="review-full-name"
                    type="text"
                    class="review-input"
                    formControlName="fullName"
                    autocomplete="name"
                    maxlength="120"
                    [class.field-invalid]="isInvalid('fullName')"
                    [attr.aria-invalid]="isInvalid('fullName')"
                    [attr.aria-describedby]="
                      isInvalid('fullName')
                        ? 'review-full-name-error'
                        : null
                    "
                  />
                </div>

                @if (isInvalid('fullName')) {
                  <p id="review-full-name-error" class="field-error">
                    {{
                      'publicPages.reviews.errors.fullName'
                        | translate
                    }}
                  </p>
                }
              </div>

              <div>
                <label class="field-label" for="review-job-title">
                  {{ 'publicPages.reviews.jobTitle' | translate }}
                </label>

                <div class="input-wrapper">
                  <i
                    class="pi pi-briefcase field-icon"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="review-job-title"
                    type="text"
                    class="review-input"
                    formControlName="jobTitle"
                    autocomplete="organization-title"
                    maxlength="120"
                    [class.field-invalid]="isInvalid('jobTitle')"
                    [attr.aria-invalid]="isInvalid('jobTitle')"
                    [attr.aria-describedby]="
                      isInvalid('jobTitle')
                        ? 'review-job-title-error'
                        : null
                    "
                  />
                </div>

                @if (isInvalid('jobTitle')) {
                  <p id="review-job-title-error" class="field-error">
                    {{
                      'publicPages.reviews.errors.jobTitle'
                        | translate
                    }}
                  </p>
                }
              </div>
            </div>

            <!-- Note -->
            <div class="rating-panel">
              <span id="review-rating-label" class="field-label">
                {{ 'publicPages.reviews.rating' | translate }}
              </span>

              <div
                class="flex flex-wrap items-center gap-3"
                role="group"
                aria-labelledby="review-rating-label"
              >
                <div class="flex items-center gap-1">
                  @for (star of stars; track star) {
                    <button
                      type="button"
                      class="rating-button"
                      [attr.aria-label]="star + ' / 5'"
                      [attr.aria-pressed]="ratingValue() === star"
                      (click)="setRating(star)"
                    >
                      <i
                        class="pi pi-star-fill text-2xl"
                        [style.color]="
                          star <= ratingValue()
                            ? '#f59e0b'
                            : 'var(--app-border)'
                        "
                        aria-hidden="true"
                      ></i>
                    </button>
                  }
                </div>

                <span
                  class="text-sm font-semibold
                         text-[var(--app-text-muted)]"
                  aria-live="polite"
                >
                  {{ ratingValue() }} / 5
                </span>
              </div>

              @if (isInvalid('rating')) {
                <p class="field-error">
                  {{ 'publicPages.reviews.errors.rating' | translate }}
                </p>
              }
            </div>

            <!-- Avis -->
            <div>
              <label class="field-label" for="review-description">
                {{ 'publicPages.reviews.description' | translate }}
              </label>

              <textarea
                id="review-description"
                rows="4"
                class="review-textarea"
                formControlName="description"
                maxlength="2000"
                [class.field-invalid]="isInvalid('description')"
                [attr.aria-invalid]="isInvalid('description')"
                [attr.aria-describedby]="
                  isInvalid('description')
                    ? 'review-description-error'
                    : null
                "
              ></textarea>

              <div class="mt-1.5 flex items-start justify-between gap-3">
                <div>
                  @if (isInvalid('description')) {
                    <p
                      id="review-description-error"
                      class="field-error !mt-0"
                    >
                      {{
                        'publicPages.reviews.errors.description'
                          | translate
                      }}
                    </p>
                  }
                </div>

                <span
                  class="shrink-0 text-[0.68rem]
                         text-[var(--app-text-muted)]"
                >
                  {{ form.controls.description.value.length }} / 2000
                </span>
              </div>
            </div>

            <!-- Photo facultative -->
            <div>
              <label class="field-label" for="review-image">
                {{ 'publicPages.reviews.image' | translate }}
              </label>

              <div class="upload-panel">
                @if (previewUrl(); as preview) {
                  <img
                    [src]="preview"
                    alt=""
                    class="h-14 w-14 shrink-0 rounded-2xl object-cover"
                  />
                } @else {
                  <span
                    class="inline-grid h-14 w-14 shrink-0
                           place-items-center rounded-2xl
                           bg-[var(--app-surface)]
                           text-[var(--p-primary-color)]"
                    aria-hidden="true"
                  >
                    <i class="pi pi-camera text-xl"></i>
                  </span>
                }

                <div class="min-w-0 flex-1">
                  <input
                    #imageInput
                    id="review-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="file-input"
                    aria-describedby="review-image-help"
                    (change)="onFileSelected($event)"
                  />

                  <p
                    id="review-image-help"
                    class="mt-2 text-xs leading-5
                           text-[var(--app-text-muted)]"
                  >
                    {{ 'publicPages.reviews.imageHelp' | translate }}
                  </p>
                </div>

                @if (previewUrl()) {
                  <button
                    type="button"
                    class="close-button"
                    [attr.aria-label]="'common.delete' | translate"
                    (click)="removeImage()"
                  >
                    <i
                      class="pi pi-trash text-sm"
                      aria-hidden="true"
                    ></i>
                  </button>
                }
              </div>
            </div>
          </fieldset>

          <!-- Actions -->
          <div class="modal-footer">
            <button
              type="button"
              class="secondary-button"
              [disabled]="submitting()"
              (click)="closeModal()"
            >
              {{ 'common.cancel' | translate }}
            </button>

            <button
              type="submit"
              class="primary-button"
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

              {{ 'publicPages.reviews.submit' | translate }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  `,

  styles: `
    :host {
      display: block;
    }

    .review-card {
      position: relative;
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 1.5rem;
      background: var(--app-surface);
      padding: 1.5rem;
      box-shadow: 0 8px 24px -22px rgb(15 23 42 / 0.25);
      transition:
        transform 200ms ease,
        border-color 200ms ease,
        box-shadow 200ms ease;
    }

    .review-card::before {
      position: absolute;
      inset-block: 1.5rem;
      inset-inline-start: 0;
      width: 3px;
      border-radius: 0 4px 4px 0;
      background: var(--p-primary-color);
      opacity: 0;
      content: '';
      transition: opacity 200ms ease;
    }

    .review-card:hover {
      transform: translateY(-3px);
      border-color: var(--p-primary-color);
      box-shadow: 0 18px 45px -32px rgb(15 23 42 / 0.4);
    }

    .review-card:hover::before {
      opacity: 1;
    }

    .primary-button,
    .secondary-button {
      display: inline-flex;
      min-height: 2.875rem;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      border-radius: 0.875rem;
      padding: 0.75rem 1.125rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color 180ms ease,
        border-color 180ms ease,
        transform 180ms ease;
    }

    .primary-button {
      border: 1px solid transparent;
      background: var(--p-primary-color);
      color: var(--p-primary-inverse-color);
    }

    .primary-button:hover:not(:disabled) {
      background: var(--p-primary-hover-color);
      transform: translateY(-1px);
    }

    .secondary-button {
      border: 1px solid var(--app-border);
      background: var(--app-surface);
      color: var(--app-text);
    }

    .secondary-button:hover:not(:disabled) {
      border-color: var(--p-primary-color);
      color: var(--p-primary-color);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    button:focus-visible,
    .file-input:focus-visible {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 3px;
    }

    .review-dialog {
      width: min(40rem, calc(100vw - 2rem));
      max-width: none;
      max-height: calc(100dvh - 2rem);
      margin: auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      border: 1px solid var(--app-border);
      border-radius: 1.75rem;
      padding: 0;
      background: var(--app-surface);
      color: var(--app-text);
      box-shadow: 0 32px 100px -24px rgb(0 0 0 / 0.45);
    }

    .review-dialog::backdrop {
      background: rgb(2 6 23 / 0.6);
      backdrop-filter: blur(7px);
    }

    .review-dialog[open] {
      animation: modal-enter 200ms ease-out;
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--app-border);
      padding: 1.5rem;
    }

    .close-button {
      display: inline-grid;
      width: 2.25rem;
      height: 2.25rem;
      flex-shrink: 0;
      place-items: center;
      border: 1px solid transparent;
      border-radius: 0.75rem;
      background: var(--app-surface-muted);
      color: var(--app-text-muted);
      cursor: pointer;
      transition:
        color 180ms ease,
        border-color 180ms ease;
    }

    .close-button:hover:not(:disabled) {
      border-color: var(--app-border);
      color: var(--app-text);
    }

    .modal-form {
      padding: 1.5rem;
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

    .field-icon {
      position: absolute;
      inset-inline-start: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--app-text-muted);
      font-size: 0.875rem;
      pointer-events: none;
    }

    .review-input,
    .review-textarea {
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

    .review-input {
      min-height: 2.875rem;
      padding-block: 0.75rem;
      padding-inline-start: 2.5rem;
      padding-inline-end: 0.875rem;
    }

    .review-textarea {
      min-height: 8rem;
      resize: vertical;
      padding: 0.875rem;
      line-height: 1.75;
    }

    .review-input:focus,
    .review-textarea:focus {
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

    .rating-panel {
      border-radius: 1rem;
      background: var(--app-surface-muted);
      padding: 1rem;
    }

    .rating-button {
      display: inline-grid;
      width: 2.5rem;
      height: 2.5rem;
      place-items: center;
      border-radius: 0.625rem;
      cursor: pointer;
      transition: transform 150ms ease;
    }

    .rating-button:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.08);
    }

    .upload-panel {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      border: 1px dashed var(--app-border);
      border-radius: 1rem;
      background: var(--app-surface-muted);
      padding: 1rem;
    }

    .file-input {
      display: block;
      width: 100%;
      color: var(--app-text-muted);
      font-size: 0.75rem;
    }

    .file-input::file-selector-button {
      margin-inline-end: 0.75rem;
      border: 1px solid var(--app-border);
      border-radius: 0.5rem;
      background: var(--app-surface);
      padding: 0.5rem 0.625rem;
      color: var(--app-text);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      border-top: 1px solid var(--app-border);
      padding-top: 1.25rem;
    }

    @keyframes modal-enter {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 479px) {
      .modal-header,
      .modal-form {
        padding: 1.125rem;
      }

      .upload-panel {
        flex-wrap: wrap;
      }

      .modal-footer {
        flex-direction: column-reverse;
      }

      .modal-footer button {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .review-dialog[open] {
        animation: none;
      }

      .review-card,
      .review-card::before,
      .primary-button,
      .secondary-button,
      .rating-button {
        transition: none;
      }

      .review-card:hover,
      .primary-button:hover:not(:disabled),
      .rating-button:hover:not(:disabled) {
        transform: none;
      }
    }
  `
})
export class ReviewsSectionComponent {
  private readonly reviewService = inject(ReviewService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reviewDialog =
    viewChild<ElementRef<HTMLDialogElement>>('reviewDialog');

  private readonly imageInput =
    viewChild<ElementRef<HTMLInputElement>>('imageInput');

  private previewObjectUrl: string | null = null;

  readonly stars = [1, 2, 3, 4, 5];

  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  readonly ratingValue = signal(0);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    fullName: [
      '',
      [
        Validators.required,
        Validators.maxLength(120)
      ]
    ],

    jobTitle: [
      '',
      [
        Validators.required,
        Validators.maxLength(120)
      ]
    ],

    rating: [
      0,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(5)
      ]
    ],

    description: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(2000)
      ]
    ]
  });

  constructor() {
    effect(onCleanup => {
      this.language.current();

      const subscription = untracked(() => this.load());

      onCleanup(() => subscription.unsubscribe());
    });

    this.destroyRef.onDestroy(() => {
      this.releasePreview();
    });
  }

  load() {
    this.loading.set(true);

    return this.reviewService.getPublicReviews(0, 6).subscribe({
      next: page => {
        this.reviews.set(page.content);
        this.loading.set(false);
      },

      error: () => {
        this.reviews.set([]);
        this.loading.set(false);
      }
    });
  }

  openModal(): void {
    const dialog = this.reviewDialog()?.nativeElement;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  closeModal(): void {
    if (this.submitting()) {
      return;
    }

    this.reviewDialog()?.nativeElement.close();
  }

  onDialogCancel(event: Event): void {
    if (this.submitting()) {
      event.preventDefault();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    const dialog = this.reviewDialog()?.nativeElement;

    if (!dialog || event.target !== dialog) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();

    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) {
      this.closeModal();
    }
  }

  setRating(value: number): void {
    if (this.submitting()) {
      return;
    }

    this.ratingValue.set(value);
    this.form.controls.rating.setValue(value);
    this.form.controls.rating.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.removeImage(false);

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    const maxSize = 5 * 1024 * 1024;

    if (
      !allowedTypes.includes(file.type) ||
      file.size > maxSize
    ) {
      input.value = '';

      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('common.error'),
        detail: this.translate.instant(
          'publicPages.reviews.imageHelp'
        ),
        life: 5000
      });

      return;
    }

    this.selectedFile.set(file);
    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.previewObjectUrl);
  }

  removeImage(clearInput = true): void {
    this.selectedFile.set(null);
    this.releasePreview();
    this.previewUrl.set(null);

    if (clearInput) {
      const input = this.imageInput()?.nativeElement;

      if (input) {
        input.value = '';
      }
    }
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    const rawValue = this.form.getRawValue();

    this.form.patchValue({
      fullName: rawValue.fullName.trim(),
      jobTitle: rawValue.jobTitle.trim(),
      description: rawValue.description.trim()
    });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitting.set(true);

    const subscription = this.reviewService
      .createReview(
        {
          fullName: value.fullName,
          jobTitle: value.jobTitle,
          rating: value.rating,
          description: value.description
        },
        this.selectedFile() ?? undefined
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);

          this.closeModal();
          this.resetForm();

          this.messages.add({
            severity: 'success',
            summary: this.translate.instant(
              'publicPages.reviews.successTitle'
            ),
            detail: this.translate.instant(
              'publicPages.reviews.success'
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
              'publicPages.reviews.error'
            ),
            life: 5000
          });
        }
      });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  isInvalid(controlName: ReviewControlName): boolean {
    const control = this.form.controls[controlName];

    return (
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  reviewImage(review: Review): string | null {
    return resolveMediaUrl(review.imageUrl);
  }

  initials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) {
      return '?';
    }

    const first = parts[0]?.charAt(0) ?? '';

    const last =
      parts.length > 1
        ? parts[parts.length - 1]?.charAt(0) ?? ''
        : '';

    return (first + last).toUpperCase();
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(this.language.current(), {
      year: 'numeric',
      month: 'short'
    });
  }

  private resetForm(): void {
    this.form.reset({
      fullName: '',
      jobTitle: '',
      rating: 0,
      description: ''
    });

    this.ratingValue.set(0);
    this.removeImage();
  }

  private releasePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}