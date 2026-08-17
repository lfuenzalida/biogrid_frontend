import { z } from "zod";

const nullableText = z.string().nullable();
const coordinate = z.tuple([z.number().finite(), z.number().finite()]);

export const polygonFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: z.record(z.string(), z.unknown()).default({}),
  geometry: z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(coordinate).min(4)).min(1),
  }),
});

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
});

const grupoBiologicoSchema = z.enum([
  "FLORA",
  "FAUNA",
  "FUNGI",
  "OTRO",
  "DESCONOCIDO",
]);

export const avistamientosResponseSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.literal("Point"),
        coordinates: coordinate,
      }),
      properties: z.object({
        id: z.string(),
        especie: nullableText,
        origen: nullableText,
        comuna: nullableText,
        parque: nullableText,
        protegido: z.boolean().nullable(),
        reino: nullableText,
        clase_taxonomica: nullableText,
        grupo_biologico: grupoBiologicoSchema,
        familia: nullableText,
        genero: nullableText,
        grado_amenaza: nullableText,
        grupo: nullableText.optional(),
        categoria_conservacion: nullableText.optional(),
      }),
    }),
  ),
  meta: paginationSchema,
});

const informeLocationSchema = z.object({
  comuna: nullableText,
  provincia: nullableText,
  region: nullableText,
  pais: nullableText,
  etiqueta: nullableText,
  estimada: z.boolean(),
});

const informeSummarySchema = z.object({
  total_avistamientos: z.number().int().nonnegative(),
  total_especies: z.number().int().nonnegative(),
  flora: z.number().int().nonnegative(),
  fauna: z.number().int().nonnegative(),
  fungi: z.number().int().nonnegative(),
  otros: z.number().int().nonnegative(),
  desconocidos: z.number().int().nonnegative(),
  especies_amenazadas: z.number().int().nonnegative(),
  registros_protegidos: z.number().int().nonnegative(),
});

const informeListItemSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: nullableText,
  estado: z.enum(["BORRADOR", "COMPLETADO"]),
  ubicacion: informeLocationSchema,
  resumen: informeSummarySchema,
  fecha_creacion: z.string(),
  fecha_actualizacion: z.string(),
  version: z.number().int().nonnegative(),
});

export const informeListResponseSchema = z.object({
  items: z.array(informeListItemSchema),
  meta: paginationSchema,
});

export const informeDetailSchema = informeListItemSchema.extend({
  poligono: polygonFeatureSchema,
  bounding_box: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  centroide: z.object({ type: z.literal("Point"), coordinates: coordinate }),
  filtros: z.object({
    grupos_biologicos: z.array(grupoBiologicoSchema),
    origen: z.enum(["GBIF", "iNaturalist", "eBird"]).nullable().optional(),
  }),
  especies: z.array(
    z.object({
      nombre_cientifico: nullableText,
      nombre_comun: nullableText,
      grupo_biologico: grupoBiologicoSchema,
      reino: nullableText,
      clase_taxonomica: nullableText,
      familia: nullableText,
      genero: nullableText,
      grado_amenaza: nullableText,
      protegida: z.boolean(),
      cantidad_avistamientos: z.number().int().nonnegative(),
      origenes: z.array(z.string()),
    }),
  ),
  especies_meta: paginationSchema,
});

const partialLocationSchema = informeLocationSchema.partial().nullable();
const informeFiltersSchema = z.object({
  grupos_biologicos: z.array(grupoBiologicoSchema),
  origen: z.enum(["GBIF", "iNaturalist", "eBird"]).nullable().optional(),
});

export const informeCreateSchema = z.object({
  nombre: z.string().trim().min(2).max(160),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  estado: z.enum(["BORRADOR", "COMPLETADO"]).optional(),
  poligono: polygonFeatureSchema,
  filtros: informeFiltersSchema.optional(),
  ubicacion: partialLocationSchema.optional(),
});

export const informeUpdateSchema = informeCreateSchema
  .omit({ poligono: true })
  .extend({ poligono: polygonFeatureSchema.optional() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios para aplicar.");

export const userProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
});

export function parseApiResponse<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error("La API respondió con un formato incompatible.", {
      cause: result.error,
    });
  }
  return result.data;
}
