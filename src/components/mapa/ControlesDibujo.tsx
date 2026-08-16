"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl/maplibre";
import { Check, Hand, Pencil, Pentagon, Trash2, X } from "lucide-react";

interface DrawCreateEvent {
  features: Feature<Polygon>[];
}

interface DrawEventTarget {
  on(type: "draw.create", listener: (event: DrawCreateEvent) => void): void;
  off(type: "draw.create", listener: (event: DrawCreateEvent) => void): void;
}

interface ControlesDibujoProps {
  onCreate?: (geojson: FeatureCollection<Polygon>) => void;
  onClear?: () => void;
  filterPanel?: ReactNode;
  portalTarget: HTMLElement | null;
}

type DrawingTool = "navigate" | "freehand" | "polygon";

const FREEHAND_SOURCE_ID = "biogrid-freehand-preview";
const FREEHAND_FILL_LAYER_ID = "biogrid-freehand-preview-fill";
const FREEHAND_LINE_LAYER_ID = "biogrid-freehand-preview-line";
const LOCKED_SELECT_MODE = {
  onSetup(this: {
    setSelected(ids: string[]): void;
    setActionableState(actions: Record<string, boolean>): void;
  }) {
    this.setSelected([]);
    this.setActionableState({
      combineFeatures: false,
      uncombineFeatures: false,
      trash: false,
    });
    return {};
  },
  toDisplayFeatures(
    _state: Record<string, never>,
    geojson: Feature,
    display: (feature: Feature) => void,
  ) {
    geojson.properties = {
      ...(geojson.properties ?? {}),
      active: "false",
    };
    display(geojson);
  },
};

function ensureFreehandPreview(map: MapLibreMap) {
  if (!map.getSource(FREEHAND_SOURCE_ID)) {
    map.addSource(FREEHAND_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getLayer(FREEHAND_FILL_LAYER_ID)) {
    map.addLayer({
      id: FREEHAND_FILL_LAYER_ID,
      type: "fill",
      source: FREEHAND_SOURCE_ID,
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": "#14b8a6",
        "fill-opacity": 0.22,
      },
    });
  }

  if (!map.getLayer(FREEHAND_LINE_LAYER_ID)) {
    map.addLayer({
      id: FREEHAND_LINE_LAYER_ID,
      type: "line",
      source: FREEHAND_SOURCE_ID,
      filter: ["==", "$type", "LineString"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#0f766e",
        "line-width": 4,
        "line-opacity": 0.95,
      },
    });
  }
}

function updateFreehandPreview(
  map: MapLibreMap,
  coordinates: [number, number][],
) {
  const features: Array<Feature<LineString | Polygon>> = [];

  if (coordinates.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [...coordinates] },
    });
  }

  if (coordinates.length >= 3) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[...coordinates, coordinates[0]]],
      },
    });
  }

  const source = map.getSource(FREEHAND_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData({ type: "FeatureCollection", features });
}

function removeFreehandPreview(map: MapLibreMap) {
  if (map.getLayer(FREEHAND_LINE_LAYER_ID)) map.removeLayer(FREEHAND_LINE_LAYER_ID);
  if (map.getLayer(FREEHAND_FILL_LAYER_ID)) map.removeLayer(FREEHAND_FILL_LAYER_ID);
  if (map.getSource(FREEHAND_SOURCE_ID)) map.removeSource(FREEHAND_SOURCE_ID);
}

function lockMapNavigation(map: MapLibreMap) {
  map.dragPan.disable();
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.dragRotate.disable();
  map.touchZoomRotate.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.getCanvas().style.cursor = "crosshair";
}

function unlockMapNavigation(map: MapLibreMap) {
  map.dragPan.enable();
  map.scrollZoom.enable();
  map.boxZoom.enable();
  map.dragRotate.enable();
  map.touchZoomRotate.enable();
  map.keyboard.enable();
  map.doubleClickZoom.enable();
  map.getCanvas().style.cursor = "";
}

interface DrawStyle {
  id: string;
  type: "fill" | "line" | "circle";
  filter?: unknown[];
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}

