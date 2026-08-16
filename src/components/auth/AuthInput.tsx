"use client";

import type { ChangeEvent } from "react";

interface AuthInputProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function AuthInput({
  id,
  label,
  type = "text",
  value,
  placeholder,
  autoComplete,
  onChange,
}: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={onChange}
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
      />
    </div>
  );
}
