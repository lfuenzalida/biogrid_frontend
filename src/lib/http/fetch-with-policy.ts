interface FetchPolicy {
  timeoutMs?: number;
  retries?: number;
  retryStatuses?: number[];
}

const DEFAULT_RETRY_STATUSES = [408, 429, 502, 503, 504];

export async function fetchWithPolicy(
  input: RequestInfo | URL,
  init: RequestInit = {},
  policy: FetchPolicy = {},
) {
  const timeoutMs = policy.timeoutMs ?? 8_000;
  const retries = policy.retries ?? 0;
  const statuses = policy.retryStatuses ?? DEFAULT_RETRY_STATUSES;

  for (let attempt = 0; ; attempt += 1) {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
    const abort = () => timeoutController.abort(init.signal?.reason);
    init.signal?.addEventListener("abort", abort, { once: true });

    try {
      const response = await fetch(input, {
        ...init,
        signal: timeoutController.signal,
      });
      if (attempt < retries && statuses.includes(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt >= retries || init.signal?.aborted) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", abort);
    }
  }
}
