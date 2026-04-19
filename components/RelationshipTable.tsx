"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowRight, IconEye, IconTrash } from "@tabler/icons-react";

import type { EntityRead, RelationshipRead } from "@/lib/api";
import { EntityTypeBadge } from "./EntityTypeBadge";

interface RelationshipTableProps {
  items: RelationshipRead[];
  entities: EntityRead[];
  onViewDetail: (rel: RelationshipRead) => void;
  onDelete: (rel: RelationshipRead) => void;
}

/** Build a lookup map from entity id → EntityRead. */
function buildEntityMap(entities: EntityRead[]): Record<string, EntityRead> {
  const map: Record<string, EntityRead> = {};
  for (const e of entities) {
    map[e.id] = e;
  }
  return map;
}

export function RelationshipTable({
  items,
  entities,
  onViewDetail,
  onDelete,
}: RelationshipTableProps) {
  const entityMap = buildEntityMap(entities);

  if (items.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text c="dimmed" size="sm">
          No relationships yet — create one above
        </Text>
      </Stack>
    );
  }

  const rows = items.map((rel) => {
    const src = entityMap[rel.src_entity_id];
    const dst = entityMap[rel.dst_entity_id];

    return (
      <Table.Tr key={rel.id}>
        {/* SRC → DST */}
        <Table.Td>
          <Group gap={6} wrap="nowrap" align="center">
            {src ? (
              <EntityTypeBadge type={src.type} label={src.label} />
            ) : (
              <Text size="xs" c="dimmed" ff="monospace">
                {rel.src_entity_id.slice(0, 8)}…
              </Text>
            )}
            <IconArrowRight size={12} color="var(--mantine-color-dimmed)" />
            {dst ? (
              <EntityTypeBadge type={dst.type} label={dst.label} />
            ) : (
              <Text size="xs" c="dimmed" ff="monospace">
                {rel.dst_entity_id.slice(0, 8)}…
              </Text>
            )}
          </Group>
        </Table.Td>

        {/* Relationship type */}
        <Table.Td>
          <Badge size="sm" variant="light" color="violet">
            {rel.rel_type}
          </Badge>
        </Table.Td>

        {/* Confidence */}
        <Table.Td>
          <Text size="xs" c="dimmed" ff="monospace">
            {rel.confidence.toFixed(2)}
          </Text>
        </Table.Td>

        {/* Source plugin */}
        <Table.Td>
          <Text size="xs" c="dimmed">
            {rel.source_plugin ?? "—"}
          </Text>
        </Table.Td>

        {/* Actions */}
        <Table.Td>
          <Group gap={4} wrap="nowrap">
            <Tooltip label="View details" withArrow position="top">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => onViewDetail(rel)}
                aria-label="View relationship details"
              >
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow position="top">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => onDelete(rel)}
                aria-label="Delete relationship"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Box style={{ overflowX: "auto" }}>
      <Table striped highlightOnHover verticalSpacing="xs" fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>SRC → DST</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Confidence</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Box>
  );
}
