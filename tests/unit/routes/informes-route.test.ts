import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/informes/route";

const originalApiUrl = process.env.BIOGRID_API_URL;

describe("/api/informes", () => {
  beforeEach(() => {
    process.env.BIOGRID_API_URL = "https://backend.example";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.BIOGRID_API_URL = originalApiUrl;
  });

  it("reenvía autorización y solo parámetros permitidos", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
    );
    const request = new NextRequest(
      "http://localhost/api/informes?limit=20&buscar=flora&unsafe=value",
      { headers: { Authorization: "Bearer test-token" } },
    );

    const response = await GET(request);
    const [url, init] = vi.mocked(fetch).mock.calls[0];

    expect(response.status).toBe(200);
    expect(String(url)).toContain("limit=20");
    expect(String(url)).toContain("buscar=flora");
    expect(String(url)).not.toContain("unsafe");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token");
  });

  it("reenvía el body al crear un informe", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "report-id" }), { status: 201 }),
    );
    const payload = { nombre: "Informe de prueba" };
    const request = new NextRequest("http://localhost/api/informes", {
      method: "POST",
      headers: { Authorization: "Bearer test-token" },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const [, init] = vi.mocked(fetch).mock.calls[0];

    expect(response.status).toBe(201);
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });
});
