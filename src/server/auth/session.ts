import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

import { getEnv } from "@/server/config/env";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string;
}

export interface SessionData {
  user?: AuthenticatedUser;
  userExpiresAt?: number;
  oauthState?: string;
  oauthStateExpiresAt?: number;
  returnTo?: string;
}

function sessionOptions() {
  const env = getEnv();
  return {
    cookieName: SESSION_COOKIE_NAME,
    password: env.SESSION_SECRET,
    ttl: 60 * 60 * 8,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export function isAuthenticated(session: SessionData): boolean {
  return Boolean(
    session.user &&
      session.userExpiresAt &&
      session.userExpiresAt > Date.now(),
  );
}
