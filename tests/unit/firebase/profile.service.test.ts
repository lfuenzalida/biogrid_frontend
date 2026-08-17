import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocMock, updateDocMock, updateFirebaseProfileMock } = vi.hoisted(
  () => ({
    getDocMock: vi.fn(),
    updateDocMock: vi.fn(),
    updateFirebaseProfileMock: vi.fn(),
  }),
);

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ path: "users/test-uid" })),
  getDoc: getDocMock,
  updateDoc: updateDocMock,
  serverTimestamp: vi.fn(() => "server-timestamp"),
  Timestamp: class Timestamp {},
}));

vi.mock("firebase/auth", () => ({
  updateProfile: updateFirebaseProfileMock,
}));

vi.mock("@/lib/firebase/config", () => ({ db: {} }));

import { getUserProfile, updateUserProfile } from "@/lib/firebase/profile.service";
import type { User } from "firebase/auth";

const user = {
  uid: "test-uid",
  email: "test@example.com",
  displayName: "Firebase Name",
} as User;

describe("profile.service", () => {
  beforeEach(() => {
    getDocMock.mockReset();
    updateDocMock.mockReset();
    updateFirebaseProfileMock.mockReset();
  });

  it("aplica defaults seguros a perfiles históricos", async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: "test-uid", fullName: "Test User", email: "test@example.com" }),
    });

    await expect(getUserProfile(user)).resolves.toMatchObject({
      uid: "test-uid",
      fullName: "Test User",
      role: "USER",
      status: "ACTIVE",
      organizationId: null,
    });
  });

  it("sincroniza el nombre en Auth y Firestore", async () => {
    updateFirebaseProfileMock.mockResolvedValue(undefined);
    updateDocMock.mockResolvedValue(undefined);

    await updateUserProfile(user, { fullName: "  Nombre Actualizado  " });

    expect(updateFirebaseProfileMock).toHaveBeenCalledWith(user, {
      displayName: "Nombre Actualizado",
    });
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fullName: "Nombre Actualizado" }),
    );
  });

  it("revierte Auth cuando Firestore rechaza la actualización", async () => {
    updateFirebaseProfileMock.mockResolvedValue(undefined);
    updateDocMock.mockRejectedValue(new Error("Firestore unavailable"));

    await expect(
      updateUserProfile(user, { fullName: "Nombre Temporal" }),
    ).rejects.toThrow("Firestore unavailable");

    expect(updateFirebaseProfileMock).toHaveBeenLastCalledWith(user, {
      displayName: "Firebase Name",
    });
  });
});
