import { getApps, initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  return (
    getApps()[0] ??
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  );
}

export async function verifyFirebaseRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("AUTH_REQUIRED");
  }

  const decodedToken = await getAuth(getAdminApp()).verifyIdToken(authorization.slice(7));

  if (process.env.FIREBASE_APP_CHECK_REQUIRED === "true") {
    const appCheckToken = request.headers.get("x-firebase-appcheck");
    if (!appCheckToken) throw new Error("APP_CHECK_REQUIRED");
    await getAppCheck(getAdminApp()).verifyToken(appCheckToken);
  }

  return decodedToken;
}
