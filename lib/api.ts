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

export type AuthConfig = {
  signup_enabled: boolean;
  password_reset_enabled: boolean;
  email_verify_enabled: boolean;
  oidc_enabled: boolean;
};

export async function getAuthConfig(): Promise<AuthConfig> {
  return request<AuthConfig>("/auth/config");
}

/** Absolute URL for starting the OIDC login redirect chain. */
export function oidcLoginUrl(nextPath: string = "/"): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");
  const q = new URLSearchParams({ next: nextPath });
  return `${base}/auth/oidc/login?${q.toString()}`;
}

export async function apiRegister(email: string, password: string, name?: string): Promise<UserMe> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      ...(name ? { name } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let friendly = `HTTP ${res.status}`;
    if (res.status === 404) friendly = "Registration is disabled on this server.";
    else if (res.status === 400) friendly = "That email is already registered.";
    else if (res.status === 422) friendly = "Check the form: email format and password ≥ 8 chars.";
    throw new Error(`${friendly}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
  return (await res.json()) as UserMe;
}

export async function apiForgotPassword(email: string): Promise<void> {
  // Always treat non-5xx as "sent" to avoid leaking account existence.
  const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (res.status >= 500) {
    const body = await res.text().catch(() => "");
    throw new Error(`Server error ${res.status}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
}

export async function apiResetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error("Invalid or expired reset link. Request a new one.");
    }
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
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

// ──────────────────────────────────────────────
// Entity types + CRUD helpers
// ──────────────────────────────────────────────

/** Entity types recognised by the backend (Phase 3). */
export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "DOMAIN"
  | "IP_ADDRESS"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "CRYPTO_ADDRESS";

