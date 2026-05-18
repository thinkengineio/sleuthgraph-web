import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Fixture data — realistic entities and relationships for a small case
// ---------------------------------------------------------------------------

const CASE_ID = "c0000000-0000-0000-0000-000000000001";

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
 * The page hits three endpoints on mount (via Promise.allSettled):
 *   1. GET /cases/{caseId}/graph
 *   2. GET /cases/{caseId}/entities?limit=200&offset=0
 *   3. GET /cases/{caseId}/relationships?limit=200&offset=0
 *
 * The AuthContext also calls GET /users/me on mount to check login state.
 * Without mocking it the 401 interceptor redirects to /login.
 */
async function mockGraphApi(page: Page): Promise<void> {
  // Auth — return a valid user so the app does not redirect to /login.
  await page.route("**/users/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(USER_ME) }),
  );

  // Graph dump
  await page.route(`**/cases/${CASE_ID}/graph`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(GRAPH_DUMP),
    }),
  );

  // Entities list (paginated — return all in first page)
  await page.route(`**/cases/${CASE_ID}/entities**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ENTITIES),
    }),
  );

  // Relationships list (paginated — return all in first page)
  await page.route(`**/cases/${CASE_ID}/relationships**`, (route) =>
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
    // Instead we use page.evaluate() to programmatically emit a "tap" event
    // on the first entity node, which triggers the onNodeClick callback and
    // sets selectedEntity — opening the EntityDetailDrawer.
    //
    // The GraphCanvas component stores the Cytoscape core instance in React
    // state. We locate the CytoscapeComponent's container and use Cytoscape's
    // API to emit the tap. The cy instance is exposed on the container's
    // __cy property by react-cytoscapejs internals, or we find it via the
    // cytoscape scratch data on the canvas parent.
    //
    // Robust approach: find the cy instance on the page's CytoscapeComponent
    // container element and emit a tap on a known node ID.
    const targetEntityId = ENTITIES[0].id;

    await page.evaluate((nodeId: string) => {
      // react-cytoscapejs stores the cy instance; find it via the global
      // Cytoscape registry or by traversing the component's canvas parent.
      // The library sets cy on the container div as a data attribute.
      // Fallback: find all canvas elements and look for cy on parent.
      const containers = document.querySelectorAll("[data-cy]");
      // If react-cytoscapejs does not expose data-cy, walk the DOM to find
      // a div whose child is a <canvas> used by Cytoscape.
      let cy: unknown = null;

      // Attempt 1: window-level Cytoscape instances (not always available)
      // Attempt 2: traverse from the role="img" container
      const imgContainer = document.querySelector('[role="img"]');
      if (imgContainer) {
        const innerDiv = imgContainer.querySelector("div");
        if (innerDiv) {
          // react-cytoscapejs sets _cy on the component instance, but we can
          // access it through the Cytoscape extension: the div has a ._cyreg
          // property, or the <CytoscapeComponent> sets cy on its wrapper.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cy = (innerDiv as any)._cyreg?.cy ?? (innerDiv as any).__cy;
        }
      }

      // If we found the cy instance, emit a tap on the target node.
      if (cy && typeof (cy as Record<string, unknown>)["$"] === "function") {
        const core = cy as {
          $: (sel: string) => { emit: (evt: string) => void };
        };
        core.$(`#${nodeId}`).emit("tap");
        return;
      }

      // Last resort: we were unable to reach the Cytoscape instance.
      // The test will still assert that the drawer appeared (it won't) and
      // will fail clearly rather than silently passing.
      throw new Error("Could not locate Cytoscape instance on page");
    }, targetEntityId);

    // The EntityDetailDrawer uses title="Entity Detail" on the Mantine Drawer.
    const drawer = page.getByRole("dialog", { name: /entity detail/i });
    await expect(drawer).toBeVisible();

    // The drawer should display the clicked entity's label.
    await expect(drawer.getByText(ENTITIES[0].label)).toBeVisible();
  });
});
