"use client";

import { ActionIcon, Badge, Table, Text, Tooltip } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";

import type { PluginRunRead } from "@/lib/api";
import { formatTs } from "@/lib/format";
import { formatDuration, getPluginStatusMeta } from "@/lib/pluginStatus";

interface PluginRunsTableProps {
  items: PluginRunRead[];
  onViewDetail: (run: PluginRunRead) => void;
}

export function PluginRunsTable({ items, onViewDetail }: PluginRunsTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No plugin runs yet. Open an entity and click Run plugin to capture your first run.
      </Text>
    );
  }

  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Plugin</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Duration</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Counts</Table.Th>
          <Table.Th w={50} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((run) => {
          const meta = getPluginStatusMeta(run.status);
          const StatusIcon = meta.icon;
          const duration = formatDuration(run.started_at, run.finished_at);
          return (
            <Table.Tr key={run.id}>
              <Table.Td>
                <Badge variant="light" color="violet" size="sm">
                  {run.plugin_name}@{run.plugin_version}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge
                  variant="light"
                  color={meta.color}
                  size="sm"
                  leftSection={<StatusIcon size={10} />}
                >
                  {meta.label}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">
                  {duration}
                </Text>
              </Table.Td>
              <Table.Td>
                <Tooltip label={formatTs(run.started_at)} withArrow>
                  <Text size="xs" c="dimmed">
                    {formatTs(run.started_at)}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>
                <Text size="xs" ff="monospace">
                  {run.entities_created_count}E &middot; {run.relationships_created_count}R &middot;{" "}
                  {run.evidence_count}Ev
                </Text>
              </Table.Td>
              <Table.Td>
                <Tooltip label="View detail" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => onViewDetail(run)}
                    aria-label="View run detail"
                  >
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
