import "server-only";

import type { PurchaseDataSet } from "@/domain/purchase/types";
import { normalizePurchaseRecord } from "@/domain/purchase/normalize";
import { getEnv } from "@/server/config/env";
import { listAllLarkPurchaseRecords } from "@/server/lark/client";

interface DataCache {
  data: PurchaseDataSet;
  expiresAt: number;
}

let cache: DataCache | undefined;
let dataRequest: Promise<PurchaseDataSet> | undefined;

async function loadPurchaseData(): Promise<PurchaseDataSet> {
  const rawRecords = await listAllLarkPurchaseRecords();
  const items = rawRecords.map(normalizePurchaseRecord);

  return {
    items,
    totalRecords: items.length,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getPurchaseData(options?: {
  forceRefresh?: boolean;
}): Promise<PurchaseDataSet> {
  const forceRefresh = options?.forceRefresh ?? false;
  if (!forceRefresh && cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  if (!dataRequest) {
    dataRequest = loadPurchaseData()
      .then((data) => {
        cache = {
          data,
          expiresAt: Date.now() + getEnv().DATA_CACHE_TTL_MS,
        };
        return data;
      })
      .finally(() => {
        dataRequest = undefined;
      });
  }

  return dataRequest;
}

export function clearPurchaseDataCache(): void {
  cache = undefined;
  dataRequest = undefined;
}
