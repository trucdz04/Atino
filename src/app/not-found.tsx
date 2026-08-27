import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <main className="centered-page">
      <section className="state-card">
        <span className="eyebrow">404</span>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
        <Link className="button button-primary" href="/">
          Về trang chính
        </Link>
      </section>
    </main>
  );
}
