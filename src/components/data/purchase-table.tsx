"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { PurchaseDataSet, PurchaseLine } from "@/domain/purchase/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { ErrorState, LoadingState } from "@/components/shared/data-state";

const columnHelper = createColumnHelper<PurchaseLine>();

const columns = [
  columnHelper.accessor("requestNo", {
    header: "Request No.",
    cell: (context) => <strong className="request-number">{context.getValue()}</strong>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (context) => (
      <span className={`status status-${context.getValue().toLowerCase().replace(/\s+/g, "-")}`}>
        {context.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("submittedAt", {
    header: "Submitted at",
    cell: (context) => formatDate(context.getValue()),
  }),
  columnHelper.accessor("completedAt", {
    header: "Completed at",
    cell: (context) => formatDate(context.getValue()),
  }),
  columnHelper.accessor("productName", { header: "Nội dung_Tên sản phẩm" }),
  columnHelper.accessor("investmentCategory", {
    header: "Nội dung_Hạng mục đầu tư",
    cell: (context) => context.getValue() ?? "—",
  }),
  columnHelper.accessor("businessLocation", {
    header: "Nội dung_Cơ sở kinh doanh",
  }),
  columnHelper.accessor("quantity", {
    header: "Nội dung_Số lượng",
    cell: (context) => formatNumber(context.getValue()),
  }),
  columnHelper.accessor("unitPrice", {
    header: "Nội dung_Đơn giá",
    cell: (context) => <span className="money">{formatCurrency(context.getValue())}</span>,
  }),
  columnHelper.accessor("supplierName", {
    header: "Nội dung_Tên nhà cung cấp",
    cell: (context) => context.getValue() ?? "—",
  }),
];

export function PurchaseTable(): React.ReactElement {
  const [data, setData] = useState<PurchaseDataSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases");
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error("Nguồn dữ liệu Larkbase đang tạm thời gián đoạn.");
      const payload = (await response.json()) as { data: PurchaseDataSet };
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Đã có lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const tableData = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    data: tableData,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <LoadingState label="Đang đồng bộ dữ liệu từ Larkbase..." />;
  if (error) return <ErrorState message={error} onRetry={() => void loadData()} />;
  if (!data || data.items.length === 0) {
    return <div className="data-state">Không có yêu cầu mua hàng nào.</div>;
  }

  const pagination = table.getState().pagination;
  const start = pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(start + pagination.pageSize - 1, data.totalRecords);

  return (
    <section className="table-card">
      <div className="table-summary">
        <div>
          <strong>{formatNumber(data.totalRecords)}</strong>
          <span>dòng dữ liệu</span>
        </div>
        <p>Cập nhật {formatDate(data.fetchedAt)}</p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.original.recordId}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="pagination">
        <label>
          Hiển thị
          <select
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          dòng
        </label>
        <span>
          {start}–{end} / {data.totalRecords}
        </span>
        <div className="pagination-actions">
          <button
            className="icon-button bordered"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            ←
          </button>
          <button
            className="icon-button bordered"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
          >
            →
          </button>
        </div>
      </footer>
    </section>
  );
}
