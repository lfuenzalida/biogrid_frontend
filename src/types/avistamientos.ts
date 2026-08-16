import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

export type OrigenAvistamiento = "GBIF" | "iNaturalist" | "eBird" | string;

export type GrupoBiologico =
  | "FLORA"
  | "FAUNA"
  | "FUNGI"
  | "OTRO"
  | "DESCONOCIDO";

export type CategoriaConservacion =
  | "CR"
  | "EN"
  | "VU"
  | "NT"
  | "LC"
  | "DD"
  | "NE";

export interface AvistamientoProperties {
  id: string;
  especie: string | null;
  origen: OrigenAvistamiento | null;
  comuna: string | null;
  parque: string | null;
  protegido: boolean | null;
  reino: string | null;
  clase_taxonomica: string | null;
  grupo_biologico: GrupoBiologico;
  familia: string | null;
  genero: string | null;
  grado_amenaza: string | null;
  // Campos opcionales preparados para una futura ampliación del backend.
  grupo?: string | null;
  categoria_conservacion?: CategoriaConservacion | null;
}

export interface AvistamientosMeta {
  total: number;
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
}

export type AvistamientoFeature = Feature<Point, AvistamientoProperties>;

export type AvistamientosFeatureCollection = FeatureCollection<
  Point,
  AvistamientoProperties
> & {
  meta: AvistamientosMeta;
};

export type AreaConsulta = Feature<Polygon>;

export interface FiltrosAvistamientos {
  gruposBiologicos?: GrupoBiologico[];
  origen?: OrigenAvistamiento;
  protegido?: boolean;
  especie?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
