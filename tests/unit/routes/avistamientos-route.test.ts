import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/avistamientos/route";

vi.mock("@/lib/firebase/admin", () => ({
  verifyFirebaseRequest: vi.fn().mockResolvedValue({ uid: "test-user" }),
}));

const area = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [[[-70, -33], [-70, -34], [-71, -34], [-70, -33]]],
  },
};

const originalApiUrl = process.env.BIOGRID_API_URL;
const originalApiKey = process.env.BIOGRID_API_KEY;

describe("POST /api/avistamientos", () => {
  beforeEach(() => {
    process.env.BIOGRID_API_URL = "https://backend.example";
    process.env.BIOGRID_API_KEY = "server-secret";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.BIOGRID_API_URL = originalApiUrl;
    process.env.BIOGRID_API_KEY = originalApiKey;
  });

  it("rechaza la operación cuando falta configuración servidor", async () => {
    delete process.env.BIOGRID_API_KEY;
    const request = new NextRequest("http://localhost/api/avistamientos", {
      method: "POST",
      body: JSON.stringify(area),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("filtra parámetros y mantiene la API key fuera de la respuesta", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        type: "FeatureCollection",
        features: [],
        meta: { total: 0, limit: 1, has_more: false, next_cursor: null },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const request = new NextRequest(
      "http://localhost/api/avistamientos?limit=1&unexpected=secret",
      {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
        body: JSON.stringify(area),
      },
    );

    const response = await POST(request);
    const [url, init] = vi.mocked(fetch).mock.calls[0];

    expect(response.status).toBe(200);
    expect(String(url)).toContain("limit=1");
    expect(String(url)).not.toContain("unexpected");
    expect(new Headers(init?.headers).get("x-api-key")).toBe("server-secret");
    expect(await response.text()).not.toContain("server-secret");
  });
});
