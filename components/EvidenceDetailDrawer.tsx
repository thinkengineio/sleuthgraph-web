"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CopyButton,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconClipboard, IconDownload } from "@tabler/icons-react";

import type { Evidence } from "@/lib/api";
import { evidenceBlobUrl } from "@/lib/api";

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

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

interface EvidenceDetailDrawerProps {
  evidence: Evidence | null;
  opened: boolean;
  onClose: () => void;
}

export function EvidenceDetailDrawer({ evidence: ev, opened, onClose }: EvidenceDetailDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Evidence Detail"
      position="right"
      size="md"
      padding="md"
    >
      {ev && (
        <Stack gap="md">
          {/* ID */}
          <DetailRow label="Evidence ID">
            <Text ff="monospace" size="xs">
              {ev.id}
            </Text>
          </DetailRow>

          <Divider />

          {/* Timestamp */}
          <DetailRow label="Timestamp">
            <Text ff="monospace" size="sm">
              {formatTs(ev.timestamp)}
            </Text>
          </DetailRow>

          {/* Source plugin */}
          <DetailRow label="Source Plugin">
            <Badge size="sm" variant="light" color="violet" w="fit-content">
              {ev.source_plugin}
            </Badge>
          </DetailRow>

          {/* Query */}
          <DetailRow label="Query">
            <Text size="sm">{ev.query}</Text>
          </DetailRow>

          {/* Entity ID */}
          {ev.entity_id && (
            <DetailRow label="Linked Entity">
              <Text ff="monospace" size="xs">
                {ev.entity_id}
              </Text>
            </DetailRow>
          )}

          <Divider />

          {/* Full hash with copy */}
          <DetailRow label="SHA-256 Hash">
            <CopyButton value={ev.response_hash} timeout={2000}>
              {({ copied, copy }) => (
                <Group gap={6} align="flex-start" wrap="nowrap">
                  <Text ff="monospace" size="xs" style={{ wordBreak: "break-all", flex: 1 }}>
                    {ev.response_hash}
                  </Text>
                  <Tooltip label={copied ? "Copied!" : "Copy hash"} withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color={copied ? "green" : "gray"}
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
                      {copied ? <IconCheck size={13} /> : <IconClipboard size={13} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </CopyButton>
          </DetailRow>

          {/* Size + content type */}
          <Group grow>
            <DetailRow label="Size">
              <Text size="sm">{humanBytes(ev.response_bytes)}</Text>
            </DetailRow>
            <DetailRow label="Content Type">
              <Text ff="monospace" size="xs" c="dimmed">
                {ev.response_content_type ?? "—"}
              </Text>
            </DetailRow>
          </Group>

          {/* Created by */}
          {ev.created_by && (
            <DetailRow label="Captured By">
              <Text size="sm" ff="monospace">
                {ev.created_by}
              </Text>
            </DetailRow>
          )}

          <Divider />

          {/* Reproducibility spec */}
          <DetailRow label="Reproducibility Spec">
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
                {JSON.stringify(ev.reproducibility_spec, null, 2)}
              </pre>
            </Box>
          </DetailRow>

          <Divider />

          {/* Download button */}
          <Button
            component="a"
            href={evidenceBlobUrl(ev.case_id, ev.id)}
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<IconDownload size={14} />}
            variant="light"
            size="sm"
            fullWidth
          >
            Download Blob
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}
