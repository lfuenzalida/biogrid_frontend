import { NextRequest, NextResponse } from "next/server";
import { fetchWithPolicy } from "@/lib/http/fetch-with-policy";
import { captureError, getRequestId } from "@/lib/observability";
import { readValidatedJson, requireUser, securityErrorResponse } from "@/lib/server/route-security";
import { informeCreateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

const ALLOWED_QUERY_PARAMS = new Set(["limit", "cursor", "estado", "buscar"]);

function getConfiguration() {
  const apiUrl = process.env.BIOGRID_API_URL;
  if (!apiUrl) throw new Error("BIOGRID_API_URL no está configurada.");
  return apiUrl.replace(/\/$/, "");
}

function buildHeaders(request: NextRequest, requestId: string, hasBody = false) {
  const authorization = request.headers.get("authorization");
  const headers = new Headers();
  if (authorization) headers.set("Authorization", authorization);
  headers.set("x-request-id", requestId);
  if (hasBody) headers.set("Content-Type", "application/json");
  return headers;
}

async function proxyResponse(response: Response, requestId: string) {
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      "x-request-id": requestId,
    },
  });
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    await requireUser(request);
    const params = new URLSearchParams();
    request.nextUrl.searchParams.forEach((value, key) => {
      if (ALLOWED_QUERY_PARAMS.has(key)) params.append(key, value);
    });

    const response = await fetchWithPolicy(`${getConfiguration()}/api/v1/informes?${params}`, {
      headers: buildHeaders(request, requestId),
      cache: "no-store",
    }, { timeoutMs: 8_000, retries: 1 });
    return proxyResponse(response, requestId);
  } catch (error) {
    const securityResponse = securityErrorResponse(error, requestId);
    if (securityResponse) return securityResponse;
    captureError(error, { route: "/api/informes", method: "GET", requestId });
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    await requireUser(request);
    const payload = await readValidatedJson(request, informeCreateSchema);
    const response = await fetchWithPolicy(`${getConfiguration()}/api/v1/informes`, {
      method: "POST",
      headers: buildHeaders(request, requestId, true),
      body: JSON.stringify(payload),
      cache: "no-store",
    }, { timeoutMs: 8_000 });
    return proxyResponse(response, requestId);
  } catch (error) {
    const securityResponse = securityErrorResponse(error, requestId);
    if (securityResponse) return securityResponse;
    captureError(error, { route: "/api/informes", method: "POST", requestId });
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}
