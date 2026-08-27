# Kế hoạch triển khai Web App báo cáo mua hàng

## 1. Mục tiêu

Xây dựng web application bằng TypeScript có các chức năng:

- Đăng nhập SSO qua ATINO HUB.
- Lấy đầy đủ dữ liệu mua hàng từ Larkbase ở phía server.
- Hiển thị bảng dữ liệu gồm 10 cột theo đúng yêu cầu.
- Hiển thị báo cáo tổng hợp và biểu đồ.
- Bảo vệ trang dữ liệu, trang báo cáo và API bằng session.
- Có source code, README, ảnh chụp và bản deploy giao diện.

## 2. Các nguyên tắc dữ liệu đã xác định

- Larkbase hiện có **568 dòng hàng** nhưng chỉ có **147 Request No. khác nhau**.
- Một yêu cầu có thể chứa nhiều dòng sản phẩm; số dòng tối đa ghi nhận trong một yêu cầu là 48.
- "Tổng số yêu cầu" phải tính bằng `COUNT(DISTINCT Request No.)`, không dùng tổng số record.
- `Số lượng` và `Đơn giá` được API trả về dưới dạng chuỗi, cần chuyển thành số tại normalization layer.
- `Completed at` có thể trống đối với yêu cầu `Under Review`; đây là dữ liệu hợp lệ.
- `Hạng mục đầu tư` và `Tên nhà cung cấp` có thể trống.
- Tổng giá trị một dòng được tính bằng `Số lượng × Đơn giá`.
- Không fuzzy-merge tên sản phẩm trong phiên bản đầu; chỉ trim và chuẩn hóa khoảng trắng.

## 3. Thứ tự triển khai

```text
Khởi tạo dự án
  → Kết nối Larkbase
  → Phân trang và chuẩn hóa dữ liệu
  → Trang Dữ liệu
  → Báo cáo tổng hợp
  → SSO ATINO
  → Bảo vệ route/API
  → Test và đối soát
  → README, screenshot và deploy
```

## 4. P0 — Các task bắt buộc

### Giai đoạn A — Khởi tạo dự án (ước tính: 30–45 phút)

- [x] **SET-01 — Khởi tạo Next.js với TypeScript**
  - Bật TypeScript `strict`.
  - Cấu hình chạy local tại `http://localhost:5173`.
  - Thiết lập ESLint và formatter.
  - **Hoàn thành khi:** dự án build được và trang chủ mở được ở port 5173.

- [x] **SET-02 — Cài các thư viện cần thiết**
  - UI/table: TanStack Table.
  - Chart: Recharts.
  - Validation: Zod.
  - Session: `iron-session` hoặc giải pháp cookie session tương đương.
  - Test: Vitest.
  - **Hoàn thành khi:** dependency được khóa trong lockfile và không có package không sử dụng.

- [x] **SET-03 — Thiết lập biến môi trường**
  - Khai báo cấu hình Larkbase, ATINO HUB, session secret và app URL.
  - Tạo `.env.example` chỉ chứa tên biến và giá trị mẫu an toàn.
  - Thêm `.env`, `.env.local` và các file secret vào `.gitignore`.
  - Validate biến môi trường khi server khởi động.
  - **Hoàn thành khi:** thiếu biến bắt buộc sẽ báo lỗi rõ ràng và không secret nào bị commit.

- [x] **SET-04 — Tạo cấu trúc thư mục**
  - Tách `app`, `components`, `domain`, `server`, `lib` và `tests`.
  - Không đặt logic gọi API hoặc tính KPI trực tiếp trong React component.
  - **Hoàn thành khi:** UI, domain logic và external API client có ranh giới rõ ràng.

### Giai đoạn B — Kết nối Larkbase (ước tính: 60–90 phút)

- [x] **LARK-01 — Tạo Larkbase server client**
  - Viết hàm lấy tenant access token bằng app credentials.
  - Chỉ chạy hàm ở server.
  - Kiểm tra cả HTTP status và mã lỗi trong response body.
  - **Hoàn thành khi:** lấy được token hợp lệ và client bundle không chứa app secret.

- [x] **LARK-02 — Cache access token**
  - Lưu token và thời điểm hết hạn trong memory.
  - Làm mới token trước expiry khoảng 60 giây.
  - Dùng chung promise khi nhiều request đồng thời cùng yêu cầu token mới.
  - **Hoàn thành khi:** nhiều lần tải dữ liệu không tạo token mới cho mỗi request.

