import type {
  LocationValueMetric,
  ProductMetric,
  PurchaseLine,
  PurchaseReport,
  StatusMetric,
} from "@/domain/purchase/types";

function normalizedProductKey(productName: string): string {
  return productName.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
}

export function buildPurchaseReport(
  items: PurchaseLine[],
  fetchedAt = new Date().toISOString(),
): PurchaseReport {
  const requests = new Map<string, PurchaseLine[]>();
  for (const item of items) {
    const requestLines = requests.get(item.requestNo) ?? [];
    requestLines.push(item);
    requests.set(item.requestNo, requestLines);
  }

  const statusCounts = new Map<string, number>();
  let inconsistentRequestStatuses = 0;
  for (const lines of requests.values()) {
    const statuses = new Set(lines.map((line) => line.status));
    if (statuses.size > 1) inconsistentRequestStatuses += 1;

    const latestLine = [...lines].sort(
      (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
    )[0];
    statusCounts.set(latestLine.status, (statusCounts.get(latestLine.status) ?? 0) + 1);
  }

  const statusDistribution: StatusMetric[] = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  const products = new Map<
    string,
    { displayName: string; totalQuantity: number; lineCount: number }
  >();
  for (const item of items) {
    const key = normalizedProductKey(item.productName);
    const product = products.get(key) ?? {
      displayName: item.productName,
      totalQuantity: 0,
      lineCount: 0,
    };
    product.totalQuantity += item.quantity;
    product.lineCount += 1;
    products.set(key, product);
  }

  const topProducts: ProductMetric[] = [...products.values()]
    .map((product) => ({
      productName: product.displayName,
      totalQuantity: product.totalQuantity,
      lineCount: product.lineCount,
    }))
    .sort(
      (a, b) =>
        b.totalQuantity - a.totalQuantity ||
        b.lineCount - a.lineCount ||
        a.productName.localeCompare(b.productName, "vi"),
    )
    .slice(0, 5);

  const locations = new Map<string, number>();
  for (const item of items) {
    locations.set(
      item.businessLocation,
      (locations.get(item.businessLocation) ?? 0) + item.lineValue,
    );
  }

  const valueByLocation: LocationValueMetric[] = [...locations.entries()]
    .map(([businessLocation, totalValue]) => ({ businessLocation, totalValue }))
    .sort((a, b) => b.totalValue - a.totalValue);

  return {
    totalRequests: requests.size,
    totalLineItems: items.length,
    totalValue: items.reduce((sum, item) => sum + item.lineValue, 0),
    statusDistribution,
    topProducts,
    valueByLocation,
    dataQuality: {
      inconsistentRequestStatuses,
      missingCompletedAt: items.filter((item) => item.completedAt === null).length,
      missingInvestmentCategory: items.filter(
        (item) => item.investmentCategory === null,
      ).length,
      missingSupplier: items.filter((item) => item.supplierName === null).length,
    },
    fetchedAt,
  };
}
