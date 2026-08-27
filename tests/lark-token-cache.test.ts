import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({
  getEnv: () => ({
    LARK_APP_ID: "test-app",
    LARK_APP_SECRET: "test-secret",
  }),
}));
vi.mock("@/server/http/fetch-with-retry", () => ({
  fetchWithRetry: vi.fn(),
}));

import { fetchWithRetry } from "@/server/http/fetch-with-retry";
import {
  clearLarkTokenCache,
  getLarkTenantToken,
} from "@/server/lark/token-cache";

const fetchMock = vi.mocked(fetchWithRetry);

describe("Lark token cache", () => {
  beforeEach(() => {
    clearLarkTokenCache();
    fetchMock.mockReset();
  });

  it("reuses a valid token", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          tenant_access_token: "token-1",
          expire: 7_200,
        }),
        { status: 200 },
      ),
    );

    await expect(getLarkTenantToken()).resolves.toBe("token-1");
    await expect(getLarkTenantToken()).resolves.toBe("token-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight request between concurrent callers", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          tenant_access_token: "shared-token",
          expire: 7_200,
        }),
        { status: 200 },
      ),
    );

    const tokens = await Promise.all([
      getLarkTenantToken(),
      getLarkTenantToken(),
      getLarkTenantToken(),
    ]);

    expect(tokens).toEqual(["shared-token", "shared-token", "shared-token"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
