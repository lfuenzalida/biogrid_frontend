"use client";

import type { ChangeEvent, FormEvent } from "react";
import { AuthInput } from "./AuthInput";

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  data: RegisterData;
  isSubmitting: boolean;
  onChange: (field: keyof RegisterData) => (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function RegisterForm({ data, isSubmitting, onChange, onSubmit }: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthInput id="register-name" label="Nombre completo" value={data.fullName} placeholder="Ej. Valentina Silva" autoComplete="name" onChange={onChange("fullName")} />
      <AuthInput id="register-email" label="Correo electrónico" type="email" value={data.email} placeholder="tu@correo.com" autoComplete="email" onChange={onChange("email")} />
      <AuthInput id="register-password" label="Contraseña" type="password" value={data.password} placeholder="Crea una contraseña segura" autoComplete="new-password" onChange={onChange("password")} />
      <AuthInput id="register-confirm-password" label="Confirmar contraseña" type="password" value={data.confirmPassword} placeholder="Repite tu contraseña" autoComplete="new-password" onChange={onChange("confirmPassword")} />
      <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
