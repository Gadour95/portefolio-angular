import {
  DestroyRef,
  Injectable,
  computed,
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
  TranslateService
} from '@ngx-translate/core';

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';

import {
  Observable,
  Subject,
  defer,
  finalize,
  switchMap,
  throwError
} from 'rxjs';

import {
  ApiError
} from '../../../../core/models/api-error.model';

import {
  AdminOrder,
  OrderStatus
} from '../models/order.model';

import {
  ORDER_ACTIONS_BY_STATUS,
  ORDER_ACTION_TARGETS,
  OrderAction,
  OrderChangeEvent,
  OrderStatusChangedError
} from '../models/order-action.model';

import {
  AdminOrderService
} from './admin-order.service';

interface RunningAction {
  orderId: string;
  action: OrderAction;
}

@Injectable()
export class AdminOrderActionsService {
  private readonly api = inject(AdminOrderService);

  private readonly translate = inject(TranslateService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly changesSubject =
    new Subject<OrderChangeEvent>();

  readonly changes$ = this.changesSubject.asObservable();

  readonly busy = signal<RunningAction | null>(null);
  readonly confirming = signal(false);

  readonly locked = computed(() =>
    this.busy() !== null || this.confirming()
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.confirming()) {
        this.confirmation.close();
      }
    });
  }

  availableActions(
    status: OrderStatus
  ): readonly OrderAction[] {
    return ORDER_ACTIONS_BY_STATUS[status];
  }

  isRunning(
    orderId: string,
    action: OrderAction
  ): boolean {
    const running = this.busy();

    return (
      running?.orderId === orderId &&
      running.action === action
    );
  }

  confirmationClosed(): void {
    this.confirming.set(false);
  }

  confirm(
    order: AdminOrder,
    action: OrderAction
  ): void {
    if (
      this.locked() ||
      !this.availableActions(order.status).includes(action)
    ) {
      return;
    }

    const orderId = order.id;
    const previousStatus = order.status;

    let messageKey = `orderActions.confirm.${action}`;

    if (
      action === 'reject' &&
      previousStatus === 'APPROVED'
    ) {
      messageKey = 'orderActions.confirm.rejectApproved';
    }

    if (
      action === 'deliver' &&
      previousStatus === 'APPROVED'
    ) {
      messageKey = 'orderActions.confirm.deliverDirect';
    }

    this.confirming.set(true);

    this.confirmation.confirm({
      header: this.translate.instant(
        `orderActions.labels.${action}`
      ),

      message: this.translate.instant(
        messageKey,
        { id: orderId }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        `orderActions.labels.${action}`
      ),

      rejectLabel: this.translate.instant(
        'adminCategories.cancel'
      ),

      acceptButtonStyleClass:
        action === 'reject' || action === 'archive'
          ? 'p-button-danger'
          : '',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => {
        this.confirming.set(false);

        this.execute(
          orderId,
          previousStatus,
          action
        );
      },

      reject: () => {
        this.confirming.set(false);
      }
    });
  }

  private execute(
    orderId: string,
    previousStatus: OrderStatus,
    action: OrderAction
  ): void {
    if (
      this.busy() ||
      !this.availableActions(previousStatus).includes(action)
    ) {
      return;
    }

    this.busy.set({
      orderId,
      action
    });

    defer(() => this.api.findById(orderId)).pipe(
      switchMap(current => {
        if (current.status !== previousStatus) {
          return throwError(
            () => new OrderStatusChangedError()
          );
        }

        return this.mutation(
          orderId,
          previousStatus,
          action
        );
      }),

      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.busy.set(null);
      })
    ).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',

          summary: this.translate.instant(
            'adminCategories.success'
          ),

          detail: this.translate.instant(
            `orderActions.done.${action}`
          ),

          life: 4000
        });

        this.changesSubject.next({
          orderId,
          previousStatus,

          status:
            action === 'archive'
              ? previousStatus
              : ORDER_ACTION_TARGETS[action],

          archived: action === 'archive'
        });
      },

      error: (error: unknown) => {
        const conflict =
          error instanceof OrderStatusChangedError ||
          (
            error instanceof HttpErrorResponse &&
            error.status === 409
          );

        if (conflict) {
          this.changesSubject.next({
            orderId,
            previousStatus,
            status: null,
            archived: false
          });
        }

        if (
          error instanceof HttpErrorResponse &&
          (error.status === 401 || error.status === 403)
        ) {
          return;
        }

        this.messages.add({
          severity: conflict ? 'warn' : 'error',

          summary: this.translate.instant(
            conflict
              ? 'orderActions.conflictTitle'
              : 'adminCategories.error'
          ),

          detail: this.errorMessage(error),

          life: 6000
        });
      }
    });
  }

  private mutation(
    orderId: string,
    currentStatus: OrderStatus,
    action: OrderAction
  ): Observable<unknown> {
    switch (action) {
      case 'approve':
        return this.api.approve(orderId);

      case 'reject':
        return currentStatus === 'PENDING'
          ? this.api.reject(orderId)
          : this.api.changeStatus(orderId, 'REJECTED');

      case 'ship':
        return this.api.ship(orderId);

      case 'deliver':
        return currentStatus === 'APPROVED'
          ? this.api.changeStatus(orderId, 'DELIVERED')
          : this.api.deliver(orderId);

      case 'archive':
        return this.api.archive(orderId);
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof OrderStatusChangedError) {
      return this.translate.instant(
        'orderActions.statusChanged'
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

      if (error.status === 0) {
        return this.translate.instant(
          'orderActions.networkError'
        );
      }
    }

    return this.translate.instant(
      'adminCategories.genericError'
    );
  }
}