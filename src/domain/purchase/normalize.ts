import type {
  LarkPurchaseFields,
  LarkPurchaseRecord,
  PurchaseLine,
} from "@/domain/purchase/types";

export class PurchaseNormalizationError extends Error {
  constructor(
    public readonly recordId: string,
    public readonly field: string,
    message: string,
  ) {
    super(`Record ${recordId}, field "${field}": ${message}`);
    this.name = "PurchaseNormalizationError";
  }
}

function requiredText(value: unknown, recordId: string, field: string): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new PurchaseNormalizationError(recordId, field, "expected text");
  }

  const normalized = String(value).trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new PurchaseNormalizationError(recordId, field, "value is empty");
  }
  return normalized;
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized || null;
}

function requiredNumber(value: unknown, recordId: string, field: string): number {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new PurchaseNormalizationError(recordId, field, "expected a number");
  }

  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new PurchaseNormalizationError(
      recordId,
      field,
      `invalid non-negative number: ${String(value)}`,
    );
  }
  return parsed;
}

function timestampToIso(
  value: unknown,
  recordId: string,
  field: string,
  optional = false,
): string | null {
  if ((value === null || value === undefined || value === "") && optional) {
    return null;
  }

  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds)) {
    throw new PurchaseNormalizationError(recordId, field, "invalid timestamp");
  }

  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    throw new PurchaseNormalizationError(recordId, field, "invalid date");
  }
  return date.toISOString();
}

export function normalizeProductName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizePurchaseRecord(record: LarkPurchaseRecord): PurchaseLine {
  const fields: LarkPurchaseFields = record.fields;
  const quantity = requiredNumber(
    fields["Nội dung_Số lượng"],
    record.recordId,
    "Nội dung_Số lượng",
  );
  const unitPrice = requiredNumber(
    fields["Nội dung_Đơn giá"],
    record.recordId,
    "Nội dung_Đơn giá",
  );

  return {
    recordId: record.recordId,
    requestNo: requiredText(fields["Request No."], record.recordId, "Request No."),
    status: requiredText(fields.Status, record.recordId, "Status"),
    submittedAt: timestampToIso(
      fields["Submitted at"],
      record.recordId,
      "Submitted at",
    ) as string,
    completedAt: timestampToIso(
      fields["Completed at"],
      record.recordId,
      "Completed at",
      true,
    ),
    productName: normalizeProductName(
      requiredText(
        fields["Nội dung_Tên sản phẩm"],
        record.recordId,
        "Nội dung_Tên sản phẩm",
      ),
    ),
    investmentCategory: optionalText(fields["Nội dung_Hạng mục đầu tư"]),
    businessLocation: requiredText(
      fields["Nội dung_Cơ sở kinh doanh"],
      record.recordId,
      "Nội dung_Cơ sở kinh doanh",
    ),
    quantity,
    unitPrice,
    supplierName: optionalText(fields["Nội dung_Tên nhà cung cấp"]),
    lineValue: quantity * unitPrice,
  };
}
