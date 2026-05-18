"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Box, Button, Card, Center, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { EntityDetailDrawer } from "@/components/EntityDetailDrawer";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { type LayoutName } from "@/components/graph/layouts";
import { RelationshipDetailDrawer } from "@/components/RelationshipDetailDrawer";

import { ENTITY_TYPES, type EntityType } from "@/lib/entityTypes";
import {
  getGraph,
  listEntities,
  listRelationships,
  type EntityRead,
  type GraphDump,
  type RelationshipRead,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default function GraphPage({ params }: PageProps) {
  const { caseId } = use(params);
  const router = useRouter();
  const cyRef = useRef<{ fit: () => void; png: () => string | undefined } | null>(null);

  const [dump, setDump] = useState<GraphDump | null>(null);
  const [entities, setEntities] = useState<EntityRead[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRead[]>([]);
  const [layoutName, setLayoutName] = useState<LayoutName>("cose-bilkent");
  const [visibleTypes, setVisibleTypes] = useState<Set<EntityType>>(new Set(ENTITY_TYPES));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<EntityRead | null>(null);
  const [selectedRel, setSelectedRel] = useState<RelationshipRead | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // List endpoints cap limit at 200, so page through them. The graph dump
    // itself is already up to 10k — it's the source of truth for the canvas;
    // the per-row lists only exist to hydrate drawer detail on click.
    const PAGE = 200;
    async function loadAll<T>(fetcher: (offset: number) => Promise<T[]>): Promise<T[]> {
      const out: T[] = [];
      let offset = 0;
      while (true) {
        const batch = await fetcher(offset);
        out.push(...batch);
        if (batch.length < PAGE) return out;
        offset += PAGE;
      }
    }

    Promise.allSettled([
      getGraph(caseId, signal),
      loadAll<EntityRead>((offset) => listEntities(caseId, { limit: PAGE, offset, signal })),
      loadAll<RelationshipRead>((offset) =>
        listRelationships(caseId, { limit: PAGE, offset, signal }),
      ),
    ]).then(([graphResult, entitiesResult, relationshipsResult]) => {
      if (signal.aborted) return;

      const failures: string[] = [];

      if (graphResult.status === "fulfilled") {
        setDump(graphResult.value);
      } else {
        failures.push("graph");
        // Set empty dump so the page exits the loading state
        setDump({ vertices: [], edges: [] });
      }

      if (entitiesResult.status === "fulfilled") {
        setEntities(entitiesResult.value);
      } else {
        failures.push("entities");
      }

      if (relationshipsResult.status === "fulfilled") {
        setRelationships(relationshipsResult.value);
      } else {
        failures.push("relationships");
      }

      if (failures.length > 0) {
        notifications.show({
          title: "Partial graph load",
          message: `Failed to load: ${failures.join(", ")}. Showing available data.`,
          color: "yellow",
        });
      }
    });
    return () => {
      controller.abort();
    };
  }, [caseId]);

  // Build entity + relationship lookup maps from the fetched lists.
  const entityMap = useMemo(() => {
    const m: Record<string, EntityRead> = {};
    for (const e of entities) m[e.id] = e;
    return m;
  }, [entities]);

  const relMap = useMemo(() => {
    const m: Record<string, RelationshipRead> = {};
    for (const r of relationships) m[r.id] = r;
    return m;
  }, [relationships]);

  const handleNodeClick = useCallback(
    (id: string) => {
      const entity = entityMap[id];
      if (entity) {
        setSelectedEntity(entity);
        setSelectedRel(null);
      }
    },
    [entityMap],
  );

  const handleEdgeClick = useCallback(
    (id: string) => {
      const rel = relMap[id];
      if (rel) {
        setSelectedRel(rel);
        setSelectedEntity(null);
      }
    },
    [relMap],
  );

  const stats = useMemo(
    () => ({
      entityCount: dump?.vertices.length ?? 0,
      relationshipCount: dump?.edges.length ?? 0,
    }),
    [dump],
  );

  if (!dump) {
    return (
      <Center h="100vh">
        <Text c="dimmed">Loading graph...</Text>
      </Center>
    );
  }

  if (dump.vertices.length === 0) {
    return (
      <Center h="80vh">
        <Card withBorder p="xl">
          <Stack gap="sm" align="center">
            <Title order={3}>No entities yet</Title>
            <Text c="dimmed" size="sm">
              Add entities to this case or run a plugin to populate the graph.
            </Text>
            <Button onClick={() => router.push(`/cases/${caseId}`)}>Back to case</Button>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Stack gap="xs" style={{ height: "calc(100vh - 64px)" }} p="sm">
      <Group justify="space-between">
        <Title order={3}>Case graph</Title>
        <Button variant="subtle" onClick={() => router.push(`/cases/${caseId}`)}>
          Back to case
        </Button>
      </Group>

      <GraphToolbar
        layoutName={layoutName}
        onLayoutChange={setLayoutName}
        visibleTypes={visibleTypes}
        onVisibleTypesChange={setVisibleTypes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        entityCount={stats.entityCount}
        relationshipCount={stats.relationshipCount}
        onFit={() => cyRef.current?.fit()}
        onExport={() => {
          const dataUrl = cyRef.current?.png();
          if (!dataUrl) return;
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `case-${caseId}-graph.png`;
          a.click();
        }}
      />

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid var(--mantine-color-dark-4)",
          borderRadius: 8,
        }}
      >
        <GraphCanvas
          dump={dump}
          layoutName={layoutName}
          visibleTypes={visibleTypes}
          searchQuery={searchQuery}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          cyCallbackRef={cyRef}
        />
      </Box>

      <EntityDetailDrawer
        entity={selectedEntity}
        opened={selectedEntity !== null}
        onClose={() => setSelectedEntity(null)}
        onUpdated={(updated) => {
          setSelectedEntity(updated);
          setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        }}
        onDeleted={(id) => {
          setSelectedEntity(null);
          setEntities((prev) => prev.filter((e) => e.id !== id));
        }}
      />

      <RelationshipDetailDrawer
        relationship={selectedRel}
        entities={entities}
        opened={selectedRel !== null}
        onClose={() => setSelectedRel(null)}
        onDeleted={(id) => {
          setSelectedRel(null);
          setRelationships((prev) => prev.filter((r) => r.id !== id));
        }}
      />
    </Stack>
  );
}
