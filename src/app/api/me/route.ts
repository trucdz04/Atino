import { NextResponse } from "next/server";

import { getApiUser } from "@/server/auth/require-user";
import { getEnv } from "@/server/config/env";

export async function GET(): Promise<NextResponse> {
  if (getEnv().DEPLOYMENT_DEMO_MODE) {
    return NextResponse.json({
      data: { id: "public-demo", name: "Public Demo", email: "Dữ liệu mẫu" },
    });
  }

  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ data: user });
}