const DRAW_STYLES = [
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "active"], "true"],
        "#14b8a6",
        "#047857",
      ],
      "fill-opacity": 0.18,
    },
  },
  {
    id: "gl-draw-lines",
    type: "line",
    filter: [
      "any",
      ["==", "$type", "LineString"],
      ["==", "$type", "Polygon"],
    ],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "active"], "true"],
        "#14b8a6",
        "#047857",
      ],
      "line-width": 3,
    },
  },
  {
    id: "gl-draw-point-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: { "circle-radius": 7, "circle-color": "#ffffff" },
  },
  {
    id: "gl-draw-point-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: { "circle-radius": 5, "circle-color": "#14b8a6" },
  },
  {
    id: "gl-draw-vertex-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
    paint: { "circle-radius": 7, "circle-color": "#ffffff" },
  },
  {
    id: "gl-draw-vertex-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
    paint: { "circle-radius": 5, "circle-color": "#14b8a6" },
  },
  {
    id: "gl-draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"]],
    paint: { "circle-radius": 4, "circle-color": "#14b8a6" },
  },
] satisfies DrawStyle[];

// Adapta los nombres de clase de Draw al canvas de MapLibre.
MapboxDraw.constants.classes.CANVAS = "maplibregl-canvas";
MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";
MapboxDraw.constants.classes.ATTRIBUTION = "maplibregl-ctrl-attrib";

