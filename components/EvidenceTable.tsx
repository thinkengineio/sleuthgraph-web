"use client";

import {
  ActionIcon,
  Badge,
  Box,
  CopyButton,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconClipboard, IconDownload, IconEye } from "@tabler/icons-react";

import type { Evidence } from "@/lib/api";
import { evidenceBlobUrl } from "@/lib/api";
import { formatTs, humanBytes } from "@/lib/format";

// ── Helpers ────────────────────────────────────────────────────────────────

function shortHash(hash: string): string {
  return hash.slice(0, 12);
}

// ── Component ──────────────────────────────────────────────────────────────

interface EvidenceTableProps {
  items: Evidence[];
  onViewDetail: (ev: Evidence) => void;
}

export function EvidenceTable({ items, onViewDetail }: EvidenceTableProps) {
  if (items.length === 0) {
    return (
      <Stack align="center" py="xl" gap="xs">
        <Text c="dimmed" size="sm">
          No evidence yet — capture your first piece
        </Text>
      </Stack>
    );
  }

  const rows = items.map((ev) => (
    <Table.Tr key={ev.id}>
      {/* Hash — short display + copy full */}
      <Table.Td>
        <CopyButton value={ev.response_hash} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? "Copied!" : ev.response_hash}
              position="top"
              withArrow
              multiline
              maw={420}
            >
              <Group
                gap={4}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  copy();
                  notifications.show({
                    title: "Hash copied",
                    message: ev.response_hash,
                    color: "green",
                    icon: <IconCheck size={14} />,
                  });
                }}
              >
                <Text ff="monospace" size="xs" c="blue.4">
                  {shortHash(ev.response_hash)}
                </Text>
                <ActionIcon size="xs" variant="subtle" color={copied ? "green" : "gray"}>
                  {copied ? <IconCheck size={12} /> : <IconClipboard size={12} />}
                </ActionIcon>
              </Group>
            </Tooltip>
          )}
        </CopyButton>
      </Table.Td>

      {/* Timestamp */}
      <Table.Td>
        <Text ff="monospace" size="xs" c="dimmed">
          {formatTs(ev.timestamp)}
        </Text>
      </Table.Td>

      {/* Source plugin */}
      <Table.Td>
        <Badge size="sm" variant="light" color="violet">
          {ev.source_plugin}
        </Badge>
      </Table.Td>

      {/* Query — truncated with tooltip */}
      <Table.Td maw={200}>
        <Tooltip label={ev.query} position="top" withArrow disabled={ev.query.length <= 40}>
          <Text size="xs" truncate="end" maw={180}>
            {ev.query}
          </Text>
        </Tooltip>
      </Table.Td>

      {/* Size */}
      <Table.Td>
        <Text size="xs" c="dimmed">
          {humanBytes(ev.response_bytes)}
        </Text>
      </Table.Td>

      {/* Content type */}
      <Table.Td>
        <Text size="xs" c="dimmed" ff="monospace">
          {ev.response_content_type ?? "—"}
        </Text>
      </Table.Td>

      {/* Actions */}
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Download blob" withArrow position="top">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="blue"
              component="a"
              href={evidenceBlobUrl(ev.case_id, ev.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconDownload size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="View details" withArrow position="top">
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onViewDetail(ev)}>
              <IconEye size={14} />
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
            <Table.Th>Hash</Table.Th>
            <Table.Th>Timestamp</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Query</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Box>
  );
}