export type EntityRead = {
  id: string;
  case_id: string;
  type: EntityType;
  label: string;
  confidence: number;
  attrs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EntityCreate = {
  type: EntityType;
  label: string;
  confidence?: number;
  attrs?: Record<string, unknown>;
};

export type EntityUpdate = {
  label?: string;
  confidence?: number;
  attrs?: Record<string, unknown>;
};

/**
 * GET /cases/{caseId}/entities — list entities for a case.
 */
export async function listEntities(
  caseId: string,
  opts: { type?: EntityType; limit?: number; offset?: number } = {},
): Promise<EntityRead[]> {
  const qs = new URLSearchParams();
  if (opts.type) qs.set("type", opts.type);
  if (opts.limit != null) qs.set("limit", String(opts.limit));
  if (opts.offset != null) qs.set("offset", String(opts.offset));
  const query = qs.toString();
  const res = await apiFetch(`/cases/${caseId}/entities${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as EntityRead[];
}

/**
 * POST /cases/{caseId}/entities — create a new entity.
 */
export async function createEntity(caseId: string, data: EntityCreate): Promise<EntityRead> {
  const res = await apiFetch(`/cases/${caseId}/entities`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as EntityRead;
}

/**
 * PATCH /cases/{caseId}/entities/{entityId} — partial update (type immutable).
 * Returns null on 404.
 */
export async function updateEntity(
  caseId: string,
  entityId: string,
  data: EntityUpdate,
): Promise<EntityRead | null> {
  const res = await apiFetch(`/cases/${caseId}/entities/${entityId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as EntityRead;
}

/**
 * DELETE /cases/{caseId}/entities/{entityId} — soft-delete.
 * Returns true on 204, null on 404.
 */
export async function deleteEntity(caseId: string, entityId: string): Promise<true | null> {
  const res = await apiFetch(`/cases/${caseId}/entities/${entityId}`, { method: "DELETE" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

// ──────────────────────────────────────────────
// Plugin types + helpers
// ──────────────────────────────────────────────

/** A registered plugin's metadata. */
export type PluginInfo = {
  name: string;
  version: string;
  entity_types_accepted: string[];
  entity_types_produced: string[];
  requires_credentials: boolean;
};

/** Status values for a plugin run. */
export type PluginRunStatus = "running" | "succeeded" | "failed";

/** A single plugin run audit record. */
export type PluginRunRead = {
  id: string;
  case_id: string;
  input_entity_id: string | null;
  plugin_name: string;
  plugin_version: string;
  started_at: string;
  finished_at: string | null;
  status: PluginRunStatus;
  /** Taxonomy-safe label e.g. "upstream_http_error:HTTPStatusError" */
  error_message: string | null;
  entities_created_count: number;
  relationships_created_count: number;
  evidence_count: number;
  created_by: string | null;
};

/** Paginated list response from GET /cases/{id}/plugins/runs. */
export type PluginRunList = {
  items: PluginRunRead[];
  total: number;
  limit: number;
  offset: number;
};

/** Full response body from POST /cases/{id}/plugins/{name}/run (201). */
export type PluginRunResponse = {
  run: PluginRunRead;
  entities: EntityRead[];
  relationships: RelationshipRead[];
  evidence: Evidence[];
};

/**
 * GET /plugins — list all registered plugins.
 */
export async function listPlugins(): Promise<PluginInfo[]> {
  const res = await apiFetch("/plugins");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as PluginInfo[];
}

/**
 * POST /cases/{caseId}/plugins/{name}/run
 * Returns 201 PluginRunResponse on success.
 * Throws descriptive error on 404 / 422 / 500.
 */
export async function runPlugin(
  caseId: string,
  pluginName: string,
  inputEntityId: string,
): Promise<PluginRunResponse> {
  const res = await apiFetch(`/cases/${caseId}/plugins/${pluginName}/run`, {
    method: "POST",
    body: JSON.stringify({ input_entity_id: inputEntityId }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail: string;
    try {
      const parsed = JSON.parse(body) as { detail?: string; error_message?: string };
      detail = parsed.detail ?? parsed.error_message ?? body.slice(0, 200);
    } catch {
      detail = body.slice(0, 200);
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return (await res.json()) as PluginRunResponse;
}

/**
 * GET /cases/{caseId}/plugins/runs — paginated run history.
 */
export async function listPluginRuns(
  caseId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<PluginRunList> {
  const qs = new URLSearchParams();
  if (opts.limit != null) qs.set("limit", String(opts.limit));
  if (opts.offset != null) qs.set("offset", String(opts.offset));
  const query = qs.toString();
  const res = await apiFetch(`/cases/${caseId}/plugins/runs${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as PluginRunList;
}

/**
 * GET /cases/{caseId}/plugins/runs/{runId} — single run record.
 * Returns null on 404.
 */
export async function getPluginRun(caseId: string, runId: string): Promise<PluginRunRead | null> {
  const res = await apiFetch(`/cases/${caseId}/plugins/runs/${runId}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as PluginRunRead;
}

// ──────────────────────────────────────────────
// Relationship types + CRUD helpers
// ──────────────────────────────────────────────

/** Relationship types recognised by the backend (Phase 3). */
export type RelationshipType =
  | "OWNS"
  | "EMPLOYED_BY"
  | "REGISTERED_BY"
  | "HOSTED_ON"
  | "RESOLVES_TO"
  | "ASSOCIATED_WITH"
  | "COMMUNICATED_WITH"
  | "MENTIONS";

export type RelationshipRead = {
  id: string;
  case_id: string;
  src_entity_id: string;
  dst_entity_id: string;
  rel_type: RelationshipType;
  confidence: number;
  source_plugin: string | null;
  attrs: Record<string, unknown>;
  created_at: string;
};

export type RelationshipCreate = {
  src_entity_id: string;
  dst_entity_id: string;
  rel_type: RelationshipType;
  confidence?: number;
  source_plugin?: string;
  attrs?: Record<string, unknown>;
};

/**
 * GET /cases/{caseId}/relationships — list relationships for a case.
 */
export async function listRelationships(
  caseId: string,
  opts: {
    rel_type?: RelationshipType;
    src?: string;
    dst?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<RelationshipRead[]> {
  const qs = new URLSearchParams();
  if (opts.rel_type) qs.set("rel_type", opts.rel_type);
  if (opts.src) qs.set("src", opts.src);
  if (opts.dst) qs.set("dst", opts.dst);
  if (opts.limit != null) qs.set("limit", String(opts.limit));
  if (opts.offset != null) qs.set("offset", String(opts.offset));
  const query = qs.toString();
  const res = await apiFetch(`/cases/${caseId}/relationships${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as RelationshipRead[];
}

/**
 * POST /cases/{caseId}/relationships — create a relationship.
 * Relationships are immutable after creation (no PATCH endpoint).
 */
export async function createRelationship(
  caseId: string,
  data: RelationshipCreate,
): Promise<RelationshipRead> {
  const res = await apiFetch(`/cases/${caseId}/relationships`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as RelationshipRead;
}

/**
 * DELETE /cases/{caseId}/relationships/{relId} — delete a relationship.
 * Returns true on 204, null on 404.
 */
export async function deleteRelationship(caseId: string, relId: string): Promise<true | null> {
  const res = await apiFetch(`/cases/${caseId}/relationships/${relId}`, { method: "DELETE" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

// ──────────────────────────────────────────────
// Graph types + helpers
// ──────────────────────────────────────────────

export type GraphVertex = {
  id: string;
  type: EntityType;
  label: string;
  confidence: number;
  attrs: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  rel_type: RelationshipType;
  confidence: number;
  source_plugin: string | null;
  attrs: Record<string, unknown>;
};

export type GraphDump = {
  vertices: GraphVertex[];
  edges: GraphEdge[];
};

/**
 * GET /cases/{caseId}/graph — fetch flat graph dump for a case.
 */
export async function getGraph(caseId: string): Promise<GraphDump> {
  return request<GraphDump>(`/cases/${caseId}/graph`);
}
