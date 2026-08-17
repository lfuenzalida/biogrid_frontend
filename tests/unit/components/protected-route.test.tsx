import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const replaceMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuthMock() }));

describe("ProtectedRoute", () => {
  beforeEach(() => replaceMock.mockReset());

  it("muestra carga mientras Firebase resuelve la sesión", () => {
    useAuthMock.mockReturnValue({ loading: true, isAuthenticated: false });
    render(<ProtectedRoute>Privado</ProtectedRoute>);
    expect(screen.getByText("Verificando tu sesión…")).toBeInTheDocument();
    expect(screen.queryByText("Privado")).not.toBeInTheDocument();
  });

  it("redirige anónimos sin renderizar contenido privado", async () => {
    useAuthMock.mockReturnValue({ loading: false, isAuthenticated: false });
    render(<ProtectedRoute>Privado</ProtectedRoute>);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Privado")).not.toBeInTheDocument();
  });

  it("renderiza el contenido para una sesión autenticada", () => {
    useAuthMock.mockReturnValue({ loading: false, isAuthenticated: true });
    render(<ProtectedRoute>Privado</ProtectedRoute>);
    expect(screen.getByText("Privado")).toBeInTheDocument();
  });
});
