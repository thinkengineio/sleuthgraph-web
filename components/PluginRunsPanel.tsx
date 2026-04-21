"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

import type { PluginRunRead } from "@/lib/api";
import { listPluginRuns } from "@/lib/api";
import { PluginRunDetailDrawer } from "./PluginRunDetailDrawer";
import { PluginRunsTable } from "./PluginRunsTable";

interface PluginRunsPanelProps {
  caseId: string;
  /**
   * Bump this value to trigger a re-fetch (mirrors EvidencePanel's refreshKey
   * pattern; caller increments after a successful plugin run).
   */
  refreshToken?: number;
}

export function PluginRunsPanel({ caseId, refreshToken = 0 }: PluginRunsPanelProps) {
  const [items, setItems] = useState<PluginRunRead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailRun, setDetailRun] = useState<PluginRunRead | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listPluginRuns(caseId, { limit: 100 });
      setItems(result.items);
      setTotal(result.total);
    } catch (err: unknown) {
      notifications.show({
        title: "Failed to load plugin runs",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    // One-shot fetch on mount + whenever refreshToken changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRuns();
  }, [fetchRuns, refreshToken]);

  return (
    <>
      <Card withBorder>
        <Stack gap="sm">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Title order={5}>Plugin Runs</Title>
              {!loading && (
                <Text size="xs" c="dimmed">
                  ({total})
                </Text>
              )}
            </Group>
          </Group>

          {/* Table or loader */}
          {loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
            </Group>
          ) : (
            <PluginRunsTable items={items} onViewDetail={(run) => setDetailRun(run)} />
          )}
        </Stack>
      </Card>

      {/* Detail drawer */}
      <PluginRunDetailDrawer
        run={detailRun}
        opened={detailRun !== null}
        onClose={() => setDetailRun(null)}
      />
    </>
  );
}