- [x] **LARK-03 — Xử lý lỗi khi lấy token**
  - Xử lý sai credentials, timeout, lỗi mạng và response không hợp lệ.
  - Không đưa token hoặc credentials vào log/thông báo lỗi.
  - **Hoàn thành khi:** lỗi được chuyển thành thông báo nội bộ an toàn và có thể truy vết.

- [x] **LARK-04 — Viết hàm lấy toàn bộ record có phân trang**
  - Dùng `page_size` phù hợp.
  - Lặp theo `has_more` và `page_token` đến hết dữ liệu.
  - Có cơ chế tránh vòng lặp vô hạn nếu API trả lại page token cũ.
  - **Hoàn thành khi:** lấy đủ 568 record, gồm trang đầu 500 và trang tiếp theo 68 record.

- [x] **LARK-05 — Thêm timeout và retry**
  - Timeout mỗi external request trong khoảng 8–10 giây.
  - Retry tối đa hai lần cho lỗi mạng, HTTP 429 và 5xx.
  - Dùng exponential backoff; không retry lỗi credentials hoặc lỗi validation.
  - **Hoàn thành khi:** lỗi tạm thời được thử lại có giới hạn và không treo request.

### Giai đoạn C — Type và chuẩn hóa dữ liệu (ước tính: 45–60 phút)

- [x] **DATA-01 — Khai báo kiểu dữ liệu thô**
  - Khai báo type cho response, record và 10 field cần sử dụng.
  - Không dùng `any`; dữ liệu ngoài hệ thống chưa kiểm tra phải bắt đầu từ `unknown`.
  - **Hoàn thành khi:** TypeScript strict không báo lỗi và không có `any` trong data layer.

- [x] **DATA-02 — Validate response bằng schema**
  - Kiểm tra cấu trúc response trước khi sử dụng.
  - Cho phép các field hợp lệ có thể thiếu như `Completed at`, hạng mục và nhà cung cấp.
  - **Hoàn thành khi:** response sai cấu trúc không làm ứng dụng crash âm thầm.

- [x] **DATA-03 — Tạo normalized `PurchaseLine` model**
  - Timestamp milliseconds → `Date`.
  - `Số lượng` và `Đơn giá` → number.
  - Chuỗi rỗng → `null` với field optional.
  - Tính `lineValue = quantity × unitPrice`.
  - Giữ lại `recordId` và `requestNo` để truy vết.
  - **Hoàn thành khi:** UI và report chỉ sử dụng normalized model.

- [x] **DATA-04 — Chuẩn hóa tên sản phẩm**
  - Trim đầu/cuối.
  - Gộp nhiều khoảng trắng liên tiếp.
  - Không tự động fuzzy-merge các tên gần giống nhau.
  - **Hoàn thành khi:** quy tắc chuẩn hóa có unit test và được ghi trong README.

- [x] **DATA-05 — Kiểm tra chất lượng dữ liệu**
  - Đếm record lỗi số, ngày hoặc thiếu field bắt buộc.
  - Kiểm tra các dòng cùng `Request No.` có status nhất quán hay không.
  - Ghi nhận field optional bị thiếu.
  - **Hoàn thành khi:** các bất thường và cách xử lý được ghi lại để đưa vào README.

### Giai đoạn D — Trang Dữ liệu (ước tính: 60–90 phút)

- [x] **UI-01 — Tạo API dữ liệu nội bộ**
  - Tạo server route trả normalized records.
  - Không trả Lark token hoặc thông tin cấu hình ra client.
  - Chuẩn hóa cấu trúc success/error response.
  - **Hoàn thành khi:** client lấy được dữ liệu qua API của ứng dụng.

- [x] **UI-02 — Tạo trang `/data`**
  - Hiển thị đúng thứ tự 10 cột:
    1. Request No.
    2. Status
    3. Submitted at
    4. Completed at
    5. Nội dung_Tên sản phẩm
    6. Nội dung_Hạng mục đầu tư
    7. Nội dung_Cơ sở kinh doanh
    8. Nội dung_Số lượng
    9. Nội dung_Đơn giá
    10. Nội dung_Tên nhà cung cấp
  - **Hoàn thành khi:** đủ 10 cột, đúng thứ tự và map đúng dữ liệu.

- [x] **UI-03 — Format dữ liệu theo `vi-VN`**
  - Ngày giờ dùng `Intl.DateTimeFormat('vi-VN')`.
  - Tiền dùng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
  - Field trống hiển thị `—`; riêng ngày chưa hoàn thành có thể hiển thị `Chưa hoàn thành`.
  - **Hoàn thành khi:** số, tiền và ngày dễ đọc, không hiển thị timestamp thô.

