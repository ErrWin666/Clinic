export interface ProfitLossReport {
  startDate: string;
  endDate: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  items: {
    invoiceDisplayId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    costAmount: number;
    profit: number;
  }[];
}

export interface LowStockReport {
  items: {
    displayId: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    minQuantity: number;
    shortfall: number;
  }[];
  count: number;
}

export interface ExpiryReport {
  expiringSoon: {
    batchNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    expiryDate: string;
    unitCost: number;
    daysUntilExpiry: number;
  }[];
  expired: {
    batchNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    expiryDate: string;
    unitCost: number;
    daysExpired: number;
  }[];
}

export interface DeadStockReport {
  items: {
    displayId: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    totalCost: number;
    inactiveMonths: number;
  }[];
  count: number;
  totalValue: number;
}
