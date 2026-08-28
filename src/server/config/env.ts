import "server-only";

import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:5173"),
  DEPLOYMENT_DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SESSION_SECRET: z.string().min(32),
  DATA_CACHE_TTL_MS: z.coerce.number().int().positive().default(120_000),
  LARK_APP_ID: z.string().min(1),
  LARK_APP_SECRET: z.string().min(1),
  LARK_APP_TOKEN: z.string().min(1),
  LARK_TABLE_ID: z.string().min(1),
  ATINO_CLIENT_ID: z.string().min(1),
  ATINO_CLIENT_SECRET: z.string().min(1),
  ATINO_AUTHORIZATION_URL: z.string().url(),
  ATINO_TOKEN_URL: z.string().url(),
  ATINO_USERINFO_URL: z.string().url(),
  ATINO_REDIRECT_URI: z.string().url(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${fields}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
