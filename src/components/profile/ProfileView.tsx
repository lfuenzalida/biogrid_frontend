"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";

function formatDate(value: Date | null) {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ProfileView() {
  const { user } = useAuth();
  const { profile, loading, error, refreshProfile, saveProfile } = useProfile();
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (profile) setFullName(profile.fullName);
  }, [profile]);

  if (loading) return <AuthLoadingScreen />;

  if (!profile || !user) {
    return (
      <section className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Perfil no disponible</h1>
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error || "No fue posible recuperar la información de tu perfil."}
          </p>
          <button
            type="button"
            onClick={() => void refreshProfile()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  const hasChanges = fullName.trim() !== profile.fullName;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    setSaveError("");
    setSuccess("");

    try {
      await saveProfile({ fullName });
      setSuccess("Tu nombre fue actualizado en Firebase y Firestore.");
    } catch (updateError) {
      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "No fue posible actualizar tu perfil.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-600 p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25">
            <UserRound aria-hidden="true" className="h-10 w-10" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">
              Identidad BioGrid
            </p>
            <h1 className="mt-2 truncate text-3xl font-bold sm:text-4xl">
              {profile.fullName}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-50/85">
              <Mail aria-hidden="true" className="h-4 w-4" />
              {profile.email}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
              <BadgeCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Datos personales</h2>
              <p className="mt-1 text-sm text-slate-500">
                El nombre es el único dato editable desde esta vista.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Nombre completo
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                minLength={2}
                maxLength={120}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Correo electrónico
              <input
                value={profile.email}
                readOnly
                className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              UID de Firebase
              <div className="relative mt-2">
                <KeyRound
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={profile.uid}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-mono text-xs text-slate-500"
                />
              </div>
            </label>
          </div>

          {saveError && (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {saveError}
            </p>
          )}
          {success && (
            <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              {success}
            </p>
          )}

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={!hasChanges || isSaving || fullName.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              {isSaving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-950">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-700" />
              Estado de cuenta
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Estado</dt>
                <dd className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
                  {profile.status === "ACTIVE" ? "Activa" : "Suspendida"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Rol</dt>
                <dd className="font-bold text-slate-800">
                  {profile.role === "ADMIN" ? "Administrador" : "Usuario"}
                </dd>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Building2 aria-hidden="true" className="h-4 w-4" />
                  Organización
                </dt>
                <dd className="mt-2 font-semibold text-slate-800">
                  {profile.organizationName ?? "Sin organización asignada"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-950">
              <CalendarDays aria-hidden="true" className="h-5 w-5 text-teal-700" />
              Registro
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Creado</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {formatDate(profile.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Última actualización</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {formatDate(profile.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}
