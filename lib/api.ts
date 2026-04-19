/**
 * API client for sleuthgraph-api.
 *
 * MVP is pragmatic: hand-rolled fetch wrapper. Phase 8 will switch to
 * openapi-typescript-generated types for type safety.
 */

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  return url && url.length > 0 ? url : "http://localhost:8000";
}

export const API_URL = getApiBaseUrl();

type HealthResponse = { status: string; service: string };

type ReadinessResponse = {
  status: "ready" | "degraded";
  checks: Record<string, string>;
};

export type UserMe = {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  name: string | null;
};

export type OidcStatus = {
  enabled: boolean;
  issuer?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export const apiClient = {
  health: () => request<HealthResponse>("/health"),
  readiness: () => request<ReadinessResponse>("/readiness"),
};

/**
 * General-purpose authenticated fetch with cookie credentials included.
 * Returns the raw Response so callers can check status codes.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Login uses form-encoded body per FastAPI-Users default transport.
 */
export async function apiLogin(email: string, password: string): Promise<Response> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  return fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

// ──────────────────────────────────────────────
// Case types + CRUD helpers
// ──────────────────────────────────────────────

export type CaseStatus = "active" | "archived";

export type Case = {
  id: string;
  owner_id: string;
  name: string;
  status: CaseStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CaseCreate = {
  name: string;
  tags?: string[];
};

export type CaseUpdate = {
  name?: string;
  status?: CaseStatus;
  tags?: string[];
};

export type ListCasesParams = {
  status?: CaseStatus;
  limit?: number;
  offset?: number;
};

/**
 * GET /cases — list cases (owned by current user).
 * Throws on non-2xx.
 */
export async function listCases(params?: ListCasesParams): Promise<Case[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  const res = await apiFetch(`/cases${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as Case[];
}

/**
 * POST /cases — create a new case.
 * Returns the created CaseRead.
 */
export async function createCase(data: CaseCreate): Promise<Case> {
  const res = await apiFetch("/cases", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as Case;
}

/**
 * GET /cases/{id} — fetch a single case.
 * Returns null on 404.
 */
export async function getCase(id: string): Promise<Case | null> {
  const res = await apiFetch(`/cases/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as Case;
}

/**
 * PATCH /cases/{id} — partial update.
 * Returns null on 404.
 */
export async function updateCase(id: string, data: CaseUpdate): Promise<Case | null> {
  const res = await apiFetch(`/cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as Case;
}

/**
 * DELETE /cases/{id} — delete a case.
 * Returns true on 204, null on 404.
 */
export async function deleteCase(id: string): Promise<true | null> {
  const res = await apiFetch(`/cases/${id}`, { method: "DELETE" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

// ──────────────────────────────────────────────
// Evidence types + CRUD helpers
// ──────────────────────────────────────────────

export type Evidence = {
  id: string;
  case_id: string;
  entity_id: string | null;
  source_plugin: string;
  query: string;
  response_hash: string;
  response_uri: string;
  response_bytes: number;
  response_content_type: string | null;
  timestamp: string;
  reproducibility_spec: Record<string, unknown>;
  created_by: string | null;
  blob_url: string | null;
};

export type EvidenceList = {
  items: Evidence[];
  total: number;
  limit: number;
  offset: number;
};

export type EvidenceUploadMetadata = {
  query: string;
  source_plugin?: string;
  entity_id?: string;
  reproducibility_spec?: Record<string, unknown>;
};

/**
 * GET /cases/{id}/evidence — list evidence items for a case.
 */
export async function listEvidence(
  caseId: string,
  opts: {
    limit?: number;
    offset?: number;
    entity_id?: string;
    source_plugin?: string;
  } = {},
): Promise<EvidenceList> {
  const qs = new URLSearchParams();
  if (opts.limit != null) qs.set("limit", String(opts.limit));
  if (opts.offset != null) qs.set("offset", String(opts.offset));
  if (opts.entity_id) qs.set("entity_id", opts.entity_id);
  if (opts.source_plugin) qs.set("source_plugin", opts.source_plugin);
  const query = qs.toString();
  const res = await apiFetch(`/cases/${caseId}/evidence${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as EvidenceList;
}

/**
 * POST /cases/{id}/evidence — upload an evidence file (multipart).
 * Throws with a user-friendly message on 413 (file exceeds 50 MiB limit).
 */
export async function uploadEvidence(
  caseId: string,
  file: File,
  metadata: EvidenceUploadMetadata,
): Promise<Evidence> {
  const body = new FormData();
  body.append("file", file);
  body.append("metadata", JSON.stringify(metadata));
  // Do not pass Content-Type header — browser sets multipart boundary automatically.
  const res = await fetch(`${getApiBaseUrl()}/cases/${caseId}/evidence`, {
    method: "POST",
    credentials: "include",
    body,
  });
  if (res.status === 413) {
    throw new Error("File exceeds the 50 MiB upload limit. Choose a smaller file.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as Evidence;
}

/**
 * Returns the URL that triggers a 307 redirect to the presigned MinIO blob.
 * Open in a new tab — browser follows the redirect.
 */
export function evidenceBlobUrl(caseId: string, evId: string): string {
  return `${getApiBaseUrl()}/cases/${caseId}/evidence/${evId}/blob`;
}

/**
 * Returns the export URL for the evidence ledger.
 */
export function evidenceExportUrl(caseId: string, format: "json" | "csv" = "csv"): string {
  return `${getApiBaseUrl()}/cases/${caseId}/evidence/export?format=${format}`;
}

/**
 * Authenticated CSV export: fetch with cookie credentials → blob → anchor download.
 * Bare anchor href cannot send cookies, so this must go through fetch.
 */
export async function downloadEvidenceCsv(caseId: string): Promise<void> {
  const res = await fetch(evidenceExportUrl(caseId, "csv"), { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Export failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `case-${caseId}-evidence.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
