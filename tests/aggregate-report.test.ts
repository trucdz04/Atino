import { describe, expect, it } from "vitest";

import type { PurchaseLine } from "@/domain/purchase/types";
import { buildPurchaseReport } from "@/server/reports/aggregate";

function line(overrides: Partial<PurchaseLine>): PurchaseLine {
  return {
    recordId: "record-default",
    requestNo: "REQ-1",
    status: "Approved",
    submittedAt: "2025-03-17T00:00:00.000Z",
    completedAt: "2025-03-19T00:00:00.000Z",
    productName: "Màn hình QR",
    investmentCategory: "Thiết bị",
    businessLocation: "Cầu Giấy",
    quantity: 1,
    unitPrice: 100,
    supplierName: "Supplier",
    lineValue: 100,
    ...overrides,
  };
}

describe("buildPurchaseReport", () => {
  it("counts requests separately from line-items", () => {
    const report = buildPurchaseReport([
      line({ recordId: "1" }),
      line({ recordId: "2", productName: "Bàn", lineValue: 200 }),
      line({ recordId: "3", requestNo: "REQ-2", status: "Under Review" }),
    ]);

    expect(report.totalRequests).toBe(2);
    expect(report.totalLineItems).toBe(3);
    expect(report.statusDistribution).toEqual([
      { status: "Approved", count: 1 },
      { status: "Under Review", count: 1 },
    ]);
  });

  it("aggregates product quantity and location value", () => {
    const report = buildPurchaseReport([
      line({ recordId: "1", quantity: 2, lineValue: 200 }),
      line({ recordId: "2", productName: " màn hình   QR ", quantity: 3, lineValue: 300 }),
      line({ recordId: "3", requestNo: "REQ-2", businessLocation: "Nhổn", lineValue: 500 }),
    ]);

    expect(report.topProducts[0]).toMatchObject({
      productName: "Màn hình QR",
      totalQuantity: 6,
      lineCount: 3,
    });
    expect(report.valueByLocation).toEqual([
      { businessLocation: "Cầu Giấy", totalValue: 500 },
      { businessLocation: "Nhổn", totalValue: 500 },
    ]);
    expect(report.totalValue).toBe(1_000);
  });

  it("uses the latest line status when a request is inconsistent", () => {
    const report = buildPurchaseReport([
      line({ recordId: "1", status: "Under Review" }),
      line({
        recordId: "2",
        status: "Approved",
        submittedAt: "2025-03-18T00:00:00.000Z",
      }),
    ]);

    expect(report.dataQuality.inconsistentRequestStatuses).toBe(1);
    expect(report.statusDistribution).toEqual([{ status: "Approved", count: 1 }]);
  });
});
