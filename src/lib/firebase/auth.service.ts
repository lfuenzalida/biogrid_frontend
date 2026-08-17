import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { getToken } from "firebase/app-check";
import { getFirebaseAppCheck } from "./config";

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function getFirebaseIdToken(forceRefresh = false) {
  await auth.authStateReady();

  if (!auth.currentUser) {
    throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  }

  return auth.currentUser.getIdToken(forceRefresh);
}

export async function getFirebaseAppCheckToken() {
  const appCheck = getFirebaseAppCheck();
  if (!appCheck) return null;
  return (await getToken(appCheck)).token;
}

export function logout() {
  return signOut(auth);
}

export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  try {
    await updateProfile(credential.user, { displayName: fullName.trim() });

    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      fullName: fullName.trim(),
      email: credential.user.email,
      role: "USER",
      organizationId: null,
      organizationName: null,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return credential.user;
  } catch (error) {
    // Evita dejar una cuenta de Auth huérfana si no se pudo crear el perfil.
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  } finally {
    // Firebase inicia sesión al registrar. En el flujo actual volvemos al login.
    if (auth.currentUser) await signOut(auth);
  }
}
