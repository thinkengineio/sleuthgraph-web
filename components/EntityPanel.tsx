"use client";

import { useCallback, useEffect, useState } from "react";

import { Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconX } from "@tabler/icons-react";

import type { EntityRead } from "@/lib/api";
import { deleteEntity, listEntities } from "@/lib/api";
import { EntityCreateModal } from "./EntityCreateModal";
import { EntityDetailDrawer } from "./EntityDetailDrawer";
import { EntityTable } from "./EntityTable";

interface EntityPanelProps {
  caseId: string;
  /** Called whenever the entity list changes so the parent can update
   *  any downstream panels (e.g. RelationshipPanel) that depend on the list. */
  onEntitiesChange?: (entities: EntityRead[]) => void;
}

export function EntityPanel({ caseId, onEntitiesChange }: EntityPanelProps) {
  const [items, setItems] = useState<EntityRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<EntityRead | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEntities(caseId, { limit: 200 });
      setItems(result);
      onEntitiesChange?.(result);
    } catch (err: unknown) {
      notifications.show({
        title: "Failed to load entities",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  }, [caseId, onEntitiesChange]);

  useEffect(() => {
    // One-shot fetch on mount; setState inside async effect is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntities();
  }, [fetchEntities]);

  function handleCreated(entity: EntityRead) {
    const next = [...items, entity];
    setItems(next);
    onEntitiesChange?.(next);
  }

  function handleUpdated(entity: EntityRead) {
    const next = items.map((e) => (e.id === entity.id ? entity : e));
    setItems(next);
    onEntitiesChange?.(next);
    // Update drawer too if it's showing the same entity
    if (detailEntity?.id === entity.id) setDetailEntity(entity);
  }

  function handleDeleted(entityId: string) {
    const next = items.filter((e) => e.id !== entityId);
    setItems(next);
    onEntitiesChange?.(next);
  }

  async function handleTableDelete(entity: EntityRead) {
    if (!window.confirm(`Delete entity "${entity.label}"? This cannot be undone.`)) return;
    try {
      await deleteEntity(caseId, entity.id);
      notifications.show({
        title: "Entity deleted",
        message: `"${entity.label}" has been removed.`,
        color: "orange",
      });
      handleDeleted(entity.id);
    } catch (err: unknown) {
      notifications.show({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    }
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="sm">
          {/* Header row */}
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Title order={5}>Entities</Title>
              {!loading && (
                <Text size="xs" c="dimmed">
                  ({items.length})
                </Text>
              )}
            </Group>
            <Button
              size="xs"
              leftSection={<IconPlus size={13} />}
              onClick={() => setCreateOpen(true)}
            >
              Add entity
            </Button>
          </Group>

          {/* Table or loader */}
          {loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
            </Group>
          ) : (
            <EntityTable
              items={items}
              onViewDetail={(e) => setDetailEntity(e)}
              onDelete={handleTableDelete}
            />
          )}
        </Stack>
      </Card>

      {/* Create modal */}
      <EntityCreateModal
        caseId={caseId}
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      {/* Detail drawer */}
      <EntityDetailDrawer
        entity={detailEntity}
        opened={detailEntity !== null}
        onClose={() => setDetailEntity(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
}
