"use client";

import { ChevronDown, MapPinned } from "lucide-react";

export interface RegionView {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

export const CHILE_REGION_VIEWS: RegionView[] = [
  { id: "arica", name: "Arica y Parinacota", latitude: -18.4783, longitude: -70.3126, zoom: 8 },
  { id: "tarapaca", name: "Tarapacá", latitude: -20.2307, longitude: -70.1357, zoom: 8 },
  { id: "antofagasta", name: "Antofagasta", latitude: -23.6509, longitude: -70.3975, zoom: 8 },
  { id: "atacama", name: "Atacama", latitude: -27.3668, longitude: -70.3323, zoom: 8 },
  { id: "coquimbo", name: "Coquimbo", latitude: -29.9533, longitude: -71.3395, zoom: 8 },
  { id: "valparaiso", name: "Valparaíso", latitude: -33.0472, longitude: -71.6127, zoom: 8 },
  { id: "metropolitana", name: "Metropolitana de Santiago", latitude: -33.4489, longitude: -70.6693, zoom: 9 },
  { id: "ohiggins", name: "O'Higgins", latitude: -34.1708, longitude: -70.7444, zoom: 8 },
  { id: "maule", name: "Maule", latitude: -35.4264, longitude: -71.6554, zoom: 8 },
  { id: "nuble", name: "Ñuble", latitude: -36.6066, longitude: -72.1034, zoom: 8 },
  { id: "biobio", name: "Biobío", latitude: -36.8201, longitude: -73.0444, zoom: 8 },
  { id: "araucania", name: "La Araucanía", latitude: -38.7359, longitude: -72.5904, zoom: 8 },
  { id: "los-rios", name: "Los Ríos", latitude: -39.8196, longitude: -73.2452, zoom: 8 },
  { id: "los-lagos", name: "Los Lagos", latitude: -41.4689, longitude: -72.9411, zoom: 7 },
  { id: "aysen", name: "Aysén", latitude: -45.5752, longitude: -72.0662, zoom: 7 },
  { id: "magallanes", name: "Magallanes", latitude: -53.1638, longitude: -70.9171, zoom: 7 },
];

interface SelectorRegionProps {
  value: string;
  onChange: (regionId: string) => void;
}

export function SelectorRegion({ value, onChange }: SelectorRegionProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <section aria-label="Navegación territorial" className="mt-3 border-t border-slate-200 pt-3">
      <div className="hidden sm:block">
        <p className="sr-only">
          Territorio
        </p>
        <label htmlFor="region-selector" className="sr-only">
          Ir a una región
        </label>
        <div className="relative">
          <MapPinned aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
          <select
            id="region-selector"
            value={value}
            onChange={handleChange}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
          >
            {CHILE_REGION_VIEWS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="relative flex justify-center sm:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-700">
          <MapPinned aria-hidden="true" className="h-5 w-5" />
        </div>
        <select
          aria-label="Ir a una región"
          title="Ir a una región"
          value={value}
          onChange={handleChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {CHILE_REGION_VIEWS.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
