import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';

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
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs';

import {
  Review,
  ReviewStatus
} from '../../../core/models/review.model';

import {
  ReviewService
} from '../../../core/services/review.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

import {
  HttpErrorResponse
} from '@angular/common/http';

type TagSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'danger'
  | 'secondary'
  | 'contrast';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule,
    ToolbarModule,
    TooltipModule
  ],

  providers: [ConfirmationService],

  template: `
    <div class="space-y-6">
      <!-- En-tête de page -->
      <section>
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'adminNav.moderation' | translate }}
        </p>

        <h1
          class="mt-2 text-2xl font-bold tracking-[-0.035em]
                 sm:text-3xl"
        >
          {{ 'adminReviews.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminReviews.subtitle' | translate }}
        </p>
      </section>

      <!-- Barre d'outils -->
      <p-toolbar styleClass="rounded-2xl">
        <ng-template #start>
          <div class="flex flex-wrap items-center gap-2">
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />

              <input
                pInputText
                type="search"
                class="w-full sm:w-72"
                [formControl]="searchControl"
                [placeholder]="'adminReviews.search' | translate"
                [attr.aria-label]="'adminReviews.search' | translate"
              />
            </p-iconfield>

            <p-select
              [options]="statusOptions()"
              optionLabel="label"
              optionValue="value"
              [formControl]="statusControl"
              styleClass="w-44"
            />
          </div>
        </ng-template>

        <ng-template #end>
          <p-button
            icon="pi pi-refresh"
            severity="secondary"
            [outlined]="true"
            [disabled]="loading()"
            [ariaLabel]="'adminReviews.refresh' | translate"
            [pTooltip]="'adminReviews.refresh' | translate"
            (onClick)="load()"
          />
        </ng-template>
      </p-toolbar>

      <!-- Erreur de chargement -->
      @if (loadError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      <!-- Tableau des avis -->
      <p-card styleClass="overflow-hidden rounded-2xl">
        <p-table
          [value]="reviews()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '52rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-16">
                {{ 'adminReviews.image' | translate }}
              </th>

              <th class="w-48">
                {{ 'adminReviews.fullName' | translate }}
              </th>

              <th class="w-24">
                {{ 'adminReviews.rating' | translate }}
              </th>

              <th>
                {{ 'adminReviews.description' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminReviews.status' | translate }}
              </th>

              <th class="w-40">
                {{ 'adminReviews.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-review>
            <tr>
              <!-- Photo -->
              <td>
                @if (reviewImageUrl(review); as url) {
                  <img
                    [src]="url"
                    [alt]="review.fullName"
                    class="h-10 w-10 rounded-full object-cover
                           border border-[var(--app-border)]"
                    loading="lazy"
                  />
                } @else {
                  <span
                    class="flex h-10 w-10 items-center justify-center
                           rounded-full border border-dashed
                           border-[var(--app-border)]"
                    aria-hidden="true"
                  >
                    <i class="pi pi-user text-sm app-muted"></i>
                  </span>
                }
              </td>

              <!-- Auteur -->
              <td>
                <div class="font-semibold">{{ review.fullName }}</div>
                <div class="text-xs app-muted line-clamp-1">
                  {{ review.jobTitle }}
                </div>
              </td>

              <!-- Note étoiles -->
              <td>
                <div class="flex items-center gap-0.5">
                  @for (star of starsArray; track star) {
                    <i
                      class="pi text-xs"
                      [class.pi-star-fill]="star <= review.rating"
                      [class.pi-star]="star > review.rating"
                      [class.text-yellow-400]="star <= review.rating"
                      [class.app-muted]="star > review.rating"
                    ></i>
                  }
                </div>
              </td>

              <!-- Aperçu -->
              <td>
                <p class="text-sm line-clamp-2 max-w-sm app-muted">
                  {{ review.description }}
                </p>
              </td>

              <!-- Statut -->
              <td>
                <p-tag
                  [severity]="statusSeverity(review.status)"
                  [value]="statusLabel(review.status)"
                  [rounded]="true"
                />
              </td>

              <!-- Actions -->
              <td>
                <div class="flex items-center gap-1">
                  <!-- Voir le détail -->
                  <p-button
                    icon="pi pi-eye"
                    severity="secondary"
                    [text]="true"
                    [rounded]="true"
                    [ariaLabel]="'adminReviews.viewDetail' | translate"
                    [pTooltip]="'adminReviews.viewDetail' | translate"
                    (onClick)="openDetail(review)"
                  />

                  <!-- Approuver -->
                  @if (review.status !== 'APPROVED') {
                    <p-button
                      icon="pi pi-check"
                      severity="success"
                      [text]="true"
                      [rounded]="true"
                      [loading]="updatingId() === review.id"
                      [disabled]="isActionDisabled(review.id)"
                      [ariaLabel]="'adminReviews.approve' | translate"
                      [pTooltip]="'adminReviews.approve' | translate"
                      (onClick)="updateStatus(review, 'APPROVED')"
                    />
                  }

                  <!-- Rejeter -->
                  @if (review.status !== 'REJECTED') {
                    <p-button
                      icon="pi pi-times"
                      severity="warn"
                      [text]="true"
                      [rounded]="true"
                      [loading]="updatingId() === review.id"
                      [disabled]="isActionDisabled(review.id)"
                      [ariaLabel]="'adminReviews.reject' | translate"
                      [pTooltip]="'adminReviews.reject' | translate"
                      (onClick)="updateStatus(review, 'REJECTED')"
                    />
                  }

                  <!-- Supprimer -->
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === review.id"
                    [disabled]="isActionDisabled(review.id)"
                    [ariaLabel]="'adminReviews.delete' | translate"
                    [pTooltip]="'adminReviews.delete' | translate"
                    (onClick)="confirmDelete(review)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <!-- État vide -->
          <ng-template #emptymessage>
            <tr>
              <td colspan="6">
                <div class="flex flex-col items-center gap-3 py-16 text-center">
                  <span
                    class="flex h-14 w-14 items-center justify-center
                           rounded-full bg-[var(--app-surface-b)]"
                  >
                    <i class="pi pi-star text-2xl app-muted"></i>
                  </span>

                  <p class="font-semibold">
                    {{ 'adminReviews.empty' | translate }}
                  </p>

                  <p class="text-sm app-muted max-w-xs">
                    @if (hasFilters()) {
                      {{ 'adminReviews.searchEmpty' | translate }}
                    } @else {
                      {{ 'adminReviews.emptyHint' | translate }}
                    }
                  </p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        <!-- Pagination -->
        @if (totalElements() > pageSize) {
          <p-paginator
            [rows]="pageSize"
            [totalRecords]="totalElements()"
            [first]="currentPage() * pageSize"
            (onPageChange)="onPageChange($event)"
            styleClass="border-t border-[var(--app-border)] rounded-none"
          />
        }
      </p-card>

      <!-- Total -->
      @if (!loading() && totalElements() > 0) {
        <p class="text-sm app-muted text-center">
          {{
            'adminReviews.total'
              | translate : { count: totalElements() }
          }}
        </p>
      }
    </div>

    <!-- Dialog : détail de l'avis -->
    <p-dialog
      [(visible)]="detailVisible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '600px', 'max-width': '95vw' }"
      styleClass="rounded-2xl"
    >
      <ng-template #header>
        <span class="font-semibold text-lg">
          {{ 'adminReviews.viewDetail' | translate }}
        </span>
      </ng-template>

      @if (selectedReview(); as r) {
        <div class="space-y-4">
          <!-- En-tête auteur -->
          <div class="flex items-center gap-4">
            @if (reviewImageUrl(r); as url) {
              <img
                [src]="url"
                [alt]="r.fullName"
                class="h-16 w-16 rounded-full object-cover
                       border border-[var(--app-border)] flex-shrink-0"
              />
            } @else {
              <span
                class="flex h-16 w-16 items-center justify-center rounded-full
                       bg-[var(--app-surface-b)] border border-dashed
                       border-[var(--app-border)] flex-shrink-0"
              >
                <i class="pi pi-user text-2xl app-muted"></i>
              </span>
            }

            <div>
              <div class="text-lg font-semibold">{{ r.fullName }}</div>
              <div class="text-sm app-muted">{{ r.jobTitle }}</div>
              <div class="flex items-center gap-0.5 mt-1">
                @for (star of starsArray; track star) {
                  <i
                    class="pi text-sm"
                    [class.pi-star-fill]="star <= r.rating"
                    [class.pi-star]="star > r.rating"
                    [class.text-yellow-400]="star <= r.rating"
                    [class.app-muted]="star > r.rating"
                  ></i>
                }
                <span class="ml-1 text-sm app-muted">
                  {{ r.rating }}/5
                  {{ 'adminReviews.stars' | translate }}
                </span>
              </div>
            </div>

            <div class="ms-auto">
              <p-tag
                [severity]="statusSeverity(r.status)"
                [value]="statusLabel(r.status)"
                [rounded]="true"
              />
            </div>
          </div>

          <!-- Contenu -->
          <div
            class="rounded-xl bg-[var(--app-surface-b)]
                   border border-[var(--app-border)] p-4"
          >
            <p class="text-sm leading-relaxed whitespace-pre-wrap">
              {{ r.description }}
            </p>
          </div>

          <!-- Date -->
          <p class="text-xs app-muted text-end">
            {{ r.createdAt | date : 'dd/MM/yyyy HH:mm' }}
          </p>
        </div>
      }

      <ng-template #footer>
        <div class="flex items-center gap-2 justify-end">
          @if (selectedReview()?.status !== 'APPROVED') {
            <p-button
              icon="pi pi-check"
              severity="success"
              [label]="'adminReviews.approve' | translate"
              [loading]="updatingId() === selectedReview()?.id"
              (onClick)="updateStatusFromDetail('APPROVED')"
            />
          }

          @if (selectedReview()?.status !== 'REJECTED') {
            <p-button
              icon="pi pi-times"
              severity="warn"
              [label]="'adminReviews.reject' | translate"
              [loading]="updatingId() === selectedReview()?.id"
              (onClick)="updateStatusFromDetail('REJECTED')"
            />
          }

          <p-button
            severity="secondary"
            [label]="'adminReviews.cancel' | translate"
            (onClick)="detailVisible = false"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Dialogue de confirmation de suppression -->
    <p-confirmdialog styleClass="rounded-2xl" />
  `
})
export class ReviewsAdminComponent implements OnInit {
  // ----------------------------------------------------------------
  // Injections
  // ----------------------------------------------------------------
  private readonly reviewService = inject(ReviewService);
  private readonly translate    = inject(TranslateService);
  private readonly messages     = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef   = inject(DestroyRef);

