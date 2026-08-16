import { LoaderCircle, Sprout } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-slate-50 px-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-900/15">
          <Sprout aria-hidden="true" className="h-8 w-8" />
        </span>
        <LoaderCircle
          aria-hidden="true"
          className="mt-6 h-6 w-6 animate-spin text-emerald-700"
        />
        <p className="mt-3 text-sm font-semibold text-slate-600">
          Verificando tu sesión…
        </p>
      </div>
    </main>
  );
}
