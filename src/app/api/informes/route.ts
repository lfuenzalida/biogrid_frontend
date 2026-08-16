import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_QUERY_PARAMS = new Set(["limit", "cursor", "estado", "buscar"]);

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
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const params = new URLSearchParams();
    request.nextUrl.searchParams.forEach((value, key) => {
      if (ALLOWED_QUERY_PARAMS.has(key)) params.append(key, value);
    });

    const response = await fetch(`${getConfiguration()}/api/v1/informes?${params}`, {
      headers: buildHeaders(request),
      cache: "no-store",
    });
    return proxyResponse(response);
  } catch (error) {
    console.error("Error listando informes:", error);
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${getConfiguration()}/api/v1/informes`, {
      method: "POST",
      headers: buildHeaders(request, true),
      body: await request.text(),
      cache: "no-store",
    });
    return proxyResponse(response);
  } catch (error) {
    console.error("Error creando informe:", error);
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de informes." },
      { status: 502 },
    );
  }
}