- [x] **UI-04 — Thêm pagination phía UI**
  - Hỗ trợ 20/50/100 dòng mỗi trang.
  - Hiển thị tổng số dòng và vị trí trang hiện tại.
  - **Hoàn thành khi:** người dùng duyệt được toàn bộ 568 dòng mà UI không bị quá tải.

- [x] **UI-05 — Thêm các trạng thái giao diện**
  - Loading hoặc skeleton.
  - Empty state.
  - Error state có nút thử lại.
  - **Hoàn thành khi:** không có trạng thái màn hình trắng trong lúc tải hoặc khi API lỗi.

### Giai đoạn E — Báo cáo tổng hợp (ước tính: 60–90 phút)

- [x] **REPORT-01 — Tạo hàm gom dữ liệu theo request**
  - Group line-items theo `Request No.`.
  - Kiểm tra status giữa các dòng của cùng một request.
  - **Hoàn thành khi:** có collection cấp request dùng cho KPI request-level.

- [x] **REPORT-02 — Tính tổng số yêu cầu**
  - Dùng số lượng `Request No.` khác nhau.
  - Giá trị đối soát hiện tại: 147.
  - **Hoàn thành khi:** không trả về 568 cho KPI này.

- [x] **REPORT-03 — Tính phân bổ trạng thái**
  - Đếm trạng thái theo request thay vì theo dòng hàng.
  - Tổng các nhóm phải bằng tổng số request.
  - **Hoàn thành khi:** kết quả nhất quán với định nghĩa trong README.

- [x] **REPORT-04 — Tính Top 5 sản phẩm**
  - Group theo tên sản phẩm đã chuẩn hóa.
  - Tổng hợp theo tổng số lượng.
  - Sort giảm dần; định nghĩa tie-breaker rõ ràng.
  - **Hoàn thành khi:** kết quả có thể tái tạo bằng unit test.

- [x] **REPORT-05 — Tính tổng giá trị theo cơ sở kinh doanh**
  - Tính giá trị từng dòng bằng `quantity × unitPrice`.
  - Group và sum theo cơ sở kinh doanh.
  - **Hoàn thành khi:** tổng theo cơ sở cộng lại bằng tổng giá trị toàn bộ line-items.

- [x] **REPORT-06 — Tạo trang `/report`**
  - KPI card cho tổng yêu cầu.
  - Biểu đồ phân bổ trạng thái.
  - Biểu đồ/bảng Top 5 sản phẩm.
  - Biểu đồ/bảng giá trị theo cơ sở.
  - Format số và tiền theo `vi-VN`.
  - **Hoàn thành khi:** đủ bốn báo cáo, có loading/error và responsive cơ bản.

### Giai đoạn F — SSO ATINO (ước tính: 75–105 phút)

- [x] **AUTH-01 — Tạo trang đăng nhập**
  - Có nút `Login with ATINO`.
  - Giao diện không tải dữ liệu Larkbase trước khi user đăng nhập.
  - **Hoàn thành khi:** user chưa đăng nhập chỉ thấy trang login.

- [x] **AUTH-02 — Tạo login route**
  - Sinh `state` ngẫu nhiên có entropy đủ mạnh.
  - Lưu state trong cookie ngắn hạn, `httpOnly`, `sameSite=lax`.
  - Redirect đến Authorization URL với đủ tham số cần thiết.
  - **Hoàn thành khi:** click login chuyển đúng đến ATINO HUB.

- [x] **AUTH-03 — Xử lý callback thành công**
  - Kiểm tra `state` bằng constant-time comparison nếu phù hợp.
  - Từ chối callback thiếu code hoặc state sai/hết hạn.
  - Đổi authorization code lấy token ở server.
  - Gọi userinfo ở server.
  - **Hoàn thành khi:** đăng nhập thành công quay lại app và hiển thị thông tin user.

- [x] **AUTH-04 — Xử lý callback thất bại**
  - Xử lý user từ chối quyền.
  - Xử lý code hết hạn, code đã dùng, timeout và response lỗi.
  - Xóa state cookie sau callback.
  - **Hoàn thành khi:** lỗi được hiển thị thân thiện và không tạo session.

- [x] **AUTH-05 — Tạo session ứng dụng**
  - Dùng cookie `httpOnly`, `sameSite=lax` và `secure` ở production.
  - Chỉ lưu thông tin user tối thiểu và thời điểm hết hạn.
  - Không lưu client secret trong cookie.
  - **Hoàn thành khi:** refresh trang vẫn giữ đăng nhập trong thời hạn session.

