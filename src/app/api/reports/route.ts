import { NextResponse } from "next/server";

import { getApiUser } from "@/server/auth/require-user";
import { getPurchaseData } from "@/server/lark/purchase-repository";
import { buildPurchaseReport } from "@/server/reports/aggregate";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  if (!(await getApiUser())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const data = await getPurchaseData();
    return NextResponse.json({
      data: buildPurchaseReport(data.items, data.fetchedAt),
    });
  } catch (error) {
    console.error("Failed to build purchase report", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "REPORT_UNAVAILABLE" }, { status: 502 });
  }
}
