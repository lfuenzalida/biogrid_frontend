import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";

const replaceMock = vi.fn();
const signOutMock = vi.fn();
const useProfileMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/mapa",
  useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ signOut: signOutMock }) }));
vi.mock("@/contexts/ProfileContext", () => ({ useProfile: () => useProfileMock() }));

describe("Sidebar", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    signOutMock.mockReset();
    useProfileMock.mockReturnValue({ isAdmin: false });
    window.localStorage.clear();
  });

  it("muestra navegación personal y oculta administración a USER", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: "Mi perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Administración" })).not.toBeInTheDocument();
  });

  it("muestra administración a ADMIN", () => {
    useProfileMock.mockReturnValue({ isAdmin: true });
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: "Administración" })).toHaveAttribute(
      "href",
      "/administracion",
    );
  });

  it("cierra sesión y vuelve al login", async () => {
    signOutMock.mockResolvedValue(undefined);
    render(<Sidebar />);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledOnce();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
