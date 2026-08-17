import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContainer } from "@/components/auth/AuthContainer";

const { replaceMock, loginMock, registerMock, setIsRegisteringMock } = vi.hoisted(
  () => ({
    replaceMock: vi.fn(),
    loginMock: vi.fn(),
    registerMock: vi.fn(),
    setIsRegisteringMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock }) }));
vi.mock("@/lib/firebase/auth.service", () => ({
  loginWithEmail: loginMock,
  registerWithEmail: registerMock,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ setIsRegistering: setIsRegisteringMock }),
}));

describe("AuthContainer", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    loginMock.mockReset();
    registerMock.mockReset();
    setIsRegisteringMock.mockReset();
  });

  it("envía credenciales a Firebase y navega al mapa", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ user: { uid: "uid" } });
    render(<AuthContainer />);

    await user.type(screen.getByLabelText("Correo electrónico"), "test@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Password.123");
    const loginButtons = screen.getAllByRole("button", { name: "Iniciar sesión" });
    await user.click(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("test@example.com", "Password.123");
      expect(replaceMock).toHaveBeenCalledWith("/mapa");
    });
  });
});
