"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PurchaseReport } from "@/domain/purchase/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { ErrorState, LoadingState } from "@/components/shared/data-state";

const STATUS_COLORS: Record<string, string> = {
  Approved: "#168267",
  "Under Review": "#d9901a",
  Recalled: "#64748b",
  Rejected: "#c84855",
};

function CurrencyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { businessLocation: string } }>;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="chart-tooltip">
      <strong>{payload[0].payload.businessLocation}</strong>
      <span>{formatCurrency(payload[0].value)}</span>
    </div>
  );
}

export function ReportDashboard(): React.ReactElement {
  const [report, setReport] = useState<PurchaseReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reports");
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("Chưa thể tổng hợp báo cáo từ Larkbase.");
      const payload = (await response.json()) as { data: PurchaseReport };
      setReport(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Đã có lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  if (loading) return <LoadingState label="Đang tính toán báo cáo..." />;
  if (error) return <ErrorState message={error} onRetry={() => void loadReport()} />;
  if (!report) return <div className="data-state">Không có dữ liệu báo cáo.</div>;

  const locationChartData = report.valueByLocation.slice(0, 10);

  return (
    <div className="report-layout">
      <section className="metric-grid" aria-label="Chỉ số tổng quan">
        <article className="metric-card metric-primary">
          <span className="metric-icon">#</span>
          <p>Tổng yêu cầu</p>
          <strong>{formatNumber(report.totalRequests)}</strong>
          <small>Distinct Request No.</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon">▤</span>
          <p>Dòng sản phẩm</p>
          <strong>{formatNumber(report.totalLineItems)}</strong>
          <small>Line-items từ Larkbase</small>
        </article>
        <article className="metric-card metric-wide">
          <span className="metric-icon">₫</span>
          <p>Tổng giá trị yêu cầu</p>
          <strong>{formatCurrency(report.totalValue)}</strong>
          <small>Số lượng × Đơn giá</small>
        </article>
      </section>

      <section className="chart-grid">
        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">REQUEST LEVEL</p>
              <h2>Phân bổ trạng thái</h2>
            </div>
          </div>
          <div className="status-chart-layout">
            <div className="chart-container chart-container-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {report.statusDistribution.map((entry) => (
                      <Cell
                        fill={STATUS_COLORS[entry.status] ?? "#3267e3"}
                        key={entry.status}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              {report.statusDistribution.map((entry) => (
                <div key={entry.status}>
                  <span
                    className="legend-dot"
                    style={{ background: STATUS_COLORS[entry.status] ?? "#3267e3" }}
                  />
                  <span>{entry.status}</span>
                  <strong>{formatNumber(entry.count)}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">QUANTITY</p>
              <h2>Top 5 sản phẩm</h2>
            </div>
          </div>
          <ol className="ranking-list">
            {report.topProducts.map((product, index) => {
              const max = report.topProducts[0]?.totalQuantity || 1;
              return (
                <li key={product.productName}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <div className="ranking-copy">
                      <strong>{product.productName}</strong>
                      <span>{formatNumber(product.totalQuantity)}</span>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${(product.totalQuantity / max) * 100}%` }} />
                    </div>
                    <small>{product.lineCount} dòng yêu cầu</small>
                  </div>
                </li>
              );
            })}
          </ol>
        </article>
      </section>

      <section className="chart-card chart-card-full">
        <div className="card-heading">
          <div>
            <p className="eyebrow">TOP 10 LOCATIONS</p>
            <h2>Giá trị theo cơ sở kinh doanh</h2>
          </div>
          <span className="updated-at">Cập nhật {formatDate(report.fetchedAt)}</span>
        </div>
        <div className="chart-container chart-container-bar">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationChartData} margin={{ top: 8, right: 12, left: 8, bottom: 50 }}>
              <CartesianGrid stroke="#e9edf5" strokeDasharray="4 4" vertical={false} />
              <XAxis
                angle={-25}
                dataKey="businessLocation"
                height={80}
                interval={0}
                textAnchor="end"
                tick={{ fill: "#657087", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: "#657087", fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}tr`}
                width={54}
              />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="totalValue" fill="#3267e3" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {report.dataQuality.inconsistentRequestStatuses > 0 ? (
        <div className="alert alert-warning">
          Có {report.dataQuality.inconsistentRequestStatuses} yêu cầu chứa nhiều trạng thái. Báo cáo dùng
          trạng thái của dòng được gửi gần nhất.
        </div>
      ) : null}
    </div>
  );
}
