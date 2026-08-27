import { ReportDashboard } from "@/components/reports/report-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export default function ReportPage(): React.ReactElement {
  return (
    <main className="page-content">
      <PageHeader
        eyebrow="PURCHASE ANALYTICS"
        title="Báo cáo tổng hợp"
        description="Các chỉ số được tính nhất quán từ cùng một snapshot dữ liệu Larkbase."
      />
      <ReportDashboard />
    </main>
  );
}
