import { describe, expect, it } from "vitest";
import {
  avistamientosResponseSchema,
  informeCreateSchema,
} from "@/lib/validation/schemas";

describe("contratos runtime", () => {
  it("rechaza respuestas de avistamientos incompletas", () => {
    expect(
      avistamientosResponseSchema.safeParse({ type: "FeatureCollection", features: [] }).success,
    ).toBe(false);
  });

  it("rechaza informes sin polígono", () => {
    expect(informeCreateSchema.safeParse({ nombre: "Informe" }).success).toBe(false);
  });
});
