"use client";

import { useState } from "react";

import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconX } from "@tabler/icons-react";

import type { EntityRead, RelationshipRead } from "@/lib/api";
import { deleteRelationship } from "@/lib/api";
import { formatTs } from "@/lib/format";
import { EntityTypeBadge } from "./EntityTypeBadge";

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      {children}
    </Stack>
  );
}

interface RelationshipDetailDrawerProps {
  relationship: RelationshipRead | null;
  entities: EntityRead[];
  opened: boolean;
  onClose: () => void;
  onDeleted: (relId: string) => void;
}

function buildEntityMap(entities: EntityRead[]): Record<string, EntityRead> {
  const map: Record<string, EntityRead> = {};
  for (const e of entities) {
    map[e.id] = e;
  }
  return map;
}

export function RelationshipDetailDrawer({
  relationship: rel,
  entities,
  opened,
  onClose,
  onDeleted,
}: RelationshipDetailDrawerProps) {
  const [deleting, setDeleting] = useState(false);

  const entityMap = buildEntityMap(entities);

  async function handleDelete() {
    if (!rel) return;
    if (!window.confirm(`Delete this ${rel.rel_type} relationship? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteRelationship(rel.case_id, rel.id);
      notifications.show({
        title: "Relationship deleted",
        message: `${rel.rel_type} link removed.`,
        color: "orange",
      });
      onDeleted(rel.id);
      onClose();
    } catch (err: unknown) {
      notifications.show({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
      setDeleting(false);
    }
  }

  const src = rel ? entityMap[rel.src_entity_id] : undefined;
  const dst = rel ? entityMap[rel.dst_entity_id] : undefined;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Relationship Detail"
      position="right"
      size="md"
      padding="md"
    >
      {rel && (
        <Stack gap="md">
          {/* Relationship type */}
          <Badge size="md" variant="light" color="violet" w="fit-content">
            {rel.rel_type}
          </Badge>

          <Divider />

          {/* ID */}
          <DetailRow label="Relationship ID">
            <Text ff="monospace" size="xs" style={{ wordBreak: "break-all" }}>
              {rel.id}
            </Text>
          </DetailRow>

          {/* SRC */}
          <DetailRow label="Source Entity">
            <Group gap="xs" align="center">
              {src ? (
                <>
                  <EntityTypeBadge type={src.type} label={src.label} />
                  <Text ff="monospace" size="xs" c="dimmed">
                    ({rel.src_entity_id.slice(0, 8)}…)
                  </Text>
                </>
              ) : (
                <Text ff="monospace" size="xs">
                  {rel.src_entity_id}
                </Text>
              )}
            </Group>
          </DetailRow>

          {/* DST */}
          <DetailRow label="Destination Entity">
            <Group gap="xs" align="center">
              {dst ? (
                <>
                  <EntityTypeBadge type={dst.type} label={dst.label} />
                  <Text ff="monospace" size="xs" c="dimmed">
                    ({rel.dst_entity_id.slice(0, 8)}…)
                  </Text>
                </>
              ) : (
                <Text ff="monospace" size="xs">
                  {rel.dst_entity_id}
                </Text>
              )}
            </Group>
          </DetailRow>

          <Divider />

          {/* Confidence + source plugin */}
          <Group grow>
            <DetailRow label="Confidence">
              <Text size="sm" ff="monospace">
                {rel.confidence.toFixed(2)}
              </Text>
            </DetailRow>
            <DetailRow label="Source Plugin">
              <Text size="sm" c={rel.source_plugin ? undefined : "dimmed"}>
                {rel.source_plugin ?? "—"}
              </Text>
            </DetailRow>
          </Group>

          {/* Created */}
          <DetailRow label="Created">
            <Text size="xs" ff="monospace" c="dimmed">
              {formatTs(rel.created_at)}
            </Text>
          </DetailRow>

          {/* Attrs */}
          <DetailRow label="Attrs">
            <Box
              p="xs"
              style={{
                background: "var(--mantine-color-dark-7)",
                borderRadius: "var(--mantine-radius-sm)",
                border: "1px solid var(--mantine-color-dark-5)",
                overflowX: "auto",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: "var(--mantine-font-family-monospace)",
                  fontSize: "0.75rem",
                  color: "var(--mantine-color-gray-3)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {Object.keys(rel.attrs).length > 0
                  ? JSON.stringify(rel.attrs, null, 2)
                  : "{}"}
              </pre>
            </Box>
          </DetailRow>

          <Divider />

          {/* Delete — no edit (relationships are immutable) */}
          <Button
            variant="light"
            color="red"
            size="sm"
            fullWidth
            leftSection={<IconTrash size={14} />}
            loading={deleting}
            onClick={handleDelete}
          >
            Delete relationship
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}
