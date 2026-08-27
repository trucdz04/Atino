import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "ATINO Purchase Analytics",
  description: "Báo cáo dữ liệu yêu cầu mua hàng từ Larkbase",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
