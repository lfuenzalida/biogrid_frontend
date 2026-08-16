"use client";

import { Layer, Popup, Source, type LayerProps } from "react-map-gl/maplibre";
import type { ExpressionSpecification } from "maplibre-gl";
import type {
  AvistamientoFeature,
  AvistamientosFeatureCollection,
  GrupoBiologico,
} from "@/types/avistamientos";

export const AVISTAMIENTOS_SOURCE_ID = "biogrid-avistamientos-source";
export const AVISTAMIENTOS_LAYER_ID = "biogrid-avistamientos";
export const AVISTAMIENTOS_CLUSTER_LAYER_ID = "biogrid-avistamientos-clusters";

const COLOR_BY_GROUP: ExpressionSpecification = [
  "match",
  ["get", "grupo_biologico"],
  "FLORA",
  "#16a34a",
  "FAUNA",
  "#0284c7",
  "FUNGI",
  "#7c3aed",
  "OTRO",
  "#d97706",
  "DESCONOCIDO",
  "#64748b",
  "#64748b",
];

const GROUP_STYLES: Record<GrupoBiologico, string> = {
  FLORA: "bg-green-100 text-green-800",
  FAUNA: "bg-sky-100 text-sky-800",
  FUNGI: "bg-violet-100 text-violet-800",
  OTRO: "bg-amber-100 text-amber-800",
  DESCONOCIDO: "bg-slate-100 text-slate-700",
};

const CLUSTER_LAYER: LayerProps = {
  id: AVISTAMIENTOS_CLUSTER_LAYER_ID,
  type: "circle",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#14b8a6",
      100,
      "#0d9488",
      750,
      "#047857",
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      18,
      100,
      24,
      750,
      31,
    ],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
    "circle-opacity": 0.92,
  },
};

const CLUSTER_COUNT_LAYER: LayerProps = {
  id: "biogrid-avistamientos-cluster-count",
  type: "symbol",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 12,
  },
  paint: { "text-color": "#ffffff" },
};

const PROTECTED_HALO_LAYER: LayerProps = {
  id: "biogrid-avistamientos-protected-halo",
  type: "circle",
  filter: [
    "all",
    ["!", ["has", "point_count"]],
    ["==", ["get", "protegido"], true],
  ],
  paint: {
    "circle-color": "rgba(0,0,0,0)",
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 6, 12, 9, 16, 12],
    "circle-stroke-color": "#064e3b",
    "circle-stroke-width": 3,
  },
};

const AVISTAMIENTOS_LAYER: LayerProps = {
  id: AVISTAMIENTOS_LAYER_ID,
  type: "circle",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": COLOR_BY_GROUP,
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 4, 12, 7, 16, 10],
    "circle-opacity": 0.9,
    "circle-stroke-color": [
      "case",
      ["==", ["get", "grado_amenaza"], "Amenazada"],
      "#dc2626",
      "#ffffff",
    ],
    "circle-stroke-width": [
      "case",
      ["==", ["get", "grado_amenaza"], "Amenazada"],
      3,
      1.5,
    ],
  },
};

interface CapaAvistamientosProps {
  data: AvistamientosFeatureCollection;
  selected: AvistamientoFeature | null;
  onClosePopup: () => void;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <>
      <dt className="font-semibold text-slate-600">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

export function CapaAvistamientos({
  data,
  selected,
  onClosePopup,
}: CapaAvistamientosProps) {
  return (
    <>
      <Source
        id={AVISTAMIENTOS_SOURCE_ID}
        type="geojson"
        data={data}
        cluster
        clusterMaxZoom={12}
        clusterRadius={48}
      >
        <Layer {...CLUSTER_LAYER} />
        <Layer {...CLUSTER_COUNT_LAYER} />
        <Layer {...PROTECTED_HALO_LAYER} />
        <Layer {...AVISTAMIENTOS_LAYER} />
      </Source>

      {selected && (
        <Popup
          longitude={selected.geometry.coordinates[0]}
          latitude={selected.geometry.coordinates[1]}
          anchor="bottom"
          closeOnClick={false}
          onClose={onClosePopup}
          maxWidth="320px"
        >
          <article className="min-w-56 p-1 text-slate-700">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">
              Avistamiento científico
            </p>
            <h3 className="mt-1 pr-4 text-sm font-bold text-slate-950">
              {selected.properties.especie ?? "Especie sin identificar"}
            </h3>
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-1 text-[0.65rem] font-bold ${
                GROUP_STYLES[selected.properties.grupo_biologico]
              }`}
            >
              {selected.properties.grupo_biologico}
            </span>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <DetailRow label="Reino" value={selected.properties.reino} />
              <DetailRow label="Clase" value={selected.properties.clase_taxonomica} />
              <DetailRow label="Familia" value={selected.properties.familia} />
              <DetailRow label="Género" value={selected.properties.genero} />
              <DetailRow label="Fuente" value={selected.properties.origen} />
              <DetailRow label="Comuna" value={selected.properties.comuna} />
              <DetailRow label="Parque" value={selected.properties.parque} />
              <DetailRow label="Amenaza" value={selected.properties.grado_amenaza} />
              <dt className="font-semibold text-slate-600">Área protegida</dt>
              <dd>{selected.properties.protegido ? "Sí" : "No"}</dd>
            </dl>
          </article>
        </Popup>
      )}
    </>
  );
}
