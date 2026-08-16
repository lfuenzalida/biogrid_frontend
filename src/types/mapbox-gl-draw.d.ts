declare module "@mapbox/mapbox-gl-draw" {
  import type { Feature, FeatureCollection, Geometry } from "geojson";
  import type { IControl, Map } from "maplibre-gl";

  interface DrawStyle {
    id: string;
    type: "fill" | "line" | "circle";
    filter?: unknown[];
    layout?: Record<string, unknown>;
    paint?: Record<string, unknown>;
  }

  interface DrawOptions {
    displayControlsDefault?: boolean;
    controls?: {
      point?: boolean;
      line_string?: boolean;
      polygon?: boolean;
      trash?: boolean;
      combine_features?: boolean;
      uncombine_features?: boolean;
    };
    defaultMode?: string;
    styles?: DrawStyle[];
    modes?: Record<string, unknown>;
  }

  interface DrawClasses {
    CANVAS: string;
    CONTROL_BASE: string;
    CONTROL_PREFIX: string;
    CONTROL_GROUP: string;
    ATTRIBUTION: string;
  }

  export default class MapboxDraw implements IControl {
    static constants: { classes: DrawClasses };
    static modes: Record<string, unknown>;

    constructor(options?: DrawOptions);
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
    getAll(): FeatureCollection<Geometry>;
    changeMode(mode: string): this;
    add(feature: Feature<Geometry>): string[];
    trash(): this;
    deleteAll(): this;
  }
}
