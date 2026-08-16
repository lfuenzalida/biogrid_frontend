"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import Map, { NavigationControl, type MapRef } from "react-map-gl/maplibre";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { GuardarInforme } from "@/components/informes/GuardarInforme";
import { buscarAvistamientosPorPoligono } from "@/services/avistamientos";
import type {
  AvistamientoFeature,
  AvistamientoProperties,
  AvistamientosFeatureCollection,
  AreaConsulta,
  GrupoBiologico,
} from "@/types/avistamientos";
import {
  AVISTAMIENTOS_LAYER_ID,
  AVISTAMIENTOS_CLUSTER_LAYER_ID,
  AVISTAMIENTOS_SOURCE_ID,
  CapaAvistamientos,
} from "./CapaAvistamientos";
import { ControlesDibujo } from "./ControlesDibujo";
import { FiltrosBiologicos } from "./FiltrosBiologicos";
import { LeyendaAvistamientos } from "./LeyendaAvistamientos";
import { CHILE_REGION_VIEWS, SelectorRegion } from "./SelectorRegion";

const CARTO_POSITRON_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const REGION_METROPOLITANA_VIEW = {
  latitude: -33.4489,
  longitude: -70.6693,
  zoom: 9,
};

const EMPTY_AVISTAMIENTOS: AvistamientosFeatureCollection = {
  type: "FeatureCollection",
  features: [],
  meta: {
    total: 0,
    limit: 1000,
    has_more: false,
    next_cursor: null,
  },
};

