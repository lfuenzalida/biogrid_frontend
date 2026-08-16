import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_QUERY_PARAMS = new Set([
  "grupo_biologico",
  "origen",
  "protegido",
  "especie",
  "fecha_desde",
  "fecha_hasta",
  "limit",
  "cursor",
]);

export async function POST(request: NextRequest) {
  const apiUrl = process.env.BIOGRID_API_URL;
  const apiKey = process.env.BIOGRID_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { detail: "La integración de avistamientos no está configurada." },
      { status: 500 },
    );
  }

  const query = new URLSearchParams();
  request.nextUrl.searchParams.forEach((value, key) => {
    if (ALLOWED_QUERY_PARAMS.has(key)) query.append(key, value);
  });

  const upstreamUrl = `${apiUrl.replace(/\/$/, "")}/api/v1/avistamientos/buscar-por-poligono?${query.toString()}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: await request.text(),
      cache: "no-store",
    });

    const responseBody = await upstreamResponse.text();

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Error consultando BioGrid API:", error);
    return NextResponse.json(
      { detail: "No fue posible conectar con el servicio de avistamientos." },
      { status: 502 },
    );
  }
}
