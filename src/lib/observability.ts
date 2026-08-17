const SENSITIVE_KEYS = /authorization|token|password|api.?key|cookie/i;

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.test(key) ? "[REDACTED]" : sanitize(item),
      ]),
    );
  }
  return value;
}

export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      error: sanitize(error),
      context: sanitize(context),
    }),
  );
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
