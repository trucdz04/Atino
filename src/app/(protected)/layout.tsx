import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/server/auth/require-user";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requirePageUser();
  return <AppShell user={user}>{children}</AppShell>;
}
