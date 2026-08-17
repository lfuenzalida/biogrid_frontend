"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ProtectedErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProtectedError({ error, reset }: ProtectedErrorProps) {
  useEffect(() => {
    console.error("Error en el área privada de BioGrid:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          No pudimos cargar esta sección
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Reintenta la operación. Si el problema continúa, vuelve al mapa y
          comienza una navegación nueva.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-slate-400">
            Referencia: {error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Reintentar
          </button>
          <Link
            href="/mapa"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Volver al mapa
          </Link>
        </div>
      </section>
    </main>
  );
}
