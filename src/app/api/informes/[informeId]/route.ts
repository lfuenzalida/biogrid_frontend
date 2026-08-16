import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface InformeRouteContext {
  params: Promise<{ informeId: string }>;
}

function getConfiguration() {
  const apiUrl = process.env.BIOGRID_API_URL;
  if (!apiUrl) throw new Error("BIOGRID_API_URL no está configurada.");
  return apiUrl.replace(/\/$/, "");
}

function buildHeaders(request: NextRequest, hasBody = false) {
  const authorization = request.headers.get("authorization");
  const headers = new Headers();
  if (authorization) headers.set("Authorization", authorization);
  if (hasBody) headers.set("Content-Type", "application/json");
  return headers;
}

async function proxyResponse(response: Response) {
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
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
  try {
    const response = await fetch(await getUrl(request, context), {
      headers: buildHeaders(request),
      cache: "no-store",
    });
    return proxyResponse(response);
  } catch (error) {
    console.error("Error obteniendo informe:", error);
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
  try {
    const response = await fetch(await getUrl(request, context), {
      method: "PATCH",
      headers: buildHeaders(request, true),
      body: await request.text(),
      cache: "no-store",
    });
    return proxyResponse(response);
  } catch (error) {
    console.error("Error actualizando informe:", error);
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
  try {
    const response = await fetch(await getUrl(request, context), {
      method: "DELETE",
      headers: buildHeaders(request),
      cache: "no-store",
    });
    return proxyResponse(response);
  } catch (error) {
    console.error("Error eliminando informe:", error);
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}