export function ControlesDibujo({
  onCreate,
  onClear,
  filterPanel,
  portalTarget,
}: ControlesDibujoProps) {
  const [activeTool, setActiveTool] = useState<DrawingTool>("navigate");
  const [status, setStatus] = useState("Selecciona una herramienta de dibujo.");
  const mapRef = useRef<MapLibreMap | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const cleanupFreehandRef = useRef<(() => void) | null>(null);

  const emitGeoJSON = useCallback(
    (features: Feature<Polygon>[]) => {
      const geojson: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features,
      };

      console.log("Polígono GeoJSON creado:", geojson);
      onCreate?.(geojson);
    },
    [onCreate],
  );

  const handleCreate = useCallback(
    (event: DrawCreateEvent) => {
      emitGeoJSON(event.features);
      // Draw cambia internamente a `simple_select` después de emitir create.
      // Aplicamos el bloqueo en el siguiente frame para que sea el modo final.
      window.requestAnimationFrame(() => {
        drawRef.current?.changeMode("locked_select");
      });
      if (mapRef.current) unlockMapNavigation(mapRef.current);
      setActiveTool("navigate");
      setStatus("Polígono creado y bloqueado. Ya puedes mover el mapa.");
    },
    [emitGeoJSON],
  );

  const draw = useControl<MapboxDraw>(
    () => {
      const instance = new MapboxDraw({
        displayControlsDefault: false,
        defaultMode: "simple_select",
        styles: DRAW_STYLES,
        modes: {
          ...MapboxDraw.modes,
          locked_select: LOCKED_SELECT_MODE,
        },
      });
      drawRef.current = instance;
      return instance;
    },
    ({ map }) => {
      const nativeMap = map.getMap();
      mapRef.current = nativeMap;
      const eventTarget = nativeMap as unknown as DrawEventTarget;
      eventTarget.on("draw.create", handleCreate);
    },
    ({ map }) => {
      cleanupFreehandRef.current?.();
      const eventTarget = map.getMap() as unknown as DrawEventTarget;
      eventTarget.off("draw.create", handleCreate);
      mapRef.current = null;
      drawRef.current = null;
    },
    { position: "top-left" },
  );

  useEffect(() => () => cleanupFreehandRef.current?.(), []);

  useEffect(() => {
    if (activeTool !== "navigate" || draw.getAll().features.length === 0) return;

    draw.changeMode("locked_select");
    if (mapRef.current) unlockMapNavigation(mapRef.current);
  }, [activeTool, draw]);

  const restoreNavigation = () => {
    cleanupFreehandRef.current?.();
    cleanupFreehandRef.current = null;
    draw.changeMode(
      draw.getAll().features.length > 0 ? "locked_select" : "simple_select",
    );
    if (mapRef.current) unlockMapNavigation(mapRef.current);
    setActiveTool("navigate");
  };

  const selectNavigation = () => {
    restoreNavigation();
    setStatus("Modo navegación activo: arrastra para mover el mapa.");
  };

  const startPolygon = () => {
    restoreNavigation();
    draw.deleteAll();
    onClear?.();
    draw.changeMode("draw_polygon");
    if (mapRef.current) lockMapNavigation(mapRef.current);
    setActiveTool("polygon");
    setStatus("Añade al menos 3 vértices y pulsa Finalizar.");
  };

  const finishPolygon = () => {
    draw.changeMode("locked_select");
    if (mapRef.current) unlockMapNavigation(mapRef.current);
    setActiveTool("navigate");
    setStatus("Polígono finalizado y bloqueado. Ya puedes mover el mapa.");
  };

  const cancelDrawing = () => {
    if (activeTool === "polygon") draw.trash();
    restoreNavigation();
    setStatus("Dibujo cancelado.");
  };

  const startFreehand = () => {
    restoreNavigation();
    draw.deleteAll();
    onClear?.();

    const map = mapRef.current;
    if (!map) return;

    const coordinates: [number, number][] = [];
    let isPointerDown = false;
    let lastPoint: { x: number; y: number } | null = null;

    const handleMouseDown = (event: MapMouseEvent) => {
      if (event.originalEvent.button !== 0) return;
      isPointerDown = true;
      coordinates.length = 0;
      coordinates.push([event.lngLat.lng, event.lngLat.lat]);
      lastPoint = { x: event.point.x, y: event.point.y };
      ensureFreehandPreview(map);
    };

    const handleMouseMove = (event: MapMouseEvent) => {
      if (!isPointerDown || !lastPoint) return;

      const distance = Math.hypot(
        event.point.x - lastPoint.x,
        event.point.y - lastPoint.y,
      );

      if (distance < 4) return;
      coordinates.push([event.lngLat.lng, event.lngLat.lat]);
      lastPoint = { x: event.point.x, y: event.point.y };
      updateFreehandPreview(map, coordinates);
    };

    const handleMouseUp = () => {
      if (!isPointerDown) return;
      isPointerDown = false;

      if (coordinates.length < 3) {
        removeFreehandPreview(map);
        setStatus("Trazo demasiado corto. Mantén presionado y dibuja una superficie.");
        return;
      }

      const polygon: Feature<Polygon> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[...coordinates, coordinates[0]]],
        },
      };

      draw.add(polygon);
      emitGeoJSON([polygon]);
      restoreNavigation();
      setStatus("Polígono dibujado y bloqueado. Ya puedes mover el mapa.");
    };

    const cleanup = () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      removeFreehandPreview(map);
      unlockMapNavigation(map);
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    ensureFreehandPreview(map);
    lockMapNavigation(map);
    cleanupFreehandRef.current = cleanup;
    setActiveTool("freehand");
    setStatus("Mantén presionado el botón izquierdo, dibuja el contorno y suelta para terminar.");
  };

  const clearDrawing = () => {
    restoreNavigation();
    draw.deleteAll();
    onClear?.();
    setStatus("Todos los polígonos fueron eliminados.");
  };

  if (!portalTarget) return null;

  return createPortal(
    <div className="flex h-full flex-col p-2 sm:p-4">
      <div className="mb-4 hidden sm:block">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Herramientas
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-900">
          Área de dibujo
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={selectNavigation}
          disabled={activeTool !== "navigate"}
          aria-pressed={activeTool === "navigate"}
          title="Mover y seleccionar"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45 ${
            activeTool === "navigate"
              ? "bg-emerald-800 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50"
          }`}
        >
          <Hand aria-hidden="true" className="h-5 w-5" />
          <span className="hidden sm:inline">Mover</span>
        </button>

        <button
          type="button"
          onClick={startFreehand}
          disabled={activeTool === "polygon"}
          aria-pressed={activeTool === "freehand"}
          title="Dibujo a mano alzada"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-45 ${
            activeTool === "freehand"
              ? "bg-teal-500 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700"
          }`}
        >
          <Pencil aria-hidden="true" className="h-5 w-5" />
          <span className="hidden sm:inline">Dibujar</span>
        </button>

        <button
          type="button"
          onClick={startPolygon}
          disabled={activeTool === "freehand"}
          aria-pressed={activeTool === "polygon"}
          title="Polígono por vértices"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-45 ${
            activeTool === "polygon"
              ? "bg-teal-500 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700"
          }`}
        >
          <Pentagon aria-hidden="true" className="h-5 w-5" />
          <span className="hidden sm:inline">Polígono</span>
        </button>

        {activeTool === "polygon" && (
          <button
            type="button"
            onClick={finishPolygon}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-900"
          >
            <Check aria-hidden="true" className="h-5 w-5" />
            <span className="hidden sm:inline">Finalizar</span>
          </button>
        )}

        {activeTool !== "navigate" && (
            <button
              type="button"
              onClick={cancelDrawing}
              title="Cancelar dibujo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <X aria-hidden="true" className="h-5 w-5" />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
        )}

        <button
          type="button"
          onClick={clearDrawing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20"
        >
          <Trash2 aria-hidden="true" className="h-5 w-5" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>

      {filterPanel}

      <div className="mt-auto hidden border-t border-slate-200 pt-4 sm:block">
        <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
          Estado
        </p>
        <p aria-live="polite" className="text-xs leading-relaxed text-slate-600">
          {status}
        </p>
      </div>
    </div>,
    portalTarget,
  );
}
