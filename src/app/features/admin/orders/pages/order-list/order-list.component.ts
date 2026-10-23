import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';

import { JsonPipe } from '@angular/common';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import {
  takeUntilDestroyed,
  toObservable,
  toSignal
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';

import {
  PaginatorModule,
  PaginatorState
} from 'primeng/paginator';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import {
  Subject,
  Subscription,
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';

import {
  ApiError
} from '../../../../../core/models/api-error.model';

import {
  PageResponse
} from '../../../../../core/models/page-response.model';

import {
  LanguageService
} from '../../../../../core/services/language.service';

import {
  AdminOrder,
  ORDER_STATUSES,
  OrderContractError,
  OrderQuery,
  OrderStatus
} from '../../models/order.model';

import {
  AdminOrderService
} from '../../services/admin-order.service';

import {
  ConfirmationService
} from 'primeng/api';

import {
  ConfirmDialogModule
} from 'primeng/confirmdialog';

import {
  OrderActionsComponent
} from '../../components/order-actions.component';

import {
  OrderChangeEvent
} from '../../models/order-action.model';

import {
  AdminOrderActionsService
} from '../../services/admin-order-actions.service';

type OrderSeverity =
  | 'warn'
  | 'success'
  | 'danger'
  | 'info'
  | 'secondary';

interface OrderListState {
  data: PageResponse<AdminOrder> | null;
  loading: boolean;
  error: string | null;
}

function defaultQuery(): OrderQuery {
  return {
    search: '',
    statuses: [],
    page: 0,
    size: 20
  };
}

@Component({
  selector: 'app-order-list',
  standalone: true,

  imports: [
    JsonPipe,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    DialogModule,
    ImageModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    PaginatorModule,
    TableModule,
    TagModule,
    ToolbarModule,
    TooltipModule,
    ConfirmDialogModule,
    OrderActionsComponent,
  ],
  providers: [
  ConfirmationService,
  AdminOrderActionsService
],

  templateUrl: './order-list.component.html'
})
export class OrderListComponent {
  private readonly api = inject(AdminOrderService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refresh$ = new Subject<void>();

  private detailRequest?: Subscription;
  private proofRequest?: Subscription;

  readonly query = signal<OrderQuery>(defaultQuery());

  readonly filters = new FormGroup({
    search: new FormControl('', {
      nonNullable: true
    }),

    statuses: new FormControl<OrderStatus[]>([], {
      nonNullable: true
    })
  });

  readonly detailVisible = signal(false);
  readonly detailLoading = signal(false);
  readonly detail = signal<AdminOrder | null>(null);
  readonly detailError = signal<string | null>(null);

  readonly proofLoading = signal(false);
  readonly proofUrl = signal<string | null>(null);
  readonly proofUnavailable = signal(false);
  readonly proofError = signal<string | null>(null);

  readonly actions = inject(AdminOrderActionsService);



  readonly statusOptions = computed(() => {
    this.language.current();

    return ORDER_STATUSES.map(value => ({
      value,
      label: this.translate.instant(
        `statuses.${value}`
      )
    }));
  });

  readonly vm = toSignal(
    combineLatest([
      toObservable(this.query),
      this.refresh$.pipe(startWith(undefined))
    ]).pipe(
      switchMap(([query]) =>
        this.api.findAll(query).pipe(
          map(data => ({
            data,
            loading: false,
            error: null
          }) as OrderListState),

          catchError((error: unknown) =>
            of<OrderListState>({
              data: null,
              loading: false,
              error: this.errorMessage(error)
            })
          ),

          startWith<OrderListState>({
            data: null,
            loading: true,
            error: null
          })
        )
      )
    ),

    {
      initialValue: {
        data: null,
        loading: true,
        error: null
      } as OrderListState
    }
  );

      constructor() {
      this.actions.changes$.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(event => {
        this.refreshAfterAction(event);
      });

      this.destroyRef.onDestroy(() => {
        this.releaseProofUrl();
      });
    }

  applyFilters(): void {
    const values = this.filters.getRawValue();

    this.query.set({
      search: values.search.trim(),
      statuses: [...values.statuses],
      page: 0,
      size: this.query().size
    });
  }

  resetFilters(): void {
    this.filters.reset({
      search: '',
      statuses: []
    });

    this.query.set(defaultQuery());
  }

  reload(): void {
    this.refresh$.next();
  }

  changePage(event: PaginatorState): void {
    this.query.update(query => ({
      ...query,
      page: event.page ?? 0,
      size: event.rows ?? query.size
    }));
  }

  severity(status: OrderStatus): OrderSeverity {
    const severities: Record<OrderStatus, OrderSeverity> = {
      PENDING: 'warn',
      APPROVED: 'success',
      REJECTED: 'danger',
      SHIPPED: 'info',
      DELIVERED: 'success',
      CANCELLED: 'secondary'
    };

    return severities[status];
  }

  text(
    order: AdminOrder,
    field: string
  ): string {
    const value = order[field];

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
    }

    return '—';
  }

  openDetail(order: AdminOrder): void {
    this.cancelDetailRequests();
    this.resetProof();

    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.detailVisible.set(true);

    this.detailRequest = this.api.findById(order.id).pipe(
      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.detailLoading.set(false);
      })
    ).subscribe({
      next: detail => {
        this.detail.set(detail);
      },

      error: (error: unknown) => {
        this.detailError.set(
          this.errorMessage(error)
        );
      }
    });
  }

  loadPaymentProof(): void {
    const order = this.detail();

    if (!order || this.proofLoading()) {
      return;
    }

    this.proofRequest?.unsubscribe();
    this.resetProof();
    this.proofLoading.set(true);

    this.proofRequest = this.api
      .findPaymentProof(order.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.proofLoading.set(false);
        })
      )
      .subscribe({
        next: blob => {
          const mimeType = blob.type
            .split(';')[0]
            .trim()
            .toLowerCase();

          const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
          ];

          if (
            blob.size === 0 ||
            !allowedTypes.includes(mimeType)
          ) {
            this.proofError.set(
              this.translate.instant(
                'adminOrders.invalidProof'
              )
            );

            return;
          }

          this.proofUrl.set(
            URL.createObjectURL(blob)
          );
        },

        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            error.status === 404
          ) {
            this.proofUnavailable.set(true);
            return;
          }

          this.proofError.set(
            this.errorMessage(error)
          );
        }
      });
  }

  closeDetail(): void {
    this.cancelDetailRequests();
    this.resetProof();

    this.detailVisible.set(false);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  onDetailVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closeDetail();
    }
  }

  private cancelDetailRequests(): void {
    this.detailRequest?.unsubscribe();
    this.proofRequest?.unsubscribe();
  }

  private resetProof(): void {
    this.releaseProofUrl();

    this.proofLoading.set(false);
    this.proofUnavailable.set(false);
    this.proofError.set(null);
  }

  private releaseProofUrl(): void {
    const url = this.proofUrl();

    if (url) {
      URL.revokeObjectURL(url);
      this.proofUrl.set(null);
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof OrderContractError) {
      return this.translate.instant(
        'adminOrders.contractMismatch'
      );
    }

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

    return this.translate.instant(
      'adminCategories.genericError'
    );
  }


  private refreshAfterAction(
    event: OrderChangeEvent
    ): void {
      const query = this.query();
      const page = this.vm().data;

      const orderIsOnCurrentPage =
        page?.content.some(
          order => order.id === event.orderId
        ) ?? false;

      const leavesStatusFilter =
        event.status !== null &&
        query.statuses.length > 0 &&
        !query.statuses.includes(event.status);

      const leavesCurrentList =
        event.archived || leavesStatusFilter;

      if (
        leavesCurrentList &&
        orderIsOnCurrentPage &&
        query.page > 0 &&
        page?.content.length === 1
      ) {
        this.query.update(current => ({
          ...current,
          page: current.page - 1
        }));
      } else {
        this.reload();
      }

      const openedOrder = this.detail();

      if (
        this.detailVisible() &&
        openedOrder?.id === event.orderId
      ) {
        if (event.archived) {
          this.closeDetail();
        } else {
          this.openDetail(openedOrder);
        }
      }
    }


}