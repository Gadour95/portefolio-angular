import {
  Component,
  effect,
  inject,
  signal,
  untracked
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

import { Review } from '../../../../core/models/review.model';

import { LanguageService } from '../../../../core/services/language.service';
import { ReviewService } from '../../../../core/services/review.service';

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
    <section id="reviews" class="scroll-mt-32">
      <div class="max-w-2xl">
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'home.reviewsEyebrow' | translate }}
        </p>

        <h2
          class="mt-2 text-2xl font-bold tracking-[-0.035em] sm:text-3xl"
        >
          {{ 'publicPages.reviews.title' | translate }}
        </h2>

        <p class="mt-3 leading-7 text-[var(--app-text-muted)]">
          {{ 'publicPages.reviews.subtitle' | translate }}
        </p>
      </div>

      <div
        class="mt-8 grid items-start gap-6
               lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      >
        <!-- Liste des avis -->
        <div class="space-y-4">
          @if (loading()) {
            @for (item of [1, 2, 3]; track item) {
              <div
                class="h-48 animate-pulse rounded-3xl
                       bg-[var(--app-surface-muted)]"
              ></div>
            }
          } @else if (!reviews().length) {
            <div
              class="rounded-3xl border border-dashed
                     border-[var(--app-border)] bg-[var(--app-surface)]
                     p-10 text-center"
            >
              <i
                class="pi pi-star text-4xl text-[var(--app-text-muted)]"
                aria-hidden="true"
              ></i>

              <p class="mt-4 text-sm text-[var(--app-text-muted)]">
                {{ 'publicPages.reviews.empty' | translate }}
              </p>
            </div>
          } @else {
            @for (review of reviews(); track review.id) {
              <article
                class="group relative overflow-hidden rounded-3xl border
                       border-[var(--app-border)] bg-[var(--app-surface)]
                       p-6 transition hover:border-[var(--p-primary-color)]/40
                       hover:shadow-[0_20px_50px_-38px_rgba(79,70,229,0.55)]
                       sm:p-7"
              >
                <span
                  class="pointer-events-none absolute -top-4 end-4
                         select-none font-serif text-[6.5rem] leading-none
                         text-[var(--p-primary-color)]/10"
                  aria-hidden="true"
                >
                  ”
                </span>

                <span
                  class="inline-grid h-9 w-9 place-items-center rounded-xl
                         bg-[var(--p-primary-color)]/10
                         text-[var(--p-primary-color)]"
                  aria-hidden="true"
                >
                  <i class="pi pi-comment text-sm"></i>
                </span>

                <p
                  class="relative mt-4 text-[0.95rem] leading-8
                         text-[var(--app-text-muted)]"
                >
                  {{ review.description }}
                </p>

                <div
                  class="mt-5 flex flex-wrap items-center gap-3
                         border-t border-[var(--app-border)] pt-5"
                >
                  @if (reviewImage(review); as image) {
                    <img
                      [src]="image"
                      [alt]="review.fullName"
                      class="h-11 w-11 shrink-0 rounded-full object-cover"
                      loading="lazy"
                    />
                  } @else {
                    <span
                      class="inline-grid h-11 w-11 shrink-0 place-items-center
                             rounded-full bg-[var(--app-surface-muted)]
                             text-sm font-bold
                             text-[var(--p-primary-color)]"
                    >
                      {{ initials(review.fullName) }}
                    </span>
                  }

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">
                      {{ review.fullName }}
                    </p>

                    @if (review.jobTitle) {
                      <p
                        class="truncate text-xs
                               text-[var(--app-text-muted)]"
                      >
                        {{ review.jobTitle }}
                      </p>
                    }
                  </div>

                  <div class="flex flex-col items-end gap-1">
                    <div
                      class="flex items-center gap-0.5"
                      [attr.aria-label]="
                        ('publicPages.reviews.rating' | translate) +
                        ': ' +
                        review.rating +
                        '/5'
                      "
                    >
                      @for (star of stars; track star) {
                        <i
                          class="pi pi-star-fill text-[0.7rem]"
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
                      class="text-[0.68rem] text-[var(--app-text-muted)]"
                      [attr.datetime]="review.createdAt"
                    >
                      {{ formatDate(review.createdAt) }}
                    </time>
                  </div>
                </div>
              </article>
            }
          }
        </div>

        <!-- Formulaire -->
        <aside
          class="rounded-3xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-6 lg:sticky lg:top-32 sm:p-7"
        >
          <span
            class="inline-grid h-10 w-10 place-items-center rounded-xl
                   bg-[var(--p-primary-color)]/10
                   text-[var(--p-primary-color)]"
            aria-hidden="true"
          >
            <i class="pi pi-pencil text-sm"></i>
          </span>

          <h3 class="mt-4 text-lg font-bold">
            {{ 'publicPages.reviews.formTitle' | translate }}
          </h3>

          <p class="mt-1.5 text-sm leading-6 app-muted">
            {{ 'publicPages.reviews.formText' | translate }}
          </p>

          @if (success()) {
            <div
              class="mt-5 rounded-xl border border-emerald-300
                     bg-emerald-50 p-4 text-sm text-emerald-800
                     dark:border-emerald-800 dark:bg-emerald-950/40
                     dark:text-emerald-200"
              role="status"
            >
              <div class="flex items-start gap-3">
                <i
                  class="pi pi-check-circle mt-0.5"
                  aria-hidden="true"
                ></i>

                <p class="flex-1">
                  {{ 'publicPages.reviews.success' | translate }}
                </p>

                <button
                  type="button"
                  class="text-emerald-700 dark:text-emerald-200"
                  [attr.aria-label]="'common.close' | translate"
                  (click)="success.set(false)"
                >
                  <i
                    class="pi pi-times text-xs"
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </div>
          }

          <form
            class="mt-5 space-y-4"
            [formGroup]="form"
            (ngSubmit)="submit()"
            novalidate
          >
            <div>
              <label class="app-label" for="review-full-name">
                {{ 'publicPages.reviews.fullName' | translate }}
              </label>

              <input
                id="review-full-name"
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
                  {{ 'publicPages.reviews.errors.fullName' | translate }}
                </p>
              }
            </div>

            <div>
              <label class="app-label" for="review-job-title">
                {{ 'publicPages.reviews.jobTitle' | translate }}
              </label>

              <input
                id="review-job-title"
                type="text"
                class="app-control w-full"
                formControlName="jobTitle"
                autocomplete="organization-title"
                [style.borderColor]="
                  isInvalid('jobTitle') ? '#ef4444' : null
                "
              />

              @if (isInvalid('jobTitle')) {
                <p class="mt-1.5 text-xs text-red-600">
                  {{ 'publicPages.reviews.errors.jobTitle' | translate }}
                </p>
              }
            </div>

            <div>
              <span class="app-label">
                {{ 'publicPages.reviews.rating' | translate }}
              </span>

              <div class="flex items-center gap-1">
                @for (star of stars; track star) {
                  <button
                    type="button"
                    class="rounded p-0.5 transition hover:scale-110"
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

              @if (isInvalid('rating')) {
                <p class="mt-1.5 text-xs text-red-600">
                  {{ 'publicPages.reviews.errors.rating' | translate }}
                </p>
              }
            </div>

            <div>
              <label class="app-label" for="review-description">
                {{ 'publicPages.reviews.description' | translate }}
              </label>

              <textarea
                id="review-description"
                rows="4"
                class="app-control w-full py-2"
                formControlName="description"
                [style.borderColor]="
                  isInvalid('description') ? '#ef4444' : null
                "
              ></textarea>

              @if (isInvalid('description')) {
                <p class="mt-1.5 text-xs text-red-600">
                  {{ 'publicPages.reviews.errors.description' | translate }}
                </p>
              }
            </div>

            <div>
              <label class="app-label" for="review-image">
                {{ 'publicPages.reviews.image' | translate }}
              </label>

              <input
                id="review-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="block w-full text-sm text-[var(--app-text-muted)]
                       file:me-3 file:rounded-lg file:border-0
                       file:bg-[var(--app-surface-muted)]
                       file:px-3 file:py-2 file:text-sm
                       file:font-semibold file:text-[var(--app-text)]"
                (change)="onFileSelected($event)"
              />

              <p class="mt-1.5 text-xs text-[var(--app-text-muted)]">
                {{ 'publicPages.reviews.imageHelp' | translate }}
              </p>

              @if (previewUrl(); as preview) {
                <img
                  [src]="preview"
                  alt=""
                  class="mt-3 h-14 w-14 rounded-full object-cover"
                />
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

              {{ 'publicPages.reviews.submit' | translate }}
            </button>
          </form>
        </aside>
      </div>
    </section>
  `
})
export class ReviewsSectionComponent {
  private readonly reviewService = inject(ReviewService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private previewObjectUrl: string | null = null;

  readonly stars = [1, 2, 3, 4, 5];

  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);

  readonly submitting = signal(false);
  readonly success = signal(false);

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
    effect(() => {
      this.language.current();

      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);

    this.reviewService.getPublicReviews(0, 6).subscribe({
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

  setRating(value: number): void {
    this.ratingValue.set(value);
    this.form.controls.rating.setValue(value);
    this.form.controls.rating.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.releasePreview();

    if (!file) {
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      return;
    }

    this.selectedFile.set(file);
    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.previewObjectUrl);
  }

  submit(): void {
    this.success.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitting.set(true);

    this.reviewService
      .createReview(
        {
          fullName: value.fullName.trim(),
          jobTitle: value.jobTitle.trim(),
          rating: value.rating,
          description: value.description.trim()
        },
        this.selectedFile() ?? undefined
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.success.set(true);

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

          this.resetForm();
          this.load();
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
    const parts = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return '?';
    }

    const first = parts[0]?.charAt(0) ?? '';
    const last =
      parts.length > 1
        ? parts[parts.length - 1]?.charAt(0) ?? ''
        : '';

    return `${first}${last}`.toUpperCase();
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(undefined, {
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
    this.selectedFile.set(null);
    this.releasePreview();
    this.previewUrl.set(null);
  }

  private releasePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}
