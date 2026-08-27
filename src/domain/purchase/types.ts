export interface LarkPurchaseFields {
  "Request No.": unknown;
  Status: unknown;
  "Submitted at": unknown;
  "Completed at"?: unknown;
  "Nội dung_Tên sản phẩm": unknown;
  "Nội dung_Hạng mục đầu tư"?: unknown;
  "Nội dung_Cơ sở kinh doanh": unknown;
  "Nội dung_Số lượng": unknown;
  "Nội dung_Đơn giá": unknown;
  "Nội dung_Tên nhà cung cấp"?: unknown;
}

export interface LarkPurchaseRecord {
  recordId: string;
  fields: LarkPurchaseFields;
}

export interface PurchaseLine {
  recordId: string;
  requestNo: string;
  status: string;
  submittedAt: string;
  completedAt: string | null;
  productName: string;
  investmentCategory: string | null;
  businessLocation: string;
  quantity: number;
  unitPrice: number;
  supplierName: string | null;
  lineValue: number;
}

export interface PurchaseDataSet {
  items: PurchaseLine[];
  totalRecords: number;
  fetchedAt: string;
}

export interface StatusMetric {
  status: string;
  count: number;
}

export interface ProductMetric {
  productName: string;
  totalQuantity: number;
  lineCount: number;
}

export interface LocationValueMetric {
  businessLocation: string;
  totalValue: number;
}

export interface PurchaseReport {
  totalRequests: number;
  totalLineItems: number;
  totalValue: number;
  statusDistribution: StatusMetric[];
  topProducts: ProductMetric[];
  valueByLocation: LocationValueMetric[];
  dataQuality: {
    inconsistentRequestStatuses: number;
    missingCompletedAt: number;
    missingInvestmentCategory: number;
    missingSupplier: number;
  };
  fetchedAt: string;
}
