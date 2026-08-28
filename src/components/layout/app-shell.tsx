import Link from "next/link";

import type { AuthenticatedUser } from "@/server/auth/session";

export function AppShell({
  user,
  demoMode = false,
  children,
}: {
  user: AuthenticatedUser;
  demoMode?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/data">
          <span className="brand-mark">A</span>
          <span>
            <strong>ATINO</strong>
            <small>Purchase Analytics</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          <Link href="/data">
            <span className="nav-icon">▤</span>
            Dữ liệu
          </Link>
          <Link href="/report">
            <span className="nav-icon">◫</span>
            Báo cáo
          </Link>
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{initial}</span>
          <span className="user-copy">
            <strong>{user.name}</strong>
            <small>{user.email ?? "ATINO account"}</small>
          </span>
          {demoMode ? (
            <span className="status status-under-review">Demo</span>
          ) : (
            <form action="/auth/logout" method="post">
              <button className="icon-button" title="Đăng xuất" type="submit">
                ↪
              </button>
            </form>
          )}
        </div>
      </aside>

      <div className="workspace">
        <header className="mobile-header">
          <Link className="sidebar-brand" href="/data">
            <span className="brand-mark">A</span>
            <strong>ATINO</strong>
          </Link>
          <nav>
            <Link href="/data">Dữ liệu</Link>
            <Link href="/report">Báo cáo</Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
