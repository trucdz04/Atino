import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({
  getEnv: () => ({ LARK_APP_TOKEN: "base-token", LARK_TABLE_ID: "table-id" }),
}));
vi.mock("@/server/lark/token-cache", () => ({
  getLarkTenantToken: vi.fn().mockResolvedValue("tenant-token"),
}));
vi.mock("@/server/http/fetch-with-retry", () => ({
  fetchWithRetry: vi.fn(),
}));

import { fetchWithRetry } from "@/server/http/fetch-with-retry";
import { listAllLarkPurchaseRecords } from "@/server/lark/client";

const fetchMock = vi.mocked(fetchWithRetry);

function larkResponse(
  ids: string[],
  options: { hasMore?: boolean; pageToken?: string } = {},
): Response {
  return new Response(
    JSON.stringify({
      code: 0,
      data: {
        has_more: options.hasMore ?? false,
        page_token: options.pageToken,
        items: ids.map((recordId) => ({ record_id: recordId, fields: {} })),
      },
    }),
    { status: 200 },
  );
}

describe("Lark pagination", () => {
  beforeEach(() => fetchMock.mockReset());

  it("loads every page", async () => {
    fetchMock
      .mockResolvedValueOnce(larkResponse(["1", "2"], { hasMore: true, pageToken: "next" }))
      .mockResolvedValueOnce(larkResponse(["3"]));

    const records = await listAllLarkPurchaseRecords();

    expect(records.map((record) => record.recordId)).toEqual(["1", "2", "3"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("page_token=next");
  });

  it("rejects a repeated page token", async () => {
    fetchMock
      .mockResolvedValueOnce(larkResponse(["1"], { hasMore: true, pageToken: "same" }))
      .mockResolvedValueOnce(larkResponse(["2"], { hasMore: true, pageToken: "same" }));

    await expect(listAllLarkPurchaseRecords()).rejects.toThrow("repeated page token");
  });

  it("rejects has_more without a page token", async () => {
    fetchMock.mockResolvedValueOnce(larkResponse(["1"], { hasMore: true }));
    await expect(listAllLarkPurchaseRecords()).rejects.toThrow("page_token is missing");
  });
});
