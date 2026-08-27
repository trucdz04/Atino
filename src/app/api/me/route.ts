import { NextResponse } from "next/server";

import { getApiUser } from "@/server/auth/require-user";

export async function GET(): Promise<NextResponse> {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ data: user });
}
