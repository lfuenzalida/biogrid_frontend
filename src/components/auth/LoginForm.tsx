"use client";

import type { ChangeEvent, FormEvent } from "react";
import { AuthInput } from "./AuthInput";

export interface LoginData {
  email: string;
  password: string;
}

interface LoginFormProps {
  data: LoginData;
  isSubmitting: boolean;
  onChange: (field: keyof LoginData) => (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginForm({ data, isSubmitting, onChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthInput id="login-email" label="Correo electrónico" type="email" value={data.email} placeholder="tu@correo.com" autoComplete="email" onChange={onChange("email")} />
      <AuthInput id="login-password" label="Contraseña" type="password" value={data.password} placeholder="Ingresa tu contraseña" autoComplete="current-password" onChange={onChange("password")} />
      <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
