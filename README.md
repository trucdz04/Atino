# ATINO Purchase Analytics

Web application TypeScript kết nối Larkbase, hiển thị dữ liệu yêu cầu mua hàng, báo cáo tổng hợp và xác thực người dùng qua ATINO HUB.

## Công nghệ

- Next.js App Router + React + TypeScript strict
- TanStack Table
- Recharts
- Zod
- iron-session
- Vitest

## Cấu trúc dự án

```text
src/
├── app/                     # Routes, layouts và internal API
│   ├── (protected)/         # Các trang yêu cầu session hợp lệ
│   ├── api/                 # API cho browser; luôn kiểm tra session
│   ├── auth/                # Login, callback và logout
│   └── login/               # Giao diện đăng nhập
├── components/              # UI chia theo data, reports, layout, shared
├── domain/purchase/         # Types, validation và normalization
├── lib/                     # Hàm format dùng chung
└── server/                  # Code chỉ được chạy phía server
    ├── auth/                # OAuth client, state và session
    ├── config/              # Validation biến môi trường
    ├── http/                # Timeout/retry
    ├── lark/                # Token cache, pagination, data cache
    └── reports/             # Business rules tính KPI
tests/                       # Unit tests cho domain/report
```

Luồng phụ thuộc đi từ UI → internal API → service/repository → external API. Domain layer không phụ thuộc UI hoặc framework.

## Cài đặt và chạy local

Yêu cầu Node.js 20 trở lên.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Mở `http://localhost:5173`.

Điền các biến trong `.env.local` bằng thông tin được cấp riêng. Không commit file này.

Các lệnh kiểm tra:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## CI/CD

GitHub Actions chạy tự động trên pull request và mỗi lần push vào `main`:

1. Cài dependency bằng `npm ci`.
2. Audit production dependency ở mức `high` trở lên.
3. Chạy ESLint, TypeScript typecheck và unit test.
4. Build ứng dụng Next.js ở chế độ standalone.
5. Khi push vào `main`, lưu standalone build artifact trong 14 ngày.

Workflow nằm tại `.github/workflows/ci.yml`. Pipeline chỉ sử dụng placeholder an toàn trong bước build; credentials thật không được đưa vào GitHub Actions hoặc repository. Khi cần deploy production, cấu hình secrets trực tiếp trong GitHub/Vercel thay vì commit `.env.local`.

## Luồng xác thực

1. `/auth/login` sinh state ngẫu nhiên, lưu trong encrypted httpOnly cookie rồi redirect đến ATINO HUB.
2. `/auth/callback` kiểm tra state và thời hạn trước khi đổi authorization code lấy token.
3. Token và client secret chỉ được sử dụng ở server.
4. App gọi userinfo và tạo session riêng có thời hạn tối đa tám giờ.
5. Protected layout xác minh session cho page; mỗi API cũng xác minh session độc lập.
6. `/auth/logout` hủy session.

Redirect URI local phải là `http://localhost:5173/auth/callback`.

## Khảo sát và xử lý dữ liệu

Snapshot được khảo sát có:

- 568 line-items.
- 147 `Request No.` khác nhau.
- 86 request có nhiều hơn một line-item; request lớn nhất có 48 dòng.
- `Số lượng` và `Đơn giá` được trả về dạng chuỗi dù tên field gợi ý dữ liệu số.
- 46 dòng thiếu `Completed at`; toàn bộ thuộc `Under Review` trong snapshot khảo sát.
- 13 dòng thiếu `Hạng mục đầu tư` và 13 dòng thiếu `Tên nhà cung cấp`.
- Tên sản phẩm có khác biệt nhỏ về khoảng trắng/cách viết.

Normalization layer thực hiện:

- Timestamp milliseconds → ISO datetime.
- Quantity/unit price → number không âm.
- Field optional trống → `null`.
- Tên sản phẩm được trim và gộp khoảng trắng; không fuzzy-merge.
- `lineValue = quantity × unitPrice`.

Ứng dụng fail rõ ràng nếu field bắt buộc hoặc giá trị số/ngày không hợp lệ, thay vì âm thầm tạo KPI sai.

## Định nghĩa báo cáo

- **Tổng số yêu cầu:** số `Request No.` khác nhau, không phải số line-items.
- **Phân bổ trạng thái:** mỗi request được tính một lần. Nếu các dòng cùng request có nhiều trạng thái, dùng trạng thái của dòng có `Submitted at` mới nhất và hiển thị cảnh báo chất lượng dữ liệu.
- **Top 5 sản phẩm:** tổng quantity theo tên sản phẩm sau khi trim/gộp khoảng trắng và so sánh không phân biệt hoa thường.
- **Giá trị theo cơ sở:** tổng `quantity × unitPrice` của các line-items tại cơ sở đó.

Mọi báo cáo dùng cùng một normalized snapshot được cache phía server, tránh lệch dữ liệu giữa các widget.

## Cache và xử lý lỗi

- Lark tenant token được cache đến trước expiry 60 giây.
- Dữ liệu được cache in-memory theo `DATA_CACHE_TTL_MS`.
- Các request đồng thời dùng chung in-flight promise.
- External request có timeout, retry giới hạn cho lỗi mạng, HTTP 429 và 5xx.
- Pagination phát hiện page token bị thiếu/lặp và có giới hạn số trang.

## Bảo mật

- Không để Lark app secret hoặc ATINO client secret trong client bundle.
- Session cookie có `httpOnly`, `sameSite=lax` và `secure` ở production.
- OAuth state có thời hạn 10 phút và được so sánh constant-time.
- Page và API đều kiểm tra xác thực.
- Không ghi token/credentials vào log.

Thông tin kết nối trong tài liệu đề bài không nên xuất hiện trong repository public. Nên rotate secret sau đợt sử dụng nếu tài liệu đã được chia sẻ rộng.

## Giới hạn hiện tại

- Cache in-memory phù hợp bài test và single-instance; production nhiều instance nên dùng Redis hoặc shared cache.
- SSO của bản deploy có thể không hoạt động nếu ATINO HUB chỉ đăng ký redirect URI localhost.
- Không fuzzy-merge tên sản phẩm vì cần xác nhận nghiệp vụ trước khi gộp các tên gần giống nhau.
