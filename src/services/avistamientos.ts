import type {
  AreaConsulta,
  AvistamientoFeature,
  AvistamientosFeatureCollection,
  FiltrosAvistamientos,
} from "@/types/avistamientos";
import { getFirebaseAppCheckToken, getFirebaseIdToken } from "@/lib/firebase/auth.service";
import { fetchWithPolicy } from "@/lib/http/fetch-with-policy";
import {
  avistamientosResponseSchema,
  parseApiResponse,
} from "@/lib/validation/schemas";

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;

function createSearchParams(
  filters: FiltrosAvistamientos,
  cursor?: string | null,
) {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });

  filters.gruposBiologicos?.forEach((group) => {
    params.append("grupo_biologico", group);
  });
  if (filters.origen) params.set("origen", filters.origen);
  if (filters.protegido !== undefined) {
    params.set("protegido", String(filters.protegido));
  }
  if (filters.especie) params.set("especie", filters.especie);
  if (filters.fechaDesde) params.set("fecha_desde", filters.fechaDesde);
  if (filters.fechaHasta) params.set("fecha_hasta", filters.fechaHasta);
  if (cursor) params.set("cursor", cursor);

  return params;
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as {
      detail?: unknown;
    };
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map((item) => {
          if (typeof item !== "object" || item === null) return null;
          const message = (item as { msg?: unknown }).msg;
          return typeof message === "string" ? message : null;
        })
        .filter(Boolean);

      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // La API puede responder texto plano en errores no controlados.
  }

  return `No fue posible consultar los avistamientos (${response.status}).`;
}

export async function buscarAvistamientosPorPoligono(
  area: AreaConsulta,
  filters: FiltrosAvistamientos = {},
  signal?: AbortSignal,
): Promise<AvistamientosFeatureCollection> {
  // Mapbox Draw agrega un `id` en el Feature. La API usa un modelo estricto,
  // por lo que enviamos exclusivamente las propiedades del contrato GeoJSON.
  const requestArea: AreaConsulta = {
    type: "Feature",
    properties: area.properties ?? {},
    geometry: {
      type: "Polygon",
      coordinates: area.geometry.coordinates,
    },
  };
  const features: AvistamientoFeature[] = [];
  let cursor: string | null = null;
  let total = 0;
  let lastLimit = PAGE_SIZE;
  let hasMore = false;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = createSearchParams(filters, cursor);
    const [idToken, appCheckToken] = await Promise.all([
      getFirebaseIdToken(),
      getFirebaseAppCheckToken(),
    ]);
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    });
    if (appCheckToken) headers.set("X-Firebase-AppCheck", appCheckToken);

    const response = await fetchWithPolicy(`/api/avistamientos?${params.toString()}`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestArea),
      cache: "no-store",
      signal,
    }, { timeoutMs: 10_000, retries: 1 });

    if (!response.ok) throw new Error(await readError(response));

    const pageData = parseApiResponse(
      avistamientosResponseSchema,
      await response.json(),
    ) as AvistamientosFeatureCollection;

    features.push(...pageData.features);
    total = pageData.meta.total;
    lastLimit = pageData.meta.limit;
    hasMore = pageData.meta.has_more;
    cursor = pageData.meta.next_cursor;

    if (!hasMore || !cursor) break;
  }

  return {
    type: "FeatureCollection",
    features,
    meta: {
      total,
      limit: lastLimit,
      has_more: hasMore && features.length < total,
      next_cursor: hasMore && features.length < total ? cursor : null,
    },
  };
}
