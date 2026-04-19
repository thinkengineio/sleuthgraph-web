"use client";

import { ActionIcon, Box, CopyButton, Group, Stack, Table, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconClipboard, IconEye, IconTrash } from "@tabler/icons-react";

import type { EntityRead } from "@/lib/api";
import { formatTs } from "@/lib/format";
import { EntityTypeBadge } from "./EntityTypeBadge";

interface EntityTableProps {
  items: EntityRead[];
  onViewDetail: (entity: EntityRead) => void;
  onDelete: (entity: EntityRead) => void;
}

export function EntityTable({ items, onViewDetail, onDelete }: EntityTableProps) {
  if (items.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text c="dimmed" size="sm">
          No entities yet — add your first entity above
        </Text>
      </Stack>
    );
  }

  const rows = items.map((entity) => (
    <Table.Tr key={entity.id}>
      {/* Type badge */}
      <Table.Td>
        <EntityTypeBadge type={entity.type} />
      </Table.Td>

      {/* Label */}
      <Table.Td>
        <Tooltip label={entity.label} position="top" withArrow disabled={entity.label.length <= 40}>
          <Text size="sm" truncate="end" maw={200}>
            {entity.label}
          </Text>
        </Tooltip>
      </Table.Td>

      {/* Confidence */}
      <Table.Td>
        <Text size="xs" c="dimmed" ff="monospace">
          {entity.confidence.toFixed(2)}
        </Text>
      </Table.Td>

      {/* Created */}
      <Table.Td>
        <Text size="xs" c="dimmed" ff="monospace">
          {formatTs(entity.created_at)}
        </Text>
      </Table.Td>

      {/* ID — copyable */}
      <Table.Td>
        <CopyButton value={entity.id} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? "Copied!" : entity.id}
              position="top"
              withArrow
              maw={420}
              multiline
            >
              <Group
                gap={4}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  copy();
                  notifications.show({
                    title: "ID copied",
                    message: entity.id,
                    color: "green",
                    icon: <IconCheck size={14} />,
                  });
                }}
              >
                <Text ff="monospace" size="xs" c="blue.4">
                  {entity.id.slice(0, 8)}…
                </Text>
                <ActionIcon size="xs" variant="subtle" color={copied ? "green" : "gray"}>
                  {copied ? <IconCheck size={12} /> : <IconClipboard size={12} />}
                </ActionIcon>
              </Group>
            </Tooltip>
          )}
        </CopyButton>
      </Table.Td>

      {/* Actions */}
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="View / edit" withArrow position="top">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => onViewDetail(entity)}
              aria-label="View entity details"
            >
              <IconEye size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow position="top">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => onDelete(entity)}
              aria-label="Delete entity"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box style={{ overflowX: "auto" }}>
      <Table striped highlightOnHover verticalSpacing="xs" fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Type</Table.Th>
            <Table.Th>Label</Table.Th>
            <Table.Th>Confidence</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>ID</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Box>
  );
}
