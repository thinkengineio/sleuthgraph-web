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
