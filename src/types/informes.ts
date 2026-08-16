import type { Feature, Polygon } from "geojson";
import type { GrupoBiologico } from "./avistamientos";

export type InformeEstado = "BORRADOR" | "COMPLETADO";

export interface InformeLocation {
  comuna: string | null;
  provincia: string | null;
  region: string | null;
  pais: string | null;
  etiqueta: string | null;
  estimada: boolean;
}

export interface InformeFilters {
  grupos_biologicos: GrupoBiologico[];
  origen?: "GBIF" | "iNaturalist" | "eBird" | null;
}

export interface InformeSummary {
  total_avistamientos: number;
  total_especies: number;
  flora: number;
  fauna: number;
  fungi: number;
  otros: number;
  desconocidos: number;
  especies_amenazadas: number;
  registros_protegidos: number;
}

export interface InformeSpecies {
  nombre_cientifico: string | null;
  nombre_comun: string | null;
  grupo_biologico: GrupoBiologico;
  reino: string | null;
  clase_taxonomica: string | null;
  familia: string | null;
  genero: string | null;
  grado_amenaza: string | null;
  protegida: boolean;
  cantidad_avistamientos: number;
  origenes: string[];
}

export interface InformeListItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: InformeEstado;
  ubicacion: InformeLocation;
  resumen: InformeSummary;
  fecha_creacion: string;
  fecha_actualizacion: string;
  version: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
}

export interface InformeListResponse {
  items: InformeListItem[];
  meta: PaginationMeta;
}

export interface InformeDetail extends InformeListItem {
  poligono: Feature<Polygon>;
  bounding_box: [number, number, number, number];
  centroide: {
    type: "Point";
    coordinates: [number, number];
  };
  filtros: InformeFilters;
  especies: InformeSpecies[];
  especies_meta: PaginationMeta;
}

export interface InformeCreate {
  nombre: string;
  descripcion?: string | null;
  estado?: InformeEstado;
  poligono: Feature<Polygon>;
  filtros?: InformeFilters;
  ubicacion?: Partial<InformeLocation> | null;
}

export interface InformeUpdate {
  nombre?: string;
  descripcion?: string | null;
  estado?: InformeEstado;
  poligono?: Feature<Polygon>;
  filtros?: InformeFilters;
  ubicacion?: Partial<InformeLocation> | null;
}
