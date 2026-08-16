"use client";

interface AuthSwitchProps {
  isLogin: boolean;
  onChange: (isLogin: boolean) => void;
}

export function AuthSwitch({ isLogin, onChange }: AuthSwitchProps) {
  return (
    <div
      className="relative grid grid-cols-2 rounded-full bg-black/10 p-1"
      role="group"
      aria-label="Seleccionar tipo de acceso"
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-all duration-300 ${
          isLogin ? "left-1" : "left-1/2"
        }`}
      />
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={isLogin}
        className={`relative z-10 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors duration-300 ${
          isLogin ? "text-emerald-900" : "text-white/80"
        }`}
      >
        Iniciar sesión
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!isLogin}
        className={`relative z-10 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors duration-300 ${
          !isLogin ? "text-emerald-900" : "text-emerald-950/60"
        }`}
      >
        Crear cuenta
      </button>
    </div>
  );
}
