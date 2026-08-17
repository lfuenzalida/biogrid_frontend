"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/observability";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
          <section className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">BioGrid encontró un error</h1>
            <p className="mt-3 text-sm text-slate-600">
              La aplicación no pudo continuar de forma segura. Puedes intentar cargarla nuevamente.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
            >
              Reintentar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
