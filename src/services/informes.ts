import { getFirebaseIdToken } from "@/lib/firebase/auth.service";
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
  const token = await getFirebaseIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  return fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });
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
  return response.json() as Promise<InformeListResponse>;
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
  return response.json() as Promise<InformeDetail>;
}

export async function crearInforme(payload: InformeCreate) {
  const response = await authenticatedFetch("/api/informes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<InformeDetail>;
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
  return response.json() as Promise<InformeDetail>;
}

export async function eliminarInforme(informeId: string) {
  const response = await authenticatedFetch(
    `/api/informes/${encodeURIComponent(informeId)}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error(await readError(response));
}
