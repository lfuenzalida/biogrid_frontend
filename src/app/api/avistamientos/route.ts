import { NextRequest, NextResponse } from "next/server";
import { fetchWithPolicy } from "@/lib/http/fetch-with-policy";
import { captureError, getRequestId } from "@/lib/observability";
import { limitAvistamientos, rateLimitHeaders } from "@/lib/server/rate-limit";
import { readValidatedJson, requireUser, securityErrorResponse } from "@/lib/server/route-security";
import { avistamientosResponseSchema, polygonFeatureSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

const ALLOWED_QUERY_PARAMS = new Set([
  "grupo_biologico", "origen", "protegido", "especie", "fecha_desde",
  "fecha_hasta", "limit", "cursor",
]);

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const apiUrl = process.env.BIOGRID_API_URL;
  const apiKey = process.env.BIOGRID_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { detail: "La integración de avistamientos no está configurada.", requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const user = await requireUser(request);
    const rateLimit = await limitAvistamientos(user.uid);
    const limitHeaders = rateLimitHeaders(rateLimit);
    if (!rateLimit.success) {
      return NextResponse.json(
        { detail: "Demasiadas consultas. Intenta nuevamente en unos segundos.", requestId },
        { status: 429, headers: { ...limitHeaders, "x-request-id": requestId } },
      );
    }

    const area = await readValidatedJson(request, polygonFeatureSchema);
    const query = new URLSearchParams();
    request.nextUrl.searchParams.forEach((value, key) => {
      if (ALLOWED_QUERY_PARAMS.has(key)) query.append(key, value);
    });
    const upstreamUrl = `${apiUrl.replace(/\/$/, "")}/api/v1/avistamientos/buscar-por-poligono?${query}`;
    const upstreamResponse = await fetchWithPolicy(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "x-request-id": requestId },
      body: JSON.stringify(area),
      cache: "no-store",
    }, { timeoutMs: 8_000, retries: 1 });

    if (!upstreamResponse.ok) {
      return new NextResponse(await upstreamResponse.text(), {
        status: upstreamResponse.status,
        headers: {
          ...limitHeaders,
          "Content-Type": upstreamResponse.headers.get("Content-Type") ?? "application/json",
          "x-request-id": requestId,
        },
      });
    }

    const payload = avistamientosResponseSchema.parse(await upstreamResponse.json());
    return NextResponse.json(payload, {
      status: upstreamResponse.status,
      headers: { ...limitHeaders, "x-request-id": requestId },
    });
  } catch (error) {
    const securityResponse = securityErrorResponse(error, requestId);
    if (securityResponse) return securityResponse;
    captureError(error, { route: "/api/avistamientos", requestId });
    return NextResponse.json(
      { detail: "No fue posible completar la consulta de avistamientos.", requestId },
      { status: 502, headers: { "x-request-id": requestId } },
    );
  }
}
