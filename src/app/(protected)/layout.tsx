import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-20 sm:px-6 md:h-screen md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
