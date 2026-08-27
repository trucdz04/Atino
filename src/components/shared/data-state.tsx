export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div className="data-state" aria-live="polite" aria-busy="true">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="data-state" role="alert">
      <span className="state-icon">!</span>
      <strong>Không thể tải dữ liệu</strong>
      <p>{message}</p>
      <button className="button button-secondary" onClick={onRetry} type="button">
        Thử lại
      </button>
    </div>
  );
}
