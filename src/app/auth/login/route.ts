import { NextResponse, type NextRequest } from "next/server";

import { buildAtinoAuthorizationUrl } from "@/server/auth/atino-client";
import { getSession } from "@/server/auth/session";
import { createOAuthState, safeReturnTo } from "@/server/auth/state";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = createOAuthState();
  const session = await getSession();
  session.oauthState = state;
  session.oauthStateExpiresAt = Date.now() + 10 * 60 * 1_000;
  session.returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  await session.save();

  return NextResponse.redirect(buildAtinoAuthorizationUrl(state));
}
