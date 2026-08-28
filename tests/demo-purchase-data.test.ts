import { describe, expect, it } from "vitest";

import { getDemoPurchaseData } from "@/server/demo/purchase-data";
import { buildPurchaseReport } from "@/server/reports/aggregate";

describe("deployment demo data", () => {
  it("returns a detached, synthetic purchase dataset", () => {
    const first = getDemoPurchaseData();
    const second = getDemoPurchaseData();

    expect(first.totalRecords).toBe(8);
    expect(first.items).not.toBe(second.items);
    expect(first.items.every((item) => item.requestNo.startsWith("DEMO-"))).toBe(true);
    expect(first.items.every((item) => item.recordId.startsWith("demo-"))).toBe(true);
  });

  it("can build all report metrics without Larkbase", () => {
    const data = getDemoPurchaseData();
    const report = buildPurchaseReport(data.items, data.fetchedAt);

    expect(report.totalRequests).toBe(6);
    expect(report.totalLineItems).toBe(8);
    expect(report.statusDistribution).toEqual([
      { status: "Approved", count: 3 },
      { status: "Recalled", count: 1 },
      { status: "Rejected", count: 1 },
      { status: "Under Review", count: 1 },
    ]);
    expect(report.topProducts).toHaveLength(5);
    expect(report.valueByLocation).toHaveLength(3);
  });
});
