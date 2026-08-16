"use client";

import {
  CircleHelp,
  CircleDotDashed,
  ChevronDown,
  Layers3,
  Leaf,
  PawPrint,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import type { GrupoBiologico } from "@/types/avistamientos";

interface FilterItem {
  value: GrupoBiologico;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}

const FILTER_ITEMS: FilterItem[] = [
  {
    value: "FLORA",
    label: "Flora",
    icon: Leaf,
    activeClass: "border-green-600 bg-green-50 text-green-800",
  },
  {
    value: "FAUNA",
    label: "Fauna",
    icon: PawPrint,
    activeClass: "border-sky-600 bg-sky-50 text-sky-800",
  },
  {
    value: "FUNGI",
    label: "Fungi",
    icon: CircleDotDashed,
    activeClass: "border-violet-600 bg-violet-50 text-violet-800",
  },
  {
    value: "OTRO",
    label: "Otros",
    icon: Shapes,
    activeClass: "border-amber-600 bg-amber-50 text-amber-800",
  },
  {
    value: "DESCONOCIDO",
    label: "Sin clasificar",
    icon: CircleHelp,
    activeClass: "border-slate-500 bg-slate-100 text-slate-800",
  },
];

interface FiltrosBiologicosProps {
  selectedGroups: GrupoBiologico[];
  counts: Partial<Record<GrupoBiologico, number>>;
  hasArea: boolean;
  isLoading: boolean;
  onSelectAll: () => void;
  onToggle: (group: GrupoBiologico) => void;
}

export function FiltrosBiologicos({
  selectedGroups,
  counts,
  hasArea,
  isLoading,
  onSelectAll,
  onToggle,
}: FiltrosBiologicosProps) {
  if (!hasArea) return null;

  const allSelected = selectedGroups.length === 0;

  return (
    <section aria-label="Filtros biológicos" className="mt-4 border-t border-slate-200 pt-4">
      <details open className="group">
        <summary className="mb-2 flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 sm:justify-between [&::-webkit-details-marker]:hidden">
          <div className="hidden sm:block">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            Biodiversidad
          </p>
          <h2 className="mt-0.5 text-xs font-semibold text-slate-800">
            Filtrar avistamientos
          </h2>
          </div>
          <Layers3 aria-hidden="true" className="h-4 w-4 text-emerald-700 sm:hidden" />
          <span className="flex items-center gap-1.5">
            {isLoading && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" title="Actualizando" />
            )}
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </span>
        </summary>

        <div className="flex flex-col gap-1.5">
        <button
          type="button"
          aria-pressed={allSelected}
          title="Mostrar todos"
          onClick={onSelectAll}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:justify-start ${
            allSelected
              ? "border-emerald-700 bg-emerald-800 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers3 aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Todos</span>
        </button>

        {FILTER_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = selectedGroups.includes(item.value);
          const count = counts[item.value];

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isActive}
              title={item.label}
              onClick={() => onToggle(item.value)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:justify-start ${
                isActive
                  ? item.activeClass
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="hidden min-w-0 flex-1 truncate text-left sm:inline">
                {item.label}
              </span>
              {count !== undefined && count > 0 && (
                <span className="hidden rounded-full bg-white/80 px-1.5 py-0.5 text-[0.6rem] tabular-nums sm:inline">
                  {count.toLocaleString("es-CL")}
                </span>
              )}
            </button>
          );
        })}
        </div>
      </details>

      {!hasArea && (
        <p className="mt-2 hidden text-[0.65rem] leading-relaxed text-slate-500 sm:block">
          Selecciona filtros y dibuja un área para consultar.
        </p>
      )}
    </section>
  );
}