  // ----------------------------------------------------------------
  // Constantes
  // ----------------------------------------------------------------
  readonly pageSize  = 12;
  readonly starsArray = [1, 2, 3, 4, 5];

  // ----------------------------------------------------------------
  // Signaux
  // ----------------------------------------------------------------
  readonly reviews       = signal<Review[]>([]);
  readonly loading       = signal(false);
  readonly loadError     = signal<string | null>(null);
  readonly deletingId    = signal<string | null>(null);
  readonly updatingId    = signal<string | null>(null);
  readonly currentPage   = signal(0);
  readonly totalElements = signal(0);
  readonly totalPages    = signal(0);
  readonly selectedReview = signal<Review | null>(null);

  detailVisible = false;

  // ----------------------------------------------------------------
  // Formulaires de filtres
  // ----------------------------------------------------------------
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<ReviewStatus | ''>('', {
    nonNullable: true
  });

  // ----------------------------------------------------------------
  // Computed
  // ----------------------------------------------------------------
  readonly statusOptions = computed(() => [
    {
      label: this.translate.instant('adminReviews.allStatuses'),
      value: ''
    },
    {
      label: this.translate.instant('adminReviews.pending'),
      value: 'DRAFT'
    },
    {
      label: this.translate.instant('adminReviews.approved'),
      value: 'APPROVED'
    },
    {
      label: this.translate.instant('adminReviews.rejected'),
      value: 'REJECTED'
    }
  ]);

