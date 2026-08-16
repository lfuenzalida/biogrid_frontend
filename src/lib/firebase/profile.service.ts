import { updateProfile as updateFirebaseProfile, type User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";
import type {
  UserProfile,
  UserProfileUpdate,
  UserRole,
  UserStatus,
} from "@/types/profile";

function toDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : null;
}

function isRole(value: unknown): value is UserRole {
  return value === "USER" || value === "ADMIN";
}

function isStatus(value: unknown): value is UserStatus {
  return value === "ACTIVE" || value === "SUSPENDED";
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  const snapshot = await getDoc(doc(db, "users", user.uid));

  if (!snapshot.exists()) {
    throw new Error("No encontramos un perfil asociado a esta cuenta.");
  }

  const data = snapshot.data();

  return {
    uid: user.uid,
    fullName:
      typeof data.fullName === "string" && data.fullName.trim()
        ? data.fullName
        : user.displayName ?? "Usuario BioGrid",
    email:
      typeof data.email === "string" && data.email.trim()
        ? data.email
        : user.email ?? "",
    role: isRole(data.role) ? data.role : "USER",
    organizationId:
      typeof data.organizationId === "string" ? data.organizationId : null,
    organizationName:
      typeof data.organizationName === "string" ? data.organizationName : null,
    status: isStatus(data.status) ? data.status : "ACTIVE",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function updateUserProfile(
  user: User,
  values: UserProfileUpdate,
) {
  const fullName = values.fullName.trim();

  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error("El nombre debe tener entre 2 y 120 caracteres.");
  }

  const previousDisplayName = user.displayName;
  await updateFirebaseProfile(user, { displayName: fullName });

  try {
    await updateDoc(doc(db, "users", user.uid), {
      fullName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    await updateFirebaseProfile(user, { displayName: previousDisplayName }).catch(
      () => undefined,
    );
    throw error;
  }
}
