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
  ContactMessage,
  MessageStatus
} from '../../../core/models/contact-message.model';

import {
  ContactMessageService
} from '../../../core/services/contact-message.service';

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
  selector: 'app-admin-messages',
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
          {{ 'adminPages.messages.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.messages.subtitle' | translate }}
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
                [placeholder]="'adminMessages.search' | translate"
                [attr.aria-label]="'adminMessages.search' | translate"
              />
            </p-iconfield>

            <p-select
              [options]="statusOptions()"
              optionLabel="label"
              optionValue="value"
              [formControl]="statusControl"
              styleClass="w-48"
            />
          </div>
        </ng-template>

        <ng-template #end>
          <p-button
            icon="pi pi-refresh"
            severity="secondary"
            [outlined]="true"
            [disabled]="loading()"
            [ariaLabel]="'adminMessages.refresh' | translate"
            [pTooltip]="'adminMessages.refresh' | translate"
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

      <!-- Tableau des messages -->
      <p-card styleClass="overflow-hidden rounded-2xl">
        <p-table
          [value]="contactMessages()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '58rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-56">
                {{ 'adminMessages.sender' | translate }}
              </th>

              <th class="w-64">
                {{ 'adminMessages.email' | translate }}
              </th>

              <th>
                {{ 'adminMessages.subject' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminMessages.status' | translate }}
              </th>

              <th class="w-40">
                {{ 'adminMessages.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-contactMessage>
            <tr>
              <!-- Expéditeur -->
              <td>
                <div class="font-semibold">
                  {{ contactMessage.fullName }}
                </div>
              </td>

              <!-- Email -->
              <td>
                <a
                  [href]="'mailto:' + contactMessage.email"
                  class="text-sm text-[var(--p-primary-color)]
                         hover:underline"
                >
                  {{ contactMessage.email }}
                </a>
              </td>

              <!-- Sujet et aperçu -->
              <td>
                <div class="font-medium">
                  {{ contactMessage.subject }}
                </div>

                <p class="text-sm app-muted line-clamp-2 max-w-md">
                  {{ contactMessage.message }}
                </p>
              </td>

              <!-- Statut -->
              <td>
                <p-tag
                  [severity]="statusSeverity(contactMessage.status)"
                  [value]="statusLabel(contactMessage.status)"
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
                    [ariaLabel]="'adminMessages.viewDetail' | translate"
                    [pTooltip]="'adminMessages.viewDetail' | translate"
                    (onClick)="openDetail(contactMessage)"
                  />

                  <!-- Marquer comme lu -->
                  @if (contactMessage.status === 'UNREAD') {
                    <p-button
                      icon="pi pi-check"
                      severity="success"
                      [text]="true"
                      [rounded]="true"
                      [loading]="updatingId() === contactMessage.id"
                      [disabled]="isActionDisabled(contactMessage.id)"
                      [ariaLabel]="'adminMessages.markAsRead' | translate"
                      [pTooltip]="'adminMessages.markAsRead' | translate"
                      (onClick)="updateStatus(contactMessage, 'READ')"
                    />
                  }

                  <!-- Marquer comme non lu -->
                  @if (contactMessage.status === 'READ') {
                    <p-button
                      icon="pi pi-undo"
                      severity="warn"
                      [text]="true"
                      [rounded]="true"
                      [loading]="updatingId() === contactMessage.id"
                      [disabled]="isActionDisabled(contactMessage.id)"
                      [ariaLabel]="'adminMessages.markAsUnread' | translate"
                      [pTooltip]="'adminMessages.markAsUnread' | translate"
                      (onClick)="updateStatus(contactMessage, 'UNREAD')"
                    />
                  }

                  <!-- Supprimer -->
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === contactMessage.id"
                    [disabled]="isActionDisabled(contactMessage.id)"
                    [ariaLabel]="'adminMessages.delete' | translate"
                    [pTooltip]="'adminMessages.delete' | translate"
                    (onClick)="confirmDelete(contactMessage)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <!-- État vide -->
          <ng-template #emptymessage>
            <tr>
              <td colspan="5">
                <div class="flex flex-col items-center gap-3 py-16 text-center">
                  <span
                    class="flex h-14 w-14 items-center justify-center
                           rounded-full bg-[var(--app-surface-b)]"
                  >
                    <i class="pi pi-envelope text-2xl app-muted"></i>
                  </span>

                  <p class="font-semibold">
                    {{ 'adminMessages.empty' | translate }}
                  </p>

                  <p class="text-sm app-muted max-w-xs">
                    @if (hasFilters()) {
                      {{ 'adminMessages.searchEmpty' | translate }}
                    } @else {
                      {{ 'adminMessages.emptyHint' | translate }}
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
            'adminMessages.total'
              | translate : { count: totalElements() }
          }}
        </p>
      }
    </div>

    <!-- Dialog : détail du message -->
    <p-dialog
      [(visible)]="detailVisible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '640px', 'max-width': '95vw' }"
      styleClass="rounded-2xl"
    >
      <ng-template #header>
        <span class="font-semibold text-lg">
          {{ 'adminMessages.viewDetail' | translate }}
        </span>
      </ng-template>

      @if (selectedMessage(); as message) {
        <div class="space-y-4">
          <!-- Informations expéditeur -->
          <div
            class="rounded-xl bg-[var(--app-surface-b)]
                   border border-[var(--app-border)] p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-lg font-semibold">
                  {{ message.fullName }}
                </div>

                <a
                  [href]="'mailto:' + message.email"
                  class="text-sm text-[var(--p-primary-color)]
                         hover:underline"
                >
                  {{ message.email }}
                </a>
              </div>

              <p-tag
                [severity]="statusSeverity(message.status)"
                [value]="statusLabel(message.status)"
                [rounded]="true"
              />
            </div>
          </div>

          <!-- Sujet -->
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] app-muted">
              {{ 'adminMessages.subject' | translate }}
            </p>

            <p class="mt-1 font-semibold">
              {{ message.subject }}
            </p>
          </div>

          <!-- Contenu -->
          <div
            class="rounded-xl bg-[var(--app-surface-b)]
                   border border-[var(--app-border)] p-4"
          >
            <p class="text-sm leading-relaxed whitespace-pre-wrap">
              {{ message.message }}
            </p>
          </div>

          <!-- Dates -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs app-muted">
              {{ 'adminMessages.receivedAt' | translate }} :
              {{ message.createdAt | date : 'dd/MM/yyyy HH:mm' }}
            </p>

            <p class="text-xs app-muted">
              {{ 'adminMessages.updatedAt' | translate }} :
              {{ message.updatedAt | date : 'dd/MM/yyyy HH:mm' }}
            </p>
          </div>
        </div>
      }

      <ng-template #footer>
        <div class="flex items-center gap-2 justify-end">
          @if (selectedMessage()?.status === 'UNREAD') {
            <p-button
              icon="pi pi-check"
              severity="success"
              [label]="'adminMessages.markAsRead' | translate"
              [loading]="updatingId() === selectedMessage()?.id"
              (onClick)="updateStatusFromDetail('READ')"
            />
          }

          @if (selectedMessage()?.status === 'READ') {
            <p-button
              icon="pi pi-undo"
              severity="warn"
              [label]="'adminMessages.markAsUnread' | translate"
              [loading]="updatingId() === selectedMessage()?.id"
              (onClick)="updateStatusFromDetail('UNREAD')"
            />
          }

          <p-button
            severity="secondary"
            [label]="'adminMessages.cancel' | translate"
            (onClick)="detailVisible = false"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Dialogue de confirmation de suppression -->
    <p-confirmdialog styleClass="rounded-2xl" />
  `
})
export class MessagesAdminComponent implements OnInit {
  // ----------------------------------------------------------------
  // Injections
  // ----------------------------------------------------------------
  private readonly contactMessageService = inject(ContactMessageService);
  private readonly translate             = inject(TranslateService);
  private readonly messageService        = inject(MessageService);
  private readonly confirmation          = inject(ConfirmationService);
  private readonly destroyRef            = inject(DestroyRef);

  // ----------------------------------------------------------------
  // Constantes
  // ----------------------------------------------------------------
  readonly pageSize = 12;

  // ----------------------------------------------------------------
  // Signaux
  // ----------------------------------------------------------------
  readonly contactMessages = signal<ContactMessage[]>([]);
  readonly loading         = signal(false);
  readonly loadError       = signal<string | null>(null);
  readonly deletingId      = signal<string | null>(null);
  readonly updatingId      = signal<string | null>(null);
  readonly currentPage     = signal(0);
  readonly totalElements   = signal(0);
  readonly totalPages      = signal(0);
  readonly selectedMessage = signal<ContactMessage | null>(null);

  detailVisible = false;

  // ----------------------------------------------------------------
  // Formulaires de filtres
  // ----------------------------------------------------------------
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusControl = new FormControl<MessageStatus | ''>('', {
    nonNullable: true
  });

  // ----------------------------------------------------------------
  // Computed
  // ----------------------------------------------------------------
  readonly statusOptions = computed(() => [
    {
      label: this.translate.instant('adminMessages.allStatuses'),
      value: ''
    },
    {
      label: this.translate.instant('adminMessages.unread'),
      value: 'UNREAD'
    },
    {
      label: this.translate.instant('adminMessages.read'),
      value: 'READ'
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

    this.contactMessageService
      .getAdminContactMessages({
        page:   this.currentPage(),
        size:   this.pageSize,
        search: this.searchControl.value.trim() || undefined,
        status: (statusVal as MessageStatus) || undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: page => {
          this.contactMessages.set(page.content);
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
  statusSeverity(status: MessageStatus): TagSeverity {
    switch (status) {
      case 'READ':
        return 'success';

      case 'UNREAD':
        return 'warn';

      default:
        return 'secondary';
    }
  }

  statusLabel(status: MessageStatus): string {
    switch (status) {
      case 'READ':
        return this.translate.instant('adminMessages.read');

      case 'UNREAD':
        return this.translate.instant('adminMessages.unread');

      default:
        return this.translate.instant('adminMessages.unread');
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
  updateStatus(
    contactMessage: ContactMessage,
    status: MessageStatus
  ): void {
    if (this.updatingId() || this.deletingId()) {
      return;
    }

    this.updatingId.set(contactMessage.id);

    this.contactMessageService
      .updateContactMessageStatus(contactMessage.id, status)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.updatingId.set(null))
      )
      .subscribe({
        next: updated => {
          // Mise à jour locale sans rechargement complet
          this.contactMessages.update(list =>
            list.map(item =>
              item.id === updated.id ? updated : item
            )
          );

          // Met aussi à jour le détail ouvert si nécessaire
          if (this.selectedMessage()?.id === updated.id) {
            this.selectedMessage.set(updated);
          }

          const key =
            status === 'READ'
              ? 'adminMessages.markedAsReadSuccess'
              : 'adminMessages.markedAsUnreadSuccess';

          this.notify(key);
        },
        error: (err: unknown) => {
          if (
            err instanceof HttpErrorResponse &&
            (err.status === 401 || err.status === 403)
          ) {
            return;
          }

          this.messageService.add({
            severity: 'error',
            summary:  this.translate.instant('adminMessages.error'),
            detail:   this.errorMessage(err),
            life:     6000
          });
        }
      });
  }

  updateStatusFromDetail(status: MessageStatus): void {
    const message = this.selectedMessage();

    if (message) {
      this.updateStatus(message, status);
    }
  }

  // ----------------------------------------------------------------
  // Suppression
  // ----------------------------------------------------------------
  confirmDelete(contactMessage: ContactMessage): void {
    if (this.deletingId() || this.updatingId()) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant('adminMessages.deleteTitle'),

      message: this.translate.instant('adminMessages.deleteQuestion', {
        name: contactMessage.fullName
      }),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant('adminMessages.delete'),
      rejectLabel: this.translate.instant('adminMessages.cancel'),

      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteMessage(contactMessage.id)
    });
  }

  private deleteMessage(id: string): void {
    this.deletingId.set(id);

    this.contactMessageService
      .deleteContactMessage(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe({
        next: () => {
          this.notify('adminMessages.deletedSuccess');
          this.load();
        },
        error: (err: unknown) => {
          if (
            err instanceof HttpErrorResponse &&
            (err.status === 401 || err.status === 403)
          ) {
            return;
          }

          this.messageService.add({
            severity: 'error',
            summary:  this.translate.instant('adminMessages.error'),
            detail:   this.errorMessage(err),
            life:     6000
          });
        }
      });
  }

  // ----------------------------------------------------------------
  // Dialogue de détail
  // ----------------------------------------------------------------
  openDetail(contactMessage: ContactMessage): void {
    this.selectedMessage.set(contactMessage);
    this.detailVisible = true;
  }

  // ----------------------------------------------------------------
  // Utilitaires
  // ----------------------------------------------------------------
  private notify(key: string): void {
    this.messageService.add({
      severity: 'success',
      summary:  this.translate.instant('adminMessages.success'),
      detail:   this.translate.instant(key),
      life:     3500
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;

      if (
        body &&
        typeof body.message === 'string' &&
        body.message.trim()
      ) {
        return body.message;
      }
    }

    return this.translate.instant('adminMessages.genericError');
  }
}