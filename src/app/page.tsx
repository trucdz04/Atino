import { redirect } from "next/navigation";

import { getSession, isAuthenticated } from "@/server/auth/session";

export default async function HomePage(): Promise<never> {
  const session = await getSession();
  redirect(isAuthenticated(session) ? "/data" : "/login");
}
