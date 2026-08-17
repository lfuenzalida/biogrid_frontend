import { NextRequest, NextResponse } from "next/server";
import { fetchWithPolicy } from "@/lib/http/fetch-with-policy";
import { captureError, getRequestId } from "@/lib/observability";
import { readValidatedJson, requireUser, securityErrorResponse } from "@/lib/server/route-security";
import { informeUpdateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

interface InformeRouteContext {
  params: Promise<{ informeId: string }>;
}

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
  if (response.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: { "x-request-id": requestId },
    });
  }
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      "x-request-id": requestId,
    },
  });
}

async function getUrl(
  request: NextRequest,
  context: InformeRouteContext,
) {
  const { informeId } = await context.params;
  const path = `${getConfiguration()}/api/v1/informes/${encodeURIComponent(informeId)}`;
  return `${path}${request.nextUrl.search}`;
}

export async function GET(
  request: NextRequest,
  context: InformeRouteContext,
) {
  const requestId = getRequestId(request);
  try {
    await requireUser(request);
    const response = await fetchWithPolicy(await getUrl(request, context), {
      headers: buildHeaders(request, requestId),
      cache: "no-store",
    }, { timeoutMs: 8_000, retries: 1 });
    return proxyResponse(response, requestId);
  } catch (error) {
    const securityResponse = securityErrorResponse(error, requestId);
    if (securityResponse) return securityResponse;
    captureError(error, { route: "/api/informes/[informeId]", method: "GET", requestId });
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: InformeRouteContext,
) {
  const requestId = getRequestId(request);
  try {
    await requireUser(request);
    const payload = await readValidatedJson(request, informeUpdateSchema);
    const response = await fetchWithPolicy(await getUrl(request, context), {
      method: "PATCH",
      headers: buildHeaders(request, requestId, true),
      body: JSON.stringify(payload),
      cache: "no-store",
    }, { timeoutMs: 8_000 });
    return proxyResponse(response, requestId);
  } catch (error) {
    const securityResponse = securityErrorResponse(error, requestId);
    if (securityResponse) return securityResponse;
    captureError(error, { route: "/api/informes/[informeId]", method: "PATCH", requestId });
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: InformeRouteContext,
) {
  const requestId = getRequestId(request);
  try {
    await requireUser(request);
    const response = await fetchWithPolicy(await getUrl(request, context), {
      method: "DELETE",
      headers: buildHeaders(request, requestId),
      cache: "no-store",
    }, { timeoutMs: 8_000 });
    return proxyResponse(response, requestId);
  } catch (error) {
    const securityResponse = securityErrorResponse(error, requestId);
    if (securityResponse) return securityResponse;
    captureError(error, { route: "/api/informes/[informeId]", method: "DELETE", requestId });
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}