- [x] **AUTH-06 — Hiển thị user và logout**
  - Hiển thị tên/email hoặc thông tin phù hợp từ userinfo.
  - Logout xóa session và đưa user về trang login.
  - **Hoàn thành khi:** session cũ không dùng lại được sau logout.

- [x] **AUTH-07 — Bảo vệ page và API**
  - Chặn `/data` và `/report` khi chưa đăng nhập.
  - Chặn API dữ liệu/report ở server, không chỉ chặn bằng UI.
  - Redirect page request về login; API trả `401`.
  - **Hoàn thành khi:** gọi trực tiếp URL/API không thể vượt qua xác thực.

### Giai đoạn G — Cache và hiệu năng (ước tính: 30–45 phút)

- [x] **PERF-01 — Cache dữ liệu Larkbase**
  - Cache normalized records phía server trong 1–5 phút.
  - Dùng chung in-flight promise để tránh nhiều request đồng thời gọi Larkbase.
  - **Hoàn thành khi:** chuyển `/data` ↔ `/report` không refetch toàn bộ dữ liệu liên tục.

- [x] **PERF-02 — Tái sử dụng dữ liệu cho report**
  - Report service đọc cùng normalized dataset với data page.
  - Không tạo hai luồng fetch Larkbase độc lập.
  - **Hoàn thành khi:** mọi KPI dùng cùng một snapshot dữ liệu.

### Giai đoạn H — Test và đối soát (ước tính: 45–60 phút)

- [ ] **TEST-01 — Test token cache**
  - Token còn hạn được dùng lại.
  - Token gần hết hạn được làm mới.
  - Request đồng thời không tạo nhiều token mới.

- [ ] **TEST-02 — Test pagination**
  - Một trang không có `has_more`.
  - Nhiều trang với page token.
  - API lỗi ở trang giữa.
  - Page token bị lặp.

- [ ] **TEST-03 — Test normalization**
  - Chuyển timestamp, quantity, unit price đúng.
  - Field optional bị thiếu.
  - Giá trị số hoặc ngày không hợp lệ.
  - Chuẩn hóa khoảng trắng tên sản phẩm.

- [x] **TEST-04 — Test report aggregations**
  - Nhiều line-item thuộc cùng một request chỉ được đếm một yêu cầu.
  - Status distribution cộng lại bằng tổng request.
  - Top sản phẩm tính theo tổng quantity.
  - Giá trị cơ sở tính bằng `quantity × unitPrice`.

- [ ] **TEST-05 — Test auth và route protection**
  - State đúng/sai/hết hạn.
  - Callback thành công và bị từ chối.
  - User chưa đăng nhập gọi page/API.
  - Logout xóa session.

- [x] **TEST-06 — Đối soát dữ liệu thật**
  - Tổng record: 568.
  - Tổng request khác nhau: 147.
  - `Số lượng` và `Đơn giá` parse được cho toàn bộ dữ liệu hiện tại.
  - 46 dòng thiếu `Completed at` đều thuộc `Under Review`.
  - **Hoàn thành khi:** số liệu lệch phải được điều tra trước khi nộp.

### Giai đoạn I — README và bàn giao (ước tính: 45–60 phút)

- [x] **DOC-01 — Viết hướng dẫn cài đặt**
  - Yêu cầu Node.js.
  - Các lệnh install, dev, test và build.
  - URL mở local.
  - Danh sách biến môi trường cần điền nhưng không chứa secret thật.

- [x] **DOC-02 — Viết phần Data findings**
  - Giải thích 568 line-items và 147 requests.
  - Các field optional và cách hiển thị.
  - Kiểu chuỗi của quantity/unit price và cách parse.
  - Vấn đề tên sản phẩm chưa chuẩn hóa.

- [x] **DOC-03 — Viết phần KPI definitions**
  - Tổng yêu cầu = distinct request number.
  - Status distribution = request-level.
  - Top product = tổng quantity theo tên đã chuẩn hóa tối thiểu.
  - Giá trị cơ sở = tổng quantity nhân unit price.

- [ ] **DOC-04 — Thêm ảnh chụp**
  - Trang Login.
  - Trang Dữ liệu.
  - Trang Báo cáo.
  - Không để secret/token xuất hiện trong ảnh.

- [ ] **DOC-05 — Deploy giao diện**
  - Deploy lên Vercel hoặc nền tảng tương đương.
  - Kiểm tra build production.
  - Ghi rõ SSO production không bắt buộc hoạt động do redirect URI chỉ đăng ký localhost.