  readonly hasFilters = computed(
    () =>
      this.searchControl.value.trim() !== '' ||
      this.statusControl.value !== ''
  );

  // ----------------------------------------------------------------
  // Cycle de vie
  // ----------------------------------------------------------------
  ngOnInit(): void {
    this.load();

    // Recherche avec debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(0);
        this.load();
      });

    // Filtre statut : réaction immédiate
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(0);
        this.load();
      });
  }

  // ----------------------------------------------------------------
  // Chargement
  // ----------------------------------------------------------------
  load(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    const statusVal = this.statusControl.value;

    this.reviewService
      .getAdminReviews({
        page:   this.currentPage(),
        size:   this.pageSize,
        search: this.searchControl.value.trim() || undefined,
        status: (statusVal as ReviewStatus) || undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: page => {
          this.reviews.set(page.content);
          this.totalElements.set(page.totalElements);
          this.totalPages.set(page.totalPages);
        },
        error: (err: unknown) => {
          this.loadError.set(this.errorMessage(err));
        }
      });
  }

  // ----------------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------------
  onPageChange(event: PaginatorState): void {
    this.currentPage.set(event.page ?? 0);
    this.load();
  }

  // ----------------------------------------------------------------
  // Helpers visuels
  // ----------------------------------------------------------------
  reviewImageUrl(review: Review): string | null {
    return resolveMediaUrl(review.imageUrl);
  }

  statusSeverity(status: ReviewStatus): TagSeverity {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default:         return 'warn';
    }
  }

  statusLabel(status: ReviewStatus): string {
    switch (status) {
      case 'APPROVED': return this.translate.instant('adminReviews.approved');
      case 'REJECTED': return this.translate.instant('adminReviews.rejected');
      default:         return this.translate.instant('adminReviews.pending');
    }
  }

  isActionDisabled(id: string): boolean {
    const uid = this.updatingId();
    const did = this.deletingId();
    return (uid !== null && uid !== id) || (did !== null && did !== id);
  }

  // ----------------------------------------------------------------
  // Modération : changement de statut
  // ----------------------------------------------------------------
  updateStatus(review: Review, status: ReviewStatus): void {
    if (this.updatingId() || this.deletingId()) {
      return;
    }

    this.updatingId.set(review.id);

    this.reviewService
      .updateReviewStatus(review.id, status)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.updatingId.set(null))
      )
      .subscribe({
        next: updated => {
          // Mise à jour locale sans rechargement complet
          this.reviews.update(list =>
            list.map(r => (r.id === updated.id ? updated : r))
          );

          // Met aussi à jour le détail ouvert si nécessaire
          if (this.selectedReview()?.id === updated.id) {
            this.selectedReview.set(updated);
          }

          const key =
            status === 'APPROVED'
              ? 'adminReviews.approvedSuccess'
              : 'adminReviews.rejectedSuccess';

          this.notify(key);
        },
        error: (err: unknown) => {
          if (
            err instanceof HttpErrorResponse &&
            (err.status === 401 || err.status === 403)
          ) {
            return;
          }

          this.messages.add({
            severity: 'error',
            summary:  this.translate.instant('adminReviews.error'),
            detail:   this.errorMessage(err),
            life:     6000
          });
        }
      });
  }

  updateStatusFromDetail(status: ReviewStatus): void {
    const review = this.selectedReview();
    if (review) {
      this.updateStatus(review, status);
    }
  }

  // ----------------------------------------------------------------
  // Suppression
  // ----------------------------------------------------------------
  confirmDelete(review: Review): void {
    if (this.deletingId() || this.updatingId()) {
      return;
    }

    this.confirmation.confirm({
      header:  this.translate.instant('adminReviews.deleteTitle'),
      message: this.translate.instant('adminReviews.deleteQuestion', {
        name: review.fullName
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel:            this.translate.instant('adminReviews.delete'),
      rejectLabel:            this.translate.instant('adminReviews.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.deleteReview(review.id)
    });
  }

  private deleteReview(id: string): void {
    this.deletingId.set(id);

    this.reviewService
      .deleteReview(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe({
        next: () => {
          this.notify('adminReviews.deletedSuccess');
          this.load();
        },
        error: (err: unknown) => {
          if (
            err instanceof HttpErrorResponse &&
            (err.status === 401 || err.status === 403)
          ) {
            return;
          }

          this.messages.add({
            severity: 'error',
            summary:  this.translate.instant('adminReviews.error'),
            detail:   this.errorMessage(err),
            life:     6000
          });
        }
      });
  }

  // ----------------------------------------------------------------
  // Dialogue de détail
  // ----------------------------------------------------------------
  openDetail(review: Review): void {
    this.selectedReview.set(review);
    this.detailVisible = true;
  }

  // ----------------------------------------------------------------
  // Utilitaires
  // ----------------------------------------------------------------
  private notify(key: string): void {
    this.messages.add({
      severity: 'success',
      summary:  this.translate.instant('adminReviews.success'),
      detail:   this.translate.instant(key),
      life:     3500
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;

      if (body && typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
    }

    return this.translate.instant('adminReviews.genericError');
  }
}