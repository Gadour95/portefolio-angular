export interface SalesKpis {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  totalDiscount: number;
  averageOrderValue: number;
}

export class StatisticsContractError extends Error {
  constructor() {
    super('Invalid sales statistics response');
    this.name = 'StatisticsContractError';
  }
}

export function parseSalesKpis(
  value: unknown
): SalesKpis {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new StatisticsContractError();
  }

  const record = value as Record<string, unknown>;

  const readNumber = (
    key: keyof SalesKpis
  ): number => {
    const number = record[key];

    if (
      typeof number !== 'number' ||
      !Number.isFinite(number)
    ) {
      throw new StatisticsContractError();
    }

    return number;
  };

  return {
    totalOrders: readNumber('totalOrders'),
    totalCustomers: readNumber('totalCustomers'),
    totalRevenue: readNumber('totalRevenue'),
    totalCost: readNumber('totalCost'),
    totalMargin: readNumber('totalMargin'),
    totalDiscount: readNumber('totalDiscount'),
    averageOrderValue: readNumber('averageOrderValue')
  };
}