export function VisorCartografico() {
  const mapRef = useRef<MapRef | null>(null);
  const [toolsPanel, setToolsPanel] = useState<HTMLElement | null>(null);
  const [avistamientos, setAvistamientos] =
    useState<AvistamientosFeatureCollection>(EMPTY_AVISTAMIENTOS);
  const [selectedAvistamiento, setSelectedAvistamiento] =
    useState<AvistamientoFeature | null>(null);
  const [lastArea, setLastArea] = useState<AreaConsulta | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<GrupoBiologico[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("metropolitana");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const queryAvistamientos = useCallback(
    async (polygon: AreaConsulta, groups: GrupoBiologico[]) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setHasSearched(false);
      setError(null);
      setSelectedAvistamiento(null);
      setAvistamientos(EMPTY_AVISTAMIENTOS);

      try {
        const result = await buscarAvistamientosPorPoligono(
          polygon,
          { gruposBiologicos: groups },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setAvistamientos(result);
          setHasSearched(true);
        }
      } catch (queryError) {
        if (controller.signal.aborted) return;
        setError(
          queryError instanceof Error
            ? queryError.message
            : "No fue posible cargar los avistamientos.",
        );
      } finally {
        if (abortControllerRef.current === controller) setIsLoading(false);
      }
    },
    [],
  );

  const handlePolygonCreated = useCallback(
    (area: FeatureCollection<Polygon>) => {
      const polygon = area.features[area.features.length - 1];
      if (!polygon) return;

      setLastArea(polygon);
      void queryAvistamientos(polygon, selectedGroups);
    },
    [queryAvistamientos, selectedGroups],
  );

  const applyGroups = useCallback(
    (groups: GrupoBiologico[]) => {
      setSelectedGroups(groups);
      setSelectedAvistamiento(null);
      if (lastArea) void queryAvistamientos(lastArea, groups);
    },
    [lastArea, queryAvistamientos],
  );

  const toggleGroup = useCallback(
    (group: GrupoBiologico) => {
      const nextGroups = selectedGroups.includes(group)
        ? selectedGroups.filter((current) => current !== group)
        : [...selectedGroups, group];

      applyGroups(nextGroups);
    },
    [applyGroups, selectedGroups],
  );

  const groupCounts = useMemo(() => {
    const counts: Partial<Record<GrupoBiologico, number>> = {};

    avistamientos.features.forEach((feature) => {
      const group = feature.properties.grupo_biologico;
      counts[group] = (counts[group] ?? 0) + 1;
    });

    return counts;
  }, [avistamientos.features]);

  const selectedRegionName = useMemo(
    () =>
      CHILE_REGION_VIEWS.find((region) => region.id === selectedRegion)?.name ??
      "Chile",
    [selectedRegion],
  );

  const clearAvistamientos = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLastArea(null);
    setSelectedGroups([]);
    setAvistamientos(EMPTY_AVISTAMIENTOS);
    setSelectedAvistamiento(null);
    setError(null);
    setIsLoading(false);
    setHasSearched(false);
  }, []);

  const handleRegionChange = useCallback(
    (regionId: string) => {
      const region = CHILE_REGION_VIEWS.find((candidate) => candidate.id === regionId);
      if (!region) return;

      setSelectedRegion(regionId);
      clearAvistamientos();
      mapRef.current?.flyTo({
        center: [region.longitude, region.latitude],
        zoom: region.zoom,
        duration: 1400,
        essential: true,
      });
    },
    [clearAvistamientos],
  );

  const handleMapClick = useCallback(async (event: MapLayerMouseEvent) => {
    const cluster = event.features?.find(
      (candidate) => candidate.layer.id === AVISTAMIENTOS_CLUSTER_LAYER_ID,
    );

    if (cluster?.geometry.type === "Point") {
      const clusterId = Number(cluster.properties?.cluster_id);
      const source = event.target.getSource(
        AVISTAMIENTOS_SOURCE_ID,
      ) as GeoJSONSource | undefined;

      if (source && Number.isFinite(clusterId)) {
        const zoom = await source.getClusterExpansionZoom(clusterId);
        event.target.easeTo({
          center: cluster.geometry.coordinates as [number, number],
          zoom,
        });
      }
      return;
    }

    const feature = event.features?.find(
      (candidate) => candidate.layer.id === AVISTAMIENTOS_LAYER_ID,
    );

    if (!feature || feature.geometry.type !== "Point") return;

    setSelectedAvistamiento({
      type: "Feature",
      geometry: feature.geometry as Point,
      properties: feature.properties as AvistamientoProperties,
    });
  }, []);

  return (
    <section
      aria-label="Visor cartográfico de BioGrid"
      className="flex h-[calc(100vh-7rem)] min-h-[32rem] w-full gap-3"
    >
      <aside
        ref={setToolsPanel}
        aria-label="Herramientas de dibujo"
        className="w-16 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:w-56"
      />

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={REGION_METROPOLITANA_VIEW}
          mapStyle={CARTO_POSITRON_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{ compact: true }}
          interactiveLayerIds={[
            AVISTAMIENTOS_CLUSTER_LAYER_ID,
            AVISTAMIENTOS_LAYER_ID,
          ]}
          onClick={handleMapClick}
          onError={(event) => console.error("MapLibre:", event.error)}
        >
          <ControlesDibujo
            portalTarget={toolsPanel}
            onCreate={handlePolygonCreated}
            onClear={clearAvistamientos}
            filterPanel={
              <>
                <SelectorRegion value={selectedRegion} onChange={handleRegionChange} />
                <FiltrosBiologicos
                  selectedGroups={selectedGroups}
                  counts={groupCounts}
                  hasArea={lastArea !== null}
                  isLoading={isLoading}
                  onSelectAll={() => applyGroups([])}
                  onToggle={toggleGroup}
                />
                <GuardarInforme
                  area={lastArea}
                  gruposBiologicos={selectedGroups}
                  regionName={selectedRegionName}
                  isReady={hasSearched && !isLoading && error === null}
                />
              </>
            }
          />
          <CapaAvistamientos
            data={avistamientos}
            selected={selectedAvistamiento}
            onClosePopup={() => setSelectedAvistamiento(null)}
          />
          <NavigationControl position="top-right" showCompass showZoom />
        </Map>

        {lastArea && <LeyendaAvistamientos />}

        {(isLoading || error || hasSearched) && (
          <div
            aria-live="polite"
            className={`absolute left-4 top-4 z-10 flex max-w-xs items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-sm ${
              error
                ? "border-red-200 bg-red-50/95 text-red-800"
                : "border-emerald-100 bg-white/95 text-emerald-900"
            }`}
          >
            {isLoading && (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" />
            )}
            {error && (
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
            <span>
              {isLoading
                ? "Consultando biodiversidad en el área…"
                : error ??
                  `${avistamientos.features.length.toLocaleString("es-CL")}${
                    avistamientos.meta.total > avistamientos.features.length
                      ? ` de ${avistamientos.meta.total.toLocaleString("es-CL")}`
                      : ""
                  } avistamientos encontrados.`}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
