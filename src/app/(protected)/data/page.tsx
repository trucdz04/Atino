import { PurchaseTable } from "@/components/data/purchase-table";
import { PageHeader } from "@/components/shared/page-header";

export default function DataPage(): React.ReactElement {
  return (
    <main className="page-content">
      <PageHeader
        eyebrow="PURCHASE REQUESTS"
        title="Dữ liệu mua hàng"
        description="Danh sách chi tiết các dòng sản phẩm được đồng bộ từ Larkbase."
      />
      <PurchaseTable />
    </main>
  );
}