- [ ] **DOC-06 — Kiểm tra repository trước khi gửi**
  - Repository public và clone/build được từ đầu.
  - Không có `.env`, token, credentials hoặc log nhạy cảm.
  - Ghi rõ phần chưa hoàn thành nếu có.
  - Đính kèm link deploy nếu đã có.

## 5. P1 — Task nên làm để lấy điểm thưởng

- [x] **BONUS-01 — Tạo error boundary cho từng trang.**
- [ ] **BONUS-02 — Thêm filter theo trạng thái, cơ sở và thời gian.**
- [ ] **BONUS-03 — Thêm tìm kiếm theo Request No. và sản phẩm.**
- [ ] **BONUS-04 — Thêm sort cho các cột bảng.**
- [x] **BONUS-05 — Thêm sticky header và responsive table.**
- [x] **BONUS-06 — Thêm skeleton loading.**
- [ ] **BONUS-07 — Thêm smoke test bằng Playwright.**
- [ ] **BONUS-08 — Thêm log có cấu trúc nhưng che token/secret.**
- [ ] **BONUS-09 — Hiển thị thời điểm dữ liệu được cập nhật gần nhất.**

## 6. P2 — Task mở rộng khi còn thời gian

- [ ] Xuất dữ liệu CSV.
- [ ] Đồng bộ filter giữa URL và UI.
- [ ] Lọc report theo khoảng ngày.
- [ ] Drill-down từ biểu đồ xuống danh sách dòng hàng.
- [ ] Thêm manual alias map cho các tên sản phẩm đã được nghiệp vụ xác nhận là cùng một sản phẩm.
- [ ] Thêm telemetry và theo dõi lỗi production.

## 7. Kế hoạch thời gian một ngày

| Khung thời gian | Công việc | Kết quả cần đạt |
|---|---|---|
| 08:30–09:15 | SET + khảo sát dữ liệu | Project chạy, env/schema được định nghĩa |
| 09:15–10:30 | LARK-01 đến LARK-05 | Lấy đủ 568 record có token cache và pagination |
| 10:30–11:15 | DATA-01 đến DATA-05 | Có normalized `PurchaseLine[]` |
| 11:15–12:30 | UI-01 đến UI-05 | Trang `/data` hoàn chỉnh |
| 13:30–14:45 | REPORT-01 đến REPORT-06 | Trang `/report` đủ bốn KPI |
| 14:45–16:15 | AUTH-01 đến AUTH-07 | Login, callback, session, logout, route protection |
| 16:15–17:00 | PERF + test chính | Cache, unit test và đối soát dữ liệu |
| 17:00–18:00 | README + screenshot + deploy | Repository sẵn sàng nộp |

## 8. Definition of Done chung

Một task chỉ được đánh dấu hoàn thành khi:

- Code chạy được và không có lỗi TypeScript/ESLint liên quan.
- Có xử lý loading, error hoặc edge case phù hợp.
- Không làm lộ secret, token hay credentials.
- Logic quan trọng có unit test hoặc được đối soát bằng dữ liệu thật.
- README được cập nhật nếu task làm thay đổi setup, giả định hoặc định nghĩa KPI.

## 9. Checklist trước khi nộp

- [ ] `npm install` và `npm run dev` hoạt động từ một bản clone mới.
- [ ] `npm run test` pass.
- [ ] `npm run build` pass.
- [ ] Web chạy local tại port 5173.
- [ ] Lấy đủ 568 dòng Larkbase.
- [ ] KPI tổng yêu cầu trả về 147 với snapshot dữ liệu hiện tại.
- [ ] Bảng có đủ 10 cột và đúng thứ tự.
- [ ] Báo cáo có đủ bốn chỉ số.
- [ ] User chưa đăng nhập không truy cập được page hoặc API được bảo vệ.
- [ ] Login, callback lỗi, logout đều hoạt động.
- [ ] Không có `any` trong domain/data layer.
- [ ] Không có secret trong source, Git history, log hoặc screenshot.
- [ ] README nêu rõ data findings và định nghĩa KPI.
- [ ] Có ba ảnh chụp yêu cầu.
- [ ] Có link repository và link deploy nếu hoàn thành.

## 10. Lưu ý bảo mật quan trọng

Tài liệu nguồn hiện chứa thông tin kết nối và tài khoản test. Tuyệt đối không sao chép các giá trị thật vào source code hoặc tài liệu public. Nên thay đổi các secret sau đợt tuyển dụng hoặc ngay khi không còn cần thiết, đặc biệt nếu link tài liệu đang được chia sẻ công khai.
