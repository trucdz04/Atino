import "server-only";

import { z } from "zod";

import type { AuthenticatedUser } from "@/server/auth/session";
import { getEnv } from "@/server/config/env";
import { fetchWithRetry } from "@/server/http/fetch-with-retry";

const tokenPayloadSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.coerce.number().positive().optional(),
});

const tokenResponseSchema = z.union([
  tokenPayloadSchema,
  z.object({ data: tokenPayloadSchema }),
]);

const userPayloadSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    sub: z.union([z.string(), z.number()]).optional(),
    user_id: z.union([z.string(), z.number()]).optional(),
    email: z.string().email().nullable().optional(),
    name: z.string().optional(),
    display_name: z.string().optional(),
  })
  .passthrough();

export interface AtinoToken {
  accessToken: string;
  expiresIn: number;
}

export function buildAtinoAuthorizationUrl(state: string): URL {
  const env = getEnv();
  const url = new URL(env.ATINO_AUTHORIZATION_URL);
  url.searchParams.set("client_id", env.ATINO_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.ATINO_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeAuthorizationCode(code: string): Promise<AtinoToken> {
  const env = getEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.ATINO_CLIENT_ID,
    client_secret: env.ATINO_CLIENT_SECRET,
    redirect_uri: env.ATINO_REDIRECT_URI,
  });

  const response = await fetchWithRetry(
    env.ATINO_TOKEN_URL,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    },
    { retries: 1 },
  );

  if (!response.ok) {
    throw new Error(`ATINO token exchange failed with HTTP ${response.status}`);
  }

  const parsed = tokenResponseSchema.parse(await response.json());
  const token = "data" in parsed ? parsed.data : parsed;
  return {
    accessToken: token.access_token,
    expiresIn: token.expires_in ?? 60 * 60,
  };
}

export async function fetchAtinoUser(accessToken: string): Promise<AuthenticatedUser> {
  const env = getEnv();
  const response = await fetchWithRetry(
    env.ATINO_USERINFO_URL,
    {
      headers: { authorization: `Bearer ${accessToken}` },
    },
    { retries: 1 },
  );

  if (!response.ok) {
    throw new Error(`ATINO userinfo request failed with HTTP ${response.status}`);
  }

  const rawResponse: unknown = await response.json();
  const envelope = z.object({ data: z.unknown() }).safeParse(rawResponse);
  const profile = userPayloadSchema.parse(
    envelope.success ? envelope.data.data : rawResponse,
  );
  const id = profile.id ?? profile.sub ?? profile.user_id;
  if (id === undefined) throw new Error("ATINO userinfo response has no user id");

  return {
    id: String(id),
    email: profile.email ?? null,
    name:
      profile.name ?? profile.display_name ?? profile.email ?? `User ${String(id)}`,
  };
}
