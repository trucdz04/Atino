import { NextResponse, type NextRequest } from "next/server";

import { buildAtinoAuthorizationUrl } from "@/server/auth/atino-client";
import { getSession } from "@/server/auth/session";
import { createOAuthState, safeReturnTo } from "@/server/auth/state";
import { getEnv } from "@/server/config/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (getEnv().DEPLOYMENT_DEMO_MODE) {
    return NextResponse.redirect(new URL("/data", getEnv().APP_URL));
  }

  const state = createOAuthState();
  const session = await getSession();
  session.oauthState = state;
  session.oauthStateExpiresAt = Date.now() + 10 * 60 * 1_000;
  session.returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  await session.save();

  return NextResponse.redirect(buildAtinoAuthorizationUrl(state));
}
