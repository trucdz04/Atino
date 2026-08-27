import "server-only";

export interface FetchWithRetryOptions {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit = {},
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const { timeoutMs = 10_000, retries = 2, baseDelayMs = 250 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
      });

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === retries) {
        return response;
      }
      lastError = new Error(`Retryable HTTP status ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    } finally {
      clearTimeout(timeout);
    }

    const jitter = Math.floor(Math.random() * 100);
    await sleep(baseDelayMs * 2 ** attempt + jitter);
  }

  throw lastError instanceof Error ? lastError : new Error("External request failed");
}
