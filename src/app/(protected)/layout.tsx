import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/server/auth/require-user";
import { getEnv } from "@/server/config/env";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const demoMode = getEnv().DEPLOYMENT_DEMO_MODE;
  const user = demoMode
    ? { id: "public-demo", name: "Lark Demo", email: "Public read-only" }
    : await requirePageUser();

  return (
    <AppShell demoMode={demoMode} user={user}>
      {children}
    </AppShell>
  );
}
