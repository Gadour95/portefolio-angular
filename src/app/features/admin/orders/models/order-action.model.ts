import {
  OrderStatus
} from './order.model';

export type OrderTransitionAction =
  | 'approve'
  | 'reject'
  | 'ship'
  | 'deliver';

export type OrderAction =
  | OrderTransitionAction
  | 'archive';

export interface OrderChangeEvent {
  orderId: string;
  previousStatus: OrderStatus;

  // null : actualisation demandée après un conflit.
  status: OrderStatus | null;

  // L’archivage est distinct du statut métier.
  archived: boolean;
}

export const ORDER_ACTIONS_BY_STATUS: Record<
  OrderStatus,
  readonly OrderAction[]
> = {
  PENDING: ['approve', 'reject'],
  APPROVED: ['ship', 'deliver', 'reject'],
  SHIPPED: ['deliver'],
  REJECTED: ['archive'],
  CANCELLED: ['archive'],
  DELIVERED: ['archive']
};

export const ORDER_ACTION_TARGETS: Record<
  OrderTransitionAction,
  OrderStatus
> = {
  approve: 'APPROVED',
  reject: 'REJECTED',
  ship: 'SHIPPED',
  deliver: 'DELIVERED'
};

export class OrderStatusChangedError extends Error {
  constructor() {
    super('The order status changed');
    this.name = 'OrderStatusChangedError';
  }
}