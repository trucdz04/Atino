import { NextResponse } from "next/server";

import { getApiUser } from "@/server/auth/require-user";
import { getEnv } from "@/server/config/env";
import { getPurchaseData } from "@/server/lark/purchase-repository";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  if (!getEnv().DEPLOYMENT_DEMO_MODE && !(await getApiUser())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const data = await getPurchaseData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to load purchases", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "PURCHASE_DATA_UNAVAILABLE" },
      { status: 502 },
    );
  }
}
