"use client";

import { useCallback, useEffect, useState } from "react";

import { Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLink, IconX } from "@tabler/icons-react";

import type { EntityRead, RelationshipRead } from "@/lib/api";
import { listRelationships } from "@/lib/api";
import { RelationshipCreateModal } from "./RelationshipCreateModal";
import { RelationshipDetailDrawer } from "./RelationshipDetailDrawer";
import { RelationshipTable } from "./RelationshipTable";

interface RelationshipPanelProps {
  caseId: string;
  /** Entity list owned by the parent (EntityPanel fetches it once). */
  entities: EntityRead[];
  /** Bump to re-fetch relationships (e.g. after a plugin run creates new ones). */
  refreshToken?: number;
}

export function RelationshipPanel({ caseId, entities, refreshToken = 0 }: RelationshipPanelProps) {
  const [items, setItems] = useState<RelationshipRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailRel, setDetailRel] = useState<RelationshipRead | null>(null);

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listRelationships(caseId, { limit: 200 });
      setItems(result);
    } catch (err: unknown) {
      notifications.show({
        title: "Failed to load relationships",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    // Re-fetch on mount and whenever refreshToken changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRelationships();
  }, [fetchRelationships, refreshToken]);

  function handleCreated(rel: RelationshipRead) {
    setItems((prev) => [...prev, rel]);
  }

  function handleDeleted(relId: string) {
    setItems((prev) => prev.filter((r) => r.id !== relId));
  }

  async function handleTableDelete(rel: RelationshipRead) {
    // Delegate to the drawer logic by opening it? No — inline confirmation matches EvidencePanel pattern.
    // RelationshipDetailDrawer handles its own confirm; for table-row we open the drawer.
    setDetailRel(rel);
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="sm">
          {/* Header row */}
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Title order={5}>Relationships</Title>
              {!loading && (
                <Text size="xs" c="dimmed">
                  ({items.length})
                </Text>
              )}
            </Group>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconLink size={13} />}
              onClick={() => setCreateOpen(true)}
              disabled={entities.length < 1}
            >
              Create relationship
            </Button>
          </Group>

          {/* Table or loader */}
          {loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
            </Group>
          ) : (
            <RelationshipTable
              items={items}
              entities={entities}
              onViewDetail={(r) => setDetailRel(r)}
              onDelete={handleTableDelete}
            />
          )}
        </Stack>
      </Card>

      {/* Create modal */}
      <RelationshipCreateModal
        caseId={caseId}
        entities={entities}
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      {/* Detail drawer (also handles delete) */}
      <RelationshipDetailDrawer
        relationship={detailRel}
        entities={entities}
        opened={detailRel !== null}
        onClose={() => setDetailRel(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
