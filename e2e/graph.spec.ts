import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Fixture data — realistic entities and relationships for a small case
// ---------------------------------------------------------------------------

const CASE_ID = "c0000000-0000-0000-0000-000000000001";

/**
 * API base URL used by the frontend (lib/api.ts getApiBaseUrl()).
 * Routes are scoped to this origin so that page.route() does NOT
 * intercept Next.js page navigations on localhost:3000.
 */
const API_ORIGIN = "http://localhost:8000";

const ENTITIES = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    case_id: CASE_ID,
    type: "PERSON",
    label: "Alice Johnson",
    confidence: 0.95,
    attrs: { role: "CEO" },
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    case_id: CASE_ID,
    type: "ORGANIZATION",
    label: "Acme Corp",
    confidence: 0.9,
    attrs: { industry: "tech" },
    created_at: "2026-05-01T10:01:00Z",
    updated_at: "2026-05-01T10:01:00Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    case_id: CASE_ID,
    type: "DOMAIN",
    label: "acme-corp.com",
    confidence: 1.0,
    attrs: { registrar: "Cloudflare" },
    created_at: "2026-05-01T10:02:00Z",
    updated_at: "2026-05-01T10:02:00Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    case_id: CASE_ID,
    type: "EMAIL",
    label: "alice@acme-corp.com",
    confidence: 0.85,
    attrs: {},
    created_at: "2026-05-01T10:03:00Z",
    updated_at: "2026-05-01T10:03:00Z",
  },
];

const RELATIONSHIPS = [
  {
    id: "r0000000-0000-0000-0000-000000000001",
    case_id: CASE_ID,
    src_entity_id: "e0000000-0000-0000-0000-000000000001",
    dst_entity_id: "e0000000-0000-0000-0000-000000000002",
    rel_type: "EMPLOYED_BY",
    confidence: 0.9,
    source_plugin: null,
    attrs: {},
    created_at: "2026-05-01T10:10:00Z",
  },
  {
    id: "r0000000-0000-0000-0000-000000000002",
    case_id: CASE_ID,
    src_entity_id: "e0000000-0000-0000-0000-000000000002",
    dst_entity_id: "e0000000-0000-0000-0000-000000000003",
    rel_type: "OWNS",
    confidence: 1.0,
    source_plugin: null,
    attrs: {},
    created_at: "2026-05-01T10:11:00Z",
  },
  {
    id: "r0000000-0000-0000-0000-000000000003",
    case_id: CASE_ID,
    src_entity_id: "e0000000-0000-0000-0000-000000000004",
    dst_entity_id: "e0000000-0000-0000-0000-000000000003",
    rel_type: "ASSOCIATED_WITH",
    confidence: 0.85,
    source_plugin: "dns_whois",
    attrs: {},
    created_at: "2026-05-01T10:12:00Z",
  },
];

/** Graph dump returned by GET /cases/{caseId}/graph */
const GRAPH_DUMP = {
  vertices: ENTITIES.map((e) => ({
    id: e.id,
    type: e.type,
    label: e.label,
    confidence: e.confidence,
    attrs: e.attrs,
  })),
  edges: RELATIONSHIPS.map((r) => ({
    id: r.id,
    source: r.src_entity_id,
    target: r.dst_entity_id,
    rel_type: r.rel_type,
    confidence: r.confidence,
    source_plugin: r.source_plugin,
    attrs: r.attrs,
  })),
};

/** Authenticated user fixture for GET /users/me */
const USER_ME = {
  id: "u0000000-0000-0000-0000-000000000001",
  email: "test@example.com",
  is_active: true,
  is_superuser: false,
  is_verified: true,
  name: "Test User",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intercept all API calls the graph page makes and return fixture data.
 *
 * Routes are scoped to API_ORIGIN (localhost:8000) so they do NOT intercept
 * the Next.js page HTML served from localhost:3000.
 *
 * The page hits three endpoints on mount (via Promise.allSettled):
 *   1. GET /cases/{caseId}/graph
 *   2. GET /cases/{caseId}/entities?limit=200&offset=0
 *   3. GET /cases/{caseId}/relationships?limit=200&offset=0
 *
 * The AuthContext also calls GET /users/me on mount to check login state.
 * Without mocking it the 401 interceptor redirects to /login.
 */
async function mockGraphApi(page: Page): Promise<void> {
  // Auth -- return a valid user so the app does not redirect to /login.
  await page.route(`${API_ORIGIN}/users/me`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(USER_ME) }),
  );

  // Graph dump
  await page.route(`${API_ORIGIN}/cases/${CASE_ID}/graph`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(GRAPH_DUMP),
    }),
  );

  // Entities list (paginated -- return all in first page)
  await page.route(`${API_ORIGIN}/cases/${CASE_ID}/entities**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ENTITIES),
    }),
  );

  // Relationships list (paginated -- return all in first page)
  await page.route(`${API_ORIGIN}/cases/${CASE_ID}/relationships**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(RELATIONSHIPS),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Graph visualization page", () => {
  test.beforeEach(async ({ page }) => {
    await mockGraphApi(page);
  });

  test("navigating to graph page renders the graph container", async ({ page }) => {
    await page.goto(`/cases/${CASE_ID}/graph`);

    // The graph canvas is wrapped in a role="img" element with an aria-label
    // describing the entity/relationship counts.
    const graphContainer = page.getByRole("img", {
      name: /investigation graph/i,
    });
    await expect(graphContainer).toBeVisible();

    // The page title should be visible.
    await expect(page.getByRole("heading", { name: /case graph/i })).toBeVisible();

    // "Back to case" link should be present.
    await expect(page.getByRole("button", { name: /back to case/i })).toBeVisible();
  });

  test("graph toolbar shows entity and relationship counts", async ({ page }) => {
    await page.goto(`/cases/${CASE_ID}/graph`);

    // GraphToolbar renders a text like "4 entities, 3 relationships"
    await expect(
      page.getByText(`${ENTITIES.length} entities, ${RELATIONSHIPS.length} relationships`),
    ).toBeVisible();
  });

  test("clicking an entity node opens the detail drawer", async ({ page }) => {
    await page.goto(`/cases/${CASE_ID}/graph`);

    // Wait for the graph container to be visible (data loaded).
    await expect(page.getByRole("img", { name: /investigation graph/i })).toBeVisible();

    // Cytoscape renders to <canvas> so we cannot click a DOM node directly.
    // GraphCanvas exposes the Cytoscape core on window.__cyInstance in
    // non-production builds (see the useEffect hook in GraphCanvas.tsx).
    // We use page.evaluate() to emit a "tap" event on the target node,
    // which triggers onNodeClick -> sets selectedEntity -> opens the drawer.
    const targetEntityId = ENTITIES[0].id;

    await page.evaluate((nodeId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cy = (window as any).__cyInstance;
      if (!cy || typeof cy.$ !== "function") {
        throw new Error(
          "window.__cyInstance not found. " +
            "GraphCanvas exposes it in non-production builds (NODE_ENV !== 'production').",
        );
      }
      cy.$(`#${nodeId}`).emit("tap");
    }, targetEntityId);

    // The EntityDetailDrawer uses title="Entity Detail" on the Mantine Drawer.
    const drawer = page.getByRole("dialog", { name: /entity detail/i });
    await expect(drawer).toBeVisible();

    // The drawer should display the clicked entity's label.
    await expect(drawer.getByText(ENTITIES[0].label)).toBeVisible();
  });
});
