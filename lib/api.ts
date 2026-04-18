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
