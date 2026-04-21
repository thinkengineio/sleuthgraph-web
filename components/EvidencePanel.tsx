"use client";

import { useCallback, useEffect, useState } from "react";

import { Button, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconFileDownload, IconPlus, IconX } from "@tabler/icons-react";

import type { Evidence } from "@/lib/api";
import { downloadEvidenceCsv, listEvidence } from "@/lib/api";
import { EvidenceDetailDrawer } from "./EvidenceDetailDrawer";
import { EvidenceTable } from "./EvidenceTable";
import { EvidenceUploadModal } from "./EvidenceUploadModal";

interface EvidencePanelProps {
  caseId: string;
  /** Bump to re-fetch evidence (e.g. after a plugin run creates new evidence). */
  refreshToken?: number;
}

export function EvidencePanel({ caseId, refreshToken = 0 }: EvidencePanelProps) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailEv, setDetailEv] = useState<Evidence | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEvidence(caseId, { limit: 100 });
      setItems(result.items);
      setTotal(result.total);
    } catch (err: unknown) {
      notifications.show({
        title: "Failed to load evidence",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    // Re-fetch on mount, when internal refreshKey changes (upload), or external refreshToken changes (plugin run).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvidence();
  }, [fetchEvidence, refreshKey, refreshToken]);

  function handleUploadSuccess() {
    setRefreshKey((k) => k + 1);
  }

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      await downloadEvidenceCsv(caseId);
    } catch (err: unknown) {
      notifications.show({
        title: "Export failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="sm">
          {/* Header row */}
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Title order={5}>Evidence</Title>
              {!loading && (
                <Text size="xs" c="dimmed">
                  ({total})
                </Text>
              )}
            </Group>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color="gray"
                leftSection={<IconFileDownload size={13} />}
                loading={exportLoading}
                onClick={handleExportCsv}
                disabled={items.length === 0}
              >
                Export CSV
              </Button>
              <Button
                size="xs"
                leftSection={<IconPlus size={13} />}
                onClick={() => setUploadOpen(true)}
              >
                Upload evidence
              </Button>
            </Group>
          </Group>

          {/* Table or loader */}
          {loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
            </Group>
          ) : (
            <EvidenceTable items={items} onViewDetail={(ev) => setDetailEv(ev)} />
          )}
        </Stack>
      </Card>

      {/* Upload modal */}
      <EvidenceUploadModal
        caseId={caseId}
        opened={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Detail drawer */}
      <EvidenceDetailDrawer
        evidence={detailEv}
        opened={detailEv !== null}
        onClose={() => setDetailEv(null)}
      />
    </>
  );
}
