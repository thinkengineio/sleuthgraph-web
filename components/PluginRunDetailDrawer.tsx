"use client";

import { Badge, Code, Divider, Drawer, Group, Stack, Text } from "@mantine/core";

import type { PluginRunRead } from "@/lib/api";
import { formatTs } from "@/lib/format";
import { formatDuration, getPluginStatusMeta } from "@/lib/pluginStatus";
import { EntityTypeBadge } from "./EntityTypeBadge";
import type { EntityType } from "@/lib/api";

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

interface PluginRunDetailDrawerProps {
  run: PluginRunRead | null;
  opened: boolean;
  onClose: () => void;
  /** Optional entity type for the input entity — shows EntityTypeBadge if provided. */
  inputEntityType?: EntityType;
}

export function PluginRunDetailDrawer({
  run,
  opened,
  onClose,
  inputEntityType,
}: PluginRunDetailDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Plugin Run Detail"
      position="right"
      size="md"
      padding="md"
    >
      {run && (
        <Stack gap="md">
          {/* Run ID */}
          <DetailRow label="Run ID">
            <Text ff="monospace" size="xs" style={{ wordBreak: "break-all" }}>
              {run.id}
            </Text>
          </DetailRow>

          <Divider />

          {/* Plugin */}
          <DetailRow label="Plugin">
            <Badge variant="light" color="violet" w="fit-content">
              {run.plugin_name}@{run.plugin_version}
            </Badge>
          </DetailRow>

          {/* Status */}
          <DetailRow label="Status">
            {(() => {
              const meta = getPluginStatusMeta(run.status);
              const StatusIcon = meta.icon;
              return (
                <Badge
                  variant="light"
                  color={meta.color}
                  w="fit-content"
                  leftSection={<StatusIcon size={10} />}
                >
                  {meta.label}
                </Badge>
              );
            })()}
          </DetailRow>

          {/* Input entity */}
          {run.input_entity_id && (
            <DetailRow label="Input Entity">
              <Group gap="xs">
                {inputEntityType && <EntityTypeBadge type={inputEntityType} />}
                <Text ff="monospace" size="xs">
                  {run.input_entity_id}
                </Text>
              </Group>
            </DetailRow>
          )}

          <Divider />

          {/* Timestamps + duration */}
          <Group grow>
            <DetailRow label="Started">
              <Text size="xs" ff="monospace" c="dimmed">
                {formatTs(run.started_at)}
              </Text>
            </DetailRow>
            <DetailRow label="Finished">
              <Text size="xs" ff="monospace" c="dimmed">
                {run.finished_at ? formatTs(run.finished_at) : "—"}
              </Text>
            </DetailRow>
          </Group>

          <DetailRow label="Duration">
            <Text size="sm" ff="monospace">
              {formatDuration(run.started_at, run.finished_at)}
            </Text>
          </DetailRow>

          <Divider />

          {/* Counts */}
          <DetailRow label="Created counts">
            <Group gap="xs">
              <Badge color="teal" variant="light" size="sm">
                {run.entities_created_count} entities
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                {run.relationships_created_count} relationships
              </Badge>
              <Badge color="violet" variant="light" size="sm">
                {run.evidence_count} evidence
              </Badge>
            </Group>
          </DetailRow>

          {/* Error detail — only for failed runs */}
          {run.status === "failed" && run.error_message && (
            <>
              <Divider />
              <DetailRow label="Error message">
                <Code block>{run.error_message}</Code>
              </DetailRow>
            </>
          )}

          {/* Created by */}
          {run.created_by && (
            <>
              <Divider />
              <DetailRow label="Triggered by">
                <Text size="sm" ff="monospace">
                  {run.created_by}
                </Text>
              </DetailRow>
            </>
          )}

          {/* Case ID */}
          <Divider />
          <DetailRow label="Case ID">
            <Text ff="monospace" size="xs" c="dimmed">
              {run.case_id}
            </Text>
          </DetailRow>
        </Stack>
      )}
    </Drawer>
  );
}
