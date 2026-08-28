import { redirect } from "next/navigation";

import { getSession, isAuthenticated } from "@/server/auth/session";
import { getEnv } from "@/server/config/env";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Bạn đã từ chối cấp quyền đăng nhập.",
  invalid_state: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
  authentication_failed: "ATINO HUB chưa thể xác thực tài khoản. Vui lòng thử lại.",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (getEnv().DEPLOYMENT_DEMO_MODE) redirect("/data");
  const session = await getSession();
  if (isAuthenticated(session)) redirect("/data");

  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : undefined;
  const returnTo =
    params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//")
      ? params.returnTo
      : "/data";

  return (
    <main className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="brand-mark brand-mark-large">A</div>
        <div>
          <p className="eyebrow eyebrow-light">ATINO DATA PLATFORM</p>
          <h1>Quyết định mua hàng từ dữ liệu rõ ràng.</h1>
          <p>
            Theo dõi yêu cầu, trạng thái và ngân sách tại một nơi được bảo vệ.
          </p>
        </div>
        <div className="visual-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-mark">A</div>
            <strong>ATINO Analytics</strong>
          </div>
          <p className="eyebrow">BÁO CÁO MUA HÀNG</p>
          <h2>Chào mừng trở lại</h2>
          <p className="muted">Đăng nhập bằng tài khoản ATINO để tiếp tục.</p>

          {errorMessage ? (
            <div className="alert alert-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <a
            className="button button-primary button-block"
            href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
          >
            <span className="button-logo">A</span>
            Login with ATINO
          </a>
          <p className="security-note">Phiên đăng nhập được bảo vệ bằng cookie httpOnly.</p>
        </div>
      </section>
    </main>
  );
}
