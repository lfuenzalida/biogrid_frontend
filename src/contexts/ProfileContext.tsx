"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
} from "@/lib/firebase/profile.service";
import type { UserProfile, UserProfileUpdate } from "@/types/profile";

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (values: UserProfileUpdate) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      setProfile(await getUserProfile(user));
    } catch (profileError) {
      setProfile(null);
      setError(
        profileError instanceof Error
          ? profileError.message
          : "No fue posible cargar tu perfil.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshProfile();
  }, [authLoading, refreshProfile]);

  const saveProfile = useCallback(
    async (values: UserProfileUpdate) => {
      if (!user) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      await updateUserProfile(user, values);
      await refreshProfile();
    },
    [refreshProfile, user],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading: authLoading || loading,
      error,
      isAdmin: profile?.role === "ADMIN" && profile.status === "ACTIVE",
      refreshProfile,
      saveProfile,
    }),
    [authLoading, error, loading, profile, refreshProfile, saveProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile debe utilizarse dentro de ProfileProvider.");
  }

  return context;
}
