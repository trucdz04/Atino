export default function Loading(): React.ReactElement {
  return (
    <main className="centered-page" aria-busy="true">
      <div className="spinner" aria-label="Đang tải" />
    </main>
  );
}
