import { NextResponse, type NextRequest } from "next/server";

import {
  exchangeAuthorizationCode,
  fetchAtinoUser,
} from "@/server/auth/atino-client";
import { getSession } from "@/server/auth/session";
import { safeReturnTo, statesMatch } from "@/server/auth/state";
import { getEnv } from "@/server/config/env";

export const runtime = "nodejs";

function loginErrorUrl(reason: string): URL {
  const url = new URL("/login", getEnv().APP_URL);
  url.searchParams.set("error", reason);
  return url;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const receivedState = request.nextUrl.searchParams.get("state");
  const session = await getSession();
  const expectedState = session.oauthState;
  const stateExpiresAt = session.oauthStateExpiresAt;
  const returnTo = safeReturnTo(session.returnTo ?? null);

  delete session.oauthState;
  delete session.oauthStateExpiresAt;
  delete session.returnTo;

  if (error) {
    await session.save();
    return NextResponse.redirect(loginErrorUrl("access_denied"));
  }

  if (
    !code ||
    !receivedState ||
    !expectedState ||
    !stateExpiresAt ||
    stateExpiresAt < Date.now() ||
    !statesMatch(expectedState, receivedState)
  ) {
    await session.save();
    return NextResponse.redirect(loginErrorUrl("invalid_state"));
  }

  try {
    const token = await exchangeAuthorizationCode(code);
    session.user = await fetchAtinoUser(token.accessToken);
    session.userExpiresAt = Date.now() + Math.min(token.expiresIn, 8 * 60 * 60) * 1_000;
    await session.save();
    return NextResponse.redirect(new URL(returnTo, getEnv().APP_URL));
  } catch {
    await session.save();
    return NextResponse.redirect(loginErrorUrl("authentication_failed"));
  }
}
