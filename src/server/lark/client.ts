import "server-only";

import { larkListResponseSchema } from "@/domain/purchase/schema";
import type {
  LarkPurchaseFields,
  LarkPurchaseRecord,
} from "@/domain/purchase/types";
import { getEnv } from "@/server/config/env";
import { fetchWithRetry } from "@/server/http/fetch-with-retry";
import { getLarkTenantToken } from "@/server/lark/token-cache";

const LARK_API_BASE = "https://open.larksuite.com/open-apis/bitable/v1";
const PAGE_SIZE = 500;
const MAX_PAGES = 100;

function buildRecordsUrl(pageToken?: string): URL {
  const env = getEnv();
  const url = new URL(
    `${LARK_API_BASE}/apps/${encodeURIComponent(env.LARK_APP_TOKEN)}` +
      `/tables/${encodeURIComponent(env.LARK_TABLE_ID)}/records`,
  );
  url.searchParams.set("page_size", String(PAGE_SIZE));
  if (pageToken) url.searchParams.set("page_token", pageToken);
  return url;
}

export async function listAllLarkPurchaseRecords(): Promise<LarkPurchaseRecord[]> {
  const token = await getLarkTenantToken();
  const records: LarkPurchaseRecord[] = [];
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchWithRetry(buildRecordsUrl(pageToken), {
      headers: { authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Lark records request failed with HTTP ${response.status}`);
    }

    const result = larkListResponseSchema.parse(await response.json());
    if (result.code !== 0 || !result.data) {
      throw new Error(`Lark records request failed: ${result.msg ?? result.code}`);
    }

    records.push(
      ...result.data.items.map((item) => ({
        recordId: item.record_id,
        fields: item.fields as unknown as LarkPurchaseFields,
      })),
    );

    if (!result.data.has_more) return records;
    if (!result.data.page_token) {
      throw new Error("Lark response has_more=true but page_token is missing");
    }
    if (seenPageTokens.has(result.data.page_token)) {
      throw new Error("Lark pagination returned a repeated page token");
    }

    seenPageTokens.add(result.data.page_token);
    pageToken = result.data.page_token;
  }

  throw new Error(`Lark pagination exceeded the safety limit of ${MAX_PAGES} pages`);
}
