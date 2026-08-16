"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  LoaderCircle,
  MapPin,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  actualizarInforme,
  eliminarInforme,
  obtenerInforme,
} from "@/services/informes";
import type {
  InformeDetail,
  InformeEstado,
  InformeListItem,
} from "@/types/informes";

interface DetalleInformeProps {
  informeId: string;
  onClose: () => void;
  onUpdated: (informe: InformeListItem) => void;
  onDeleted: (informeId: string) => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export function DetalleInforme({
  informeId,
  onClose,
  onUpdated,
  onDeleted,
}: DetalleInformeProps) {
  const [report, setReport] = useState<InformeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<InformeEstado>("BORRADOR");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await obtenerInforme(informeId, controller.signal);
        setReport(result);
        setName(result.nombre);
        setDescription(result.descripcion ?? "");
        setStatus(result.estado);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar el informe.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [informeId]);

  const saveChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report || !name.trim() || isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      const updated = await actualizarInforme(report.id, {
        nombre: name.trim(),
        descripcion: description.trim() || null,
        estado: status,
      });
      setReport(updated);
      setIsEditing(false);
      onUpdated(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No fue posible guardar los cambios.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReport = async () => {
    if (!report || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      await eliminarInforme(report.id);
      onDeleted(report.id);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No fue posible eliminar el informe.",
      );
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelEdit = () => {
    if (!report) return;
    setName(report.nombre);
    setDescription(report.descripcion ?? "");
    setStatus(report.estado);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/35 backdrop-blur-[1px]">
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-detail-title"
        className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Informe territorial
            </p>
            <h2 id="report-detail-title" className="mt-1 text-lg font-bold text-slate-950">
              Detalle del análisis
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        {isLoading && (
          <div className="grid min-h-80 place-items-center text-emerald-800">
            <div className="text-center">
              <LoaderCircle aria-hidden="true" className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm font-semibold">Cargando informe…</p>
            </div>
          </div>
        )}

        {!isLoading && error && !report && (
          <div className="m-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <AlertCircle aria-hidden="true" className="h-6 w-6" />
            <p className="mt-2 text-sm font-semibold">{error}</p>
          </div>
        )}

        {report && (
          <div className="space-y-7 p-5 sm:p-7">
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            {isEditing ? (
              <form onSubmit={saveChanges} className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
                <label className="block text-sm font-semibold text-slate-700">
                  Nombre
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={150}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Descripción
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Estado
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as InformeEstado)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="COMPLETADO">Completado</option>
                  </select>
                </label>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !name.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {isSaving ? (
                      <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save aria-hidden="true" className="h-4 w-4" />
                    )}
                    Guardar cambios
                  </button>
                </div>
              </form>
            ) : (
              <section>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${report.estado === "COMPLETADO" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {report.estado === "COMPLETADO" ? "Completado" : "Borrador"}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                      {report.nombre}
                    </h3>
                    {report.descripcion && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                        {report.descripcion}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <MapPin aria-hidden="true" className="h-5 w-5 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Ubicación</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {report.ubicacion.etiqueta ?? "Ubicación no determinada"}
                </p>
                {report.ubicacion.estimada && (
                  <p className="mt-1 text-[0.65rem] text-amber-700">Ubicación estimada</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-emerald-700" />
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Fechas</p>
                <p className="mt-1 text-sm text-slate-700">Creado: {formatDate(report.fecha_creacion)}</p>
                <p className="mt-1 text-xs text-slate-500">Actualizado: {formatDate(report.fecha_actualizacion)}</p>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Resumen de biodiversidad</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[
                  ["Avistamientos", report.resumen.total_avistamientos],
                  ["Especies", report.resumen.total_especies],
                  ["Flora", report.resumen.flora],
                  ["Fauna", report.resumen.fauna],
                  ["Fungi", report.resumen.fungi],
                  ["Amenazadas", report.resumen.especies_amenazadas],
                  ["Protegidos", report.resumen.registros_protegidos],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-2xl font-bold tabular-nums text-emerald-900">
                      {Number(value).toLocaleString("es-CL")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Coordenadas del cuadrante</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-emerald-100">
                <p>Centroide: {formatCoordinate(report.centroide.coordinates[1])}, {formatCoordinate(report.centroide.coordinates[0])}</p>
                <p className="mt-2">Lng mín: {formatCoordinate(report.bounding_box[0])}</p>
                <p>Lat mín: {formatCoordinate(report.bounding_box[1])}</p>
                <p>Lng máx: {formatCoordinate(report.bounding_box[2])}</p>
                <p>Lat máx: {formatCoordinate(report.bounding_box[3])}</p>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Especies detectadas</h3>
                  <p className="mt-1 text-xs text-slate-500">Agrupadas por nombre científico dentro del polígono.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {report.especies_meta.total.toLocaleString("es-CL")}
                </span>
              </div>

              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Especie</th>
                      <th className="px-4 py-3">Grupo</th>
                      <th className="px-4 py-3">Amenaza</th>
                      <th className="px-4 py-3 text-right">Registros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.especies.map((species, index) => (
                      <tr key={`${species.nombre_cientifico ?? "sin-nombre"}-${index}`}>
                        <td className="px-4 py-3">
                          <p className="font-semibold italic text-slate-800">
                            {species.nombre_cientifico ?? "Especie sin identificar"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {species.familia ?? species.reino ?? "Taxonomía no disponible"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{species.grupo_biologico}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {species.grado_amenaza ?? "No evaluada"}
                          {species.protegida && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-800">Protegida</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">
                          {species.cantidad_avistamientos.toLocaleString("es-CL")}
                        </td>
                      </tr>
                    ))}
                    {report.especies.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                          El informe no contiene especies registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText aria-hidden="true" className="h-4 w-4" />
                Versión {report.version}
              </div>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Eliminar informe
              </button>
            </section>
          </div>
        )}
      </aside>

      {confirmDelete && report && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/55 p-4">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
              <Trash2 aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-950">¿Eliminar este informe?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              “{report.nombre}” dejará de aparecer en el repositorio. Esta acción no puede deshacerse desde la interfaz.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void deleteReport()}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isDeleting && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
