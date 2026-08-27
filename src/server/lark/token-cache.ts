import "server-only";

import { larkTokenResponseSchema } from "@/domain/purchase/schema";
import { getEnv } from "@/server/config/env";
import { fetchWithRetry } from "@/server/http/fetch-with-retry";

const TOKEN_URL =
  "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal";
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | undefined;
let tokenRequest: Promise<CachedToken> | undefined;

async function requestToken(): Promise<CachedToken> {
  const env = getEnv();
  const response = await fetchWithRetry(
    TOKEN_URL,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        app_id: env.LARK_APP_ID,
        app_secret: env.LARK_APP_SECRET,
      }),
    },
    { retries: 1 },
  );

  if (!response.ok) {
    throw new Error(`Lark authentication failed with HTTP ${response.status}`);
  }

  const result = larkTokenResponseSchema.parse(await response.json());
  if (result.code !== 0 || !result.tenant_access_token || !result.expire) {
    throw new Error(`Lark authentication failed: ${result.msg ?? result.code}`);
  }

  return {
    value: result.tenant_access_token,
    expiresAt: Date.now() + result.expire * 1_000,
  };
}

export async function getLarkTenantToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - EXPIRY_SKEW_MS) {
    return cachedToken.value;
  }

  if (!tokenRequest) {
    tokenRequest = requestToken()
      .then((token) => {
        cachedToken = token;
        return token;
      })
      .finally(() => {
        tokenRequest = undefined;
      });
  }

  return (await tokenRequest).value;
}

export function clearLarkTokenCache(): void {
  cachedToken = undefined;
  tokenRequest = undefined;
}
