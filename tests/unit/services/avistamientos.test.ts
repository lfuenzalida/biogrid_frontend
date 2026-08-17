import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarAvistamientosPorPoligono } from "@/services/avistamientos";
import type { AreaConsulta } from "@/types/avistamientos";

vi.mock("@/lib/firebase/auth.service", () => ({
  getFirebaseIdToken: vi.fn().mockResolvedValue("test-token"),
  getFirebaseAppCheckToken: vi.fn().mockResolvedValue(null),
}));

const area = {
  type: "Feature",
  id: "mapbox-runtime-id",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-70.7, -33.5],
        [-70.6, -33.5],
        [-70.6, -33.4],
        [-70.7, -33.5],
      ],
    ],
  },
} as AreaConsulta & { id: string };

describe("buscarAvistamientosPorPoligono", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("normaliza GeoJSON, aplica filtros y devuelve resultados", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          type: "FeatureCollection",
          features: [],
          meta: { total: 0, limit: 1000, has_more: false, next_cursor: null },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await buscarAvistamientosPorPoligono(area, {
      gruposBiologicos: ["FLORA", "FAUNA"],
    });

    expect(result.features).toEqual([]);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("grupo_biologico=FLORA");
    expect(String(url)).toContain("grupo_biologico=FAUNA");
    expect(JSON.parse(String(init?.body))).toEqual({
      type: "Feature",
      properties: {},
      geometry: area.geometry,
    });
  });

  it("rechaza respuestas que no cumplen el contrato GeoJSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ type: "FeatureCollection" }), { status: 200 }),
    );

    await expect(buscarAvistamientosPorPoligono(area)).rejects.toThrow(
      "formato incompatible",
    );
  });
});
