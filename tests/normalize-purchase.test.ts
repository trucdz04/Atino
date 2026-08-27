import { describe, expect, it } from "vitest";

import {
  normalizeProductName,
  normalizePurchaseRecord,
  PurchaseNormalizationError,
} from "@/domain/purchase/normalize";

const validRecord = {
  recordId: "rec_1",
  fields: {
    "Request No.": " 202503190001 ",
    Status: "Approved",
    "Submitted at": 1_742_350_385_116,
    "Completed at": 1_742_356_650_620,
    "Nội dung_Tên sản phẩm": " Amply   APU MC60W ",
    "Nội dung_Hạng mục đầu tư": "Công cụ dụng cụ",
    "Nội dung_Cơ sở kinh doanh": "116 Cầu Giấy",
    "Nội dung_Số lượng": "2",
    "Nội dung_Đơn giá": "1500000",
    "Nội dung_Tên nhà cung cấp": "Nhà cung cấp A",
  },
};

describe("normalizePurchaseRecord", () => {
  it("converts raw Lark fields into a strict domain model", () => {
    expect(normalizePurchaseRecord(validRecord)).toEqual({
      recordId: "rec_1",
      requestNo: "202503190001",
      status: "Approved",
      submittedAt: new Date(1_742_350_385_116).toISOString(),
      completedAt: new Date(1_742_356_650_620).toISOString(),
      productName: "Amply APU MC60W",
      investmentCategory: "Công cụ dụng cụ",
      businessLocation: "116 Cầu Giấy",
      quantity: 2,
      unitPrice: 1_500_000,
      supplierName: "Nhà cung cấp A",
      lineValue: 3_000_000,
    });
  });

  it("accepts missing optional fields", () => {
    const normalized = normalizePurchaseRecord({
      ...validRecord,
      fields: {
        ...validRecord.fields,
        "Completed at": undefined,
        "Nội dung_Hạng mục đầu tư": undefined,
        "Nội dung_Tên nhà cung cấp": " ",
      },
    });

    expect(normalized.completedAt).toBeNull();
    expect(normalized.investmentCategory).toBeNull();
    expect(normalized.supplierName).toBeNull();
  });

  it("rejects an invalid numeric value with record context", () => {
    expect(() =>
      normalizePurchaseRecord({
        ...validRecord,
        fields: { ...validRecord.fields, "Nội dung_Số lượng": "not-a-number" },
      }),
    ).toThrow(PurchaseNormalizationError);
  });
});

describe("normalizeProductName", () => {
  it("trims and collapses whitespace without fuzzy merging", () => {
    expect(normalizeProductName("  Màn hình   QR  ")).toBe("Màn hình QR");
  });
});
