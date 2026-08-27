"use client";

export default function GlobalError({ reset }: { reset: () => void }): React.ReactElement {
  return (
    <main className="centered-page">
      <section className="state-card" role="alert">
        <span className="state-icon">!</span>
        <h1>Không thể tải trang</h1>
        <p>Đã có lỗi không mong muốn. Vui lòng thử lại.</p>
        <button className="button button-primary" onClick={reset} type="button">
          Thử lại
        </button>
      </section>
    </main>
  );
}
