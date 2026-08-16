import type { ReactNode } from "react";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <PublicOnlyRoute>{children}</PublicOnlyRoute>;
}
