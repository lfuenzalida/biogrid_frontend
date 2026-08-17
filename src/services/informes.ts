import {
  getFirebaseAppCheckToken,
  getFirebaseIdToken,
} from "@/lib/firebase/auth.service";
import { fetchWithPolicy } from "@/lib/http/fetch-with-policy";
import {
  informeDetailSchema,
  informeListResponseSchema,
  parseApiResponse,
} from "@/lib/validation/schemas";
import type {
  InformeCreate,
  InformeDetail,
  InformeEstado,
  InformeListResponse,
  InformeUpdate,
} from "@/types/informes";

interface ListInformeFilters {
  limit?: number;
  cursor?: string | null;
  estado?: InformeEstado | "";
  buscar?: string;
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map((item) => {
          if (typeof item !== "object" || item === null) return null;
          const message = (item as { msg?: unknown }).msg;
          return typeof message === "string" ? message : null;
        })
        .filter((message): message is string => message !== null);

      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // Conserva un mensaje estable si la API no responde JSON.
  }

  return `No fue posible completar la solicitud (${response.status}).`;
}

async function authenticatedFetch(
  input: string,
  init: RequestInit = {},
) {
  const [token, appCheckToken] = await Promise.all([
    getFirebaseIdToken(),
    getFirebaseAppCheckToken(),
  ]);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (appCheckToken) headers.set("X-Firebase-AppCheck", appCheckToken);
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetchWithPolicy(input, {
    ...init,
    headers,
    cache: "no-store",
  }, { timeoutMs: 10_000, retries: init.method === undefined ? 1 : 0 });

  if (response.status !== 401) return response;

  const refreshedToken = await getFirebaseIdToken(true);
  headers.set("Authorization", `Bearer ${refreshedToken}`);
  const retry = await fetchWithPolicy(input, { ...init, headers, cache: "no-store" }, {
    timeoutMs: 10_000,
  });

  if (retry.status === 401) {
    window.dispatchEvent(new Event("biogrid:session-expired"));
  }
  return retry;
}

export async function listarInformes(
  filters: ListInformeFilters = {},
  signal?: AbortSignal,
): Promise<InformeListResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 20));
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.estado) params.set("estado", filters.estado);
  if (filters.buscar?.trim()) params.set("buscar", filters.buscar.trim());

  const response = await authenticatedFetch(`/api/informes?${params}`, { signal });
  if (!response.ok) throw new Error(await readError(response));
  return parseApiResponse(
    informeListResponseSchema,
    await response.json(),
  ) as InformeListResponse;
}

export async function obtenerInforme(
  informeId: string,
  signal?: AbortSignal,
): Promise<InformeDetail> {
  const response = await authenticatedFetch(
    `/api/informes/${encodeURIComponent(informeId)}?especies_limit=500`,
    { signal },
  );
  if (!response.ok) throw new Error(await readError(response));
  return parseApiResponse(informeDetailSchema, await response.json()) as InformeDetail;
}

export async function crearInforme(payload: InformeCreate) {
  const response = await authenticatedFetch("/api/informes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
  return parseApiResponse(informeDetailSchema, await response.json()) as InformeDetail;
}

export async function actualizarInforme(
  informeId: string,
  payload: InformeUpdate,
) {
  const response = await authenticatedFetch(
    `/api/informes/${encodeURIComponent(informeId)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  if (!response.ok) throw new Error(await readError(response));
  return parseApiResponse(informeDetailSchema, await response.json()) as InformeDetail;
}

export async function eliminarInforme(informeId: string) {
  const response = await authenticatedFetch(
    `/api/informes/${encodeURIComponent(informeId)}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error(await readError(response));
}
