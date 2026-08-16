"use client";

import Link from "next/link";
import {
  Building2,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";

export function AdministrationView() {
  const { profile, loading, isAdmin } = useProfile();

  if (loading) return <AuthLoadingScreen />;

  if (!profile || !isAdmin) {
    return (
      <section className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center">
        <div className="w-full rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            <LockKeyhole aria-hidden="true" className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-slate-950">
            Acceso administrativo restringido
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Tu cuenta no posee un rol administrativo activo. Los roles y la
            organización solo pueden ser asignados desde un servicio confiable.
          </p>
          <Link
            href="/perfil"
            className="mt-7 inline-flex rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
          >
            Volver a mi perfil
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
          BioGrid B2B
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Administración</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Gobierno de organización, miembros y permisos. Esta zona utiliza el
          perfil central y exige rol ADMIN activo.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            title: "Organización",
            value: profile.organizationName ?? "Sin asignar",
            icon: Building2,
          },
          { title: "Miembros", value: "Módulo por integrar", icon: UsersRound },
          { title: "Permisos", value: "Controlados por backend", icon: ShieldCheck },
        ].map(({ title, value, icon: Icon }) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-1 font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <UserCog aria-hidden="true" className="mx-auto h-9 w-9 text-slate-400" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Base administrativa lista</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          La gestión de miembros requiere endpoints administrativos que utilicen
          Firebase Admin o el backend BioGrid; no se ejecutará directamente desde Firestore cliente.
        </p>
      </div>
    </section>
  );
}
