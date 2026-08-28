import { NextResponse } from "next/server";

import { getSession } from "@/server/auth/session";
import { getEnv } from "@/server/config/env";

export async function POST(): Promise<NextResponse> {
  if (getEnv().DEPLOYMENT_DEMO_MODE) {
    return NextResponse.redirect(new URL("/data", getEnv().APP_URL), 303);
  }

  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", getEnv().APP_URL), 303);
}
