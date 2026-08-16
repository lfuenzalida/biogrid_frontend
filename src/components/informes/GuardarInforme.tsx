"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, LoaderCircle, Save, X } from "lucide-react";
import { crearInforme } from "@/services/informes";
import type { AreaConsulta, GrupoBiologico } from "@/types/avistamientos";

interface GuardarInformeProps {
  area: AreaConsulta | null;
  gruposBiologicos: GrupoBiologico[];
  regionName: string;
  isReady: boolean;
}

export function GuardarInforme({
  area,
  gruposBiologicos,
  regionName,
  isReady,
}: GuardarInformeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    setSavedName("");
  }, [area, gruposBiologicos]);

  if (!area || !isReady) return null;

  const openModal = () => {
    const date = new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    setNombre(`Informe territorial · ${regionName} · ${date}`);
    setDescripcion("");
    setError("");
    setIsOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nombre.trim() || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      // Mapbox Draw agrega un `id` al Feature en runtime. El contrato estricto
      // del backend acepta solo los campos GeoJSON estándar.
      const poligono = {
        type: "Feature" as const,
        properties: area.properties ?? {},
        geometry: {
          type: "Polygon" as const,
          coordinates: area.geometry.coordinates,
        },
      };

      const report = await crearInforme({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        estado: "COMPLETADO",
        poligono,
        filtros:
          gruposBiologicos.length > 0
            ? { grupos_biologicos: gruposBiologicos }
            : undefined,
      });

      setSavedName(report.nombre);
      setIsOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No fue posible guardar el informe.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="mt-4 border-t border-slate-200 pt-4">
        {savedName ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-900">
            <CheckCircle2 aria-hidden="true" className="mx-auto h-5 w-5 sm:mx-0" />
            <p className="mt-1 hidden text-xs font-semibold sm:block">Informe guardado</p>
            <Link
              href="/historial"
              className="mt-1 hidden text-[0.65rem] font-bold underline underline-offset-2 sm:block"
            >
              Abrir repositorio
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={openModal}
            title="Guardar informe territorial"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-2 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          >
            <Save aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Guardar informe</span>
          </button>
        )}
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-report-title"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <FileText aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="save-report-title" className="text-lg font-bold text-slate-950">
                    Guardar informe territorial
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    La API calculará ubicación, coordenadas y especies del área.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                aria-label="Cerrar"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre del informe
                <input
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  maxLength={150}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Descripción opcional
                <textarea
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Objetivo, alcance u observaciones del análisis…"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !nombre.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isSaving ? "Generando…" : "Guardar informe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
