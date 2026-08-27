import "server-only";

import { redirect } from "next/navigation";

import type { AuthenticatedUser } from "@/server/auth/session";
import { getSession, isAuthenticated } from "@/server/auth/session";

export async function requirePageUser(): Promise<AuthenticatedUser> {
  const session = await getSession();
  if (!isAuthenticated(session) || !session.user) redirect("/login");
  return session.user;
}

export async function getApiUser(): Promise<AuthenticatedUser | null> {
  const session = await getSession();
  return isAuthenticated(session) && session.user ? session.user : null;
}
