"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Eye,
  FileText,
  FolderClock,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { listarInformes } from "@/services/informes";
import type {
  InformeEstado,
  InformeListItem,
  PaginationMeta,
} from "@/types/informes";
import { DetalleInforme } from "./DetalleInforme";

const EMPTY_META: PaginationMeta = {
  total: 0,
  limit: 20,
  has_more: false,
  next_cursor: null,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: InformeEstado }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${status === "COMPLETADO" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
      {status === "COMPLETADO" ? "Completado" : "Borrador"}
    </span>
  );
}

export function RepositorioInformes() {
  const [reports, setReports] = useState<InformeListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InformeEstado | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadReports = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError("");
      try {
        const result = await listarInformes(
          { limit: 20, buscar: search, estado: status },
          signal,
        );
        setReports(result.items);
        setMeta(result.meta);
      } catch (loadError) {
        if (signal?.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar el repositorio.",
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [search, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    // La carga inicial sincroniza el componente con el repositorio remoto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports(controller.signal);
    return () => controller.abort();
  }, [loadReports]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
  };

  const loadMore = async () => {
    if (!meta.next_cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setError("");
    try {
      const result = await listarInformes({
        limit: 20,
        cursor: meta.next_cursor,
        buscar: search,
        estado: status,
      });
      setReports((current) => [...current, ...result.items]);
      setMeta(result.meta);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No fue posible cargar más informes.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const updateListItem = (updated: InformeListItem) => {
    setReports((current) =>
      current.map((report) => (report.id === updated.id ? updated : report)),
    );
  };

  const removeListItem = (informeId: string) => {
    setReports((current) => current.filter((report) => report.id !== informeId));
    setMeta((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
    setSelectedId(null);
  };

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            BioGrid Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Repositorio territorial
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Consulta, administra y revisa los informes generados desde la consola geoespacial.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold text-emerald-700">Informes almacenados</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">
            {meta.total.toLocaleString("es-CL")}
          </p>
        </div>
      </header>

      <div className="mt-7 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <form onSubmit={submitSearch} className="relative flex-1 sm:max-w-md">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar por nombre o ubicación…"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
            />
          </form>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as InformeEstado | "")}
              aria-label="Filtrar por estado"
              className="min-w-36 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-emerald-600"
            >
              <option value="">Todos</option>
              <option value="BORRADOR">Borradores</option>
              <option value="COMPLETADO">Completados</option>
            </select>
            <button
              type="button"
              onClick={() => void loadReports()}
              aria-label="Actualizar repositorio"
              title="Actualizar"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              <RefreshCw aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{error}</p>
              <p className="mt-1 text-xs text-red-600">Verifica que tu sesión siga activa.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-80 place-items-center text-emerald-800">
            <div className="text-center">
              <LoaderCircle aria-hidden="true" className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm font-semibold">Cargando repositorio…</p>
            </div>
          </div>
        ) : reports.length === 0 && !error ? (
          <div className="grid min-h-96 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-700">
                <FolderClock aria-hidden="true" className="h-8 w-8" />
              </span>
              <h2 className="mt-5 text-lg font-bold text-slate-900">Aún no hay informes</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Dibuja un área en la Consola Geoespacial y utiliza “Guardar informe”.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Informe</th>
                    <th className="px-5 py-3">Ubicación</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 text-right">Especies</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.id} className="transition hover:bg-emerald-50/40">
                      <td className="max-w-sm px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-emerald-800">
                            <FileText aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{report.nombre}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{report.descripcion ?? `Versión ${report.version}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                          {report.ubicacion.etiqueta ?? "Sin determinar"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(report.fecha_creacion)}</td>
                      <td className="px-5 py-4 text-right text-sm font-bold tabular-nums text-slate-800">{report.resumen.total_especies.toLocaleString("es-CL")}</td>
                      <td className="px-5 py-4"><StatusBadge status={report.estado} /></td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedId(report.id)}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                        >
                          <Eye aria-hidden="true" className="h-4 w-4" />
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <StatusBadge status={report.estado} />
                      <p className="mt-2 truncate font-bold text-slate-900">{report.nombre}</p>
                    </div>
                    <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                    {report.ubicacion.etiqueta ?? "Ubicación no determinada"}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="h-4 w-4" />
                      {formatDate(report.fecha_creacion)}
                    </span>
                    <span className="font-bold text-emerald-900">{report.resumen.total_especies} especies</span>
                  </div>
                </button>
              ))}
            </div>

            {meta.has_more && meta.next_cursor && (
              <div className="border-t border-slate-200 p-4 text-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {isLoadingMore && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Cargar más
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && (
        <DetalleInforme
          informeId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={updateListItem}
          onDeleted={removeListItem}
        />
      )}
    </section>
  );
}
