import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

export const MAX_JSON_BODY_BYTES = 1_000_000;

export async function requireUser(request: Request) {
  try {
    return await verifyFirebaseRequest(request);
  } catch (error) {
    const code = error instanceof Error ? error.message : "AUTH_REQUIRED";
    const appCheck = code === "APP_CHECK_REQUIRED";
    throw new RouteSecurityError(
      appCheck ? 403 : 401,
      appCheck ? "La verificación de la aplicación falló." : "La sesión no es válida.",
    );
  }
}

export async function readValidatedJson<T>(request: Request, schema: ZodType<T>) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_JSON_BODY_BYTES) {
    throw new RouteSecurityError(413, "El cuerpo de la solicitud es demasiado grande.");
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_JSON_BODY_BYTES) {
    throw new RouteSecurityError(413, "El cuerpo de la solicitud es demasiado grande.");
  }

  try {
    return schema.parse(JSON.parse(body));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      throw new RouteSecurityError(400, "El cuerpo de la solicitud no es válido.");
    }
    throw error;
  }
}

export class RouteSecurityError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function securityErrorResponse(error: unknown, requestId: string) {
  if (!(error instanceof RouteSecurityError)) return null;
  return NextResponse.json(
    { detail: error.message, requestId },
    { status: error.status, headers: { "x-request-id": requestId } },
  );
}
