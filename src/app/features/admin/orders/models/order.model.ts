export const ORDER_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
] as const;

export type OrderStatus =
  typeof ORDER_STATUSES[number];

export interface OrderQuery {
  search: string;
  statuses: OrderStatus[];
  page: number;
  size: number;
}

/**
 * Les autres propriétés restent inconnues tant que
 * le contrat exact des DTO n’est pas confirmé.
 */
export interface AdminOrder {
  id: string;
  status: OrderStatus;

  [field: string]: unknown;
}

export class OrderContractError extends Error {
  constructor() {
    super('The order response must expose id and status');
    this.name = 'OrderContractError';
  }
}

export function parseAdminOrder(
  value: unknown
): AdminOrder {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new OrderContractError();
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record['id'] !== 'string' ||
    typeof record['status'] !== 'string' ||
    !ORDER_STATUSES.includes(
      record['status'] as OrderStatus
    )
  ) {
    throw new OrderContractError();
  }

  return record as AdminOrder;
}