import { redirect } from "next/navigation";

import { getSession, isAuthenticated } from "@/server/auth/session";
import { getEnv } from "@/server/config/env";

export default async function HomePage(): Promise<never> {
  if (getEnv().DEPLOYMENT_DEMO_MODE) redirect("/data");
  const session = await getSession();
  redirect(isAuthenticated(session) ? "/data" : "/login");
}
