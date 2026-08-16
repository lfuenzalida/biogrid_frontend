"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const router = useRouter();
  const { loading, isAuthenticated, isRegistering } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && !isRegistering) router.replace("/mapa");
  }, [isAuthenticated, isRegistering, loading, router]);

  if (loading || (isAuthenticated && !isRegistering)) {
    return <AuthLoadingScreen />;
  }

  return children;
}
