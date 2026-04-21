"use client";

import { useEffect, useReducer, useRef } from "react";

import {
  Badge,
  Button,
  Code,
  Divider,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconPlayerPlay, IconRefresh, IconX } from "@tabler/icons-react";

import type { EntityRead, PluginInfo, PluginRunResponse } from "@/lib/api";
import { runPlugin } from "@/lib/api";
import { formatElapsed } from "@/lib/pluginStatus";
import { EntityTypeBadge } from "./EntityTypeBadge";

// ── State machine ────────────────────────────────────────────────────────────

type ModalPhase = "idle" | "running" | "success" | "error";

type ModalState = {
  phase: ModalPhase;
  elapsed: number;
  result: PluginRunResponse | null;
  errorMessage: string | null;
};

type ModalAction =
  | { type: "START_RUN" }
  | { type: "TICK" }
  | { type: "RUN_SUCCESS"; payload: PluginRunResponse }
  | { type: "RUN_ERROR"; payload: string }
  | { type: "RESET" };

function reducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "START_RUN":
      return { phase: "running", elapsed: 0, result: null, errorMessage: null };
    case "TICK":
      return { ...state, elapsed: state.elapsed + 1 };
    case "RUN_SUCCESS":
      return {
        phase: "success",
        elapsed: state.elapsed,
        result: action.payload,
        errorMessage: null,
      };
    case "RUN_ERROR":
      return { phase: "error", elapsed: state.elapsed, result: null, errorMessage: action.payload };
    case "RESET":
      return { phase: "idle", elapsed: 0, result: null, errorMessage: null };
    default:
      return state;
  }
}

const INITIAL_STATE: ModalState = {
  phase: "idle",
  elapsed: 0,
  result: null,
  errorMessage: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a user-friendly hint from a taxonomy error prefix.
 * e.g. "upstream_http_error:HTTPStatusError" → "The external service returned an HTTP error."
 */
function errorHint(msg: string | null): string | null {
  if (!msg) return null;
  if (msg.startsWith("upstream_http_error")) return "The external service returned an HTTP error.";
  if (msg.startsWith("upstream_timeout")) return "The external service did not respond in time.";
  if (msg.startsWith("type_mismatch"))
    return "This plugin does not accept the selected entity type.";
  if (msg.startsWith("plugin execution failed"))
    return "An unexpected error occurred on the server.";
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

interface RunPluginModalProps {
  opened: boolean;
  entity: EntityRead | null;
  plugin: PluginInfo | null;
  onClose: () => void;
  /** Called after a successful run so the parent can bump refreshToken. */
  onSuccess: (result: PluginRunResponse) => void;
}

export function RunPluginModal({
  opened,
  entity,
  plugin,
  onClose,
  onSuccess,
}: RunPluginModalProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (opened) {
      dispatch({ type: "RESET" });
    }
  }, [opened]);

  // Elapsed counter while running
  useEffect(() => {
    if (state.phase === "running") {
      intervalRef.current = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.phase]);

  async function handleRun() {
    if (!entity || !plugin) return;
    dispatch({ type: "START_RUN" });
    try {
      const result = await runPlugin(entity.case_id, plugin.name, entity.id);
      dispatch({ type: "RUN_SUCCESS", payload: result });
      onSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "RUN_ERROR", payload: msg });
      notifications.show({
        title: "Plugin run failed",
        message: msg,
        color: "red",
        icon: <IconX size={14} />,
      });
    }
  }

  function handleClose() {
    if (state.phase === "running") return; // prevent close during run
    dispatch({ type: "RESET" });
    onClose();
  }

  const isRunning = state.phase === "running";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Run Plugin"
      closeOnClickOutside={!isRunning}
      closeOnEscape={!isRunning}
      withCloseButton={!isRunning}
      size="sm"
    >
      {entity && plugin && (
        <Stack gap="md">
          {/* ── IDLE ── */}
          {state.phase === "idle" && (
            <>
              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={500}>
                  Input Entity
                </Text>
                <Group gap="xs">
                  <EntityTypeBadge type={entity.type} />
                  <Text size="sm">{entity.label}</Text>
                </Group>
              </Stack>

              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={500}>
                  Plugin
                </Text>
                <Badge variant="light" color="violet" w="fit-content">
                  {plugin.name}@{plugin.version}
                </Badge>
              </Stack>

              <Text size="sm" c="dimmed">
                Discover subdomains via Certificate Transparency (5–30s)
              </Text>

              <Divider />

              <Group justify="flex-end" gap="xs">
                <Button variant="subtle" color="gray" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button size="sm" leftSection={<IconPlayerPlay size={14} />} onClick={handleRun}>
                  Run
                </Button>
              </Group>
            </>
          )}

          {/* ── RUNNING ── */}
          {state.phase === "running" && (
            <Stack align="center" gap="md" py="md">
              <Loader size="md" />
              <Text size="sm" fw={500}>
                Contacting {plugin.name}@{plugin.version}...
              </Text>
              <Text size="xs" c="dimmed">
                This typically takes 5–30s
              </Text>
              <Title order={4} ff="monospace">
                {formatElapsed(state.elapsed)}
              </Title>
              <Button variant="subtle" color="gray" size="xs" disabled>
                Close (running…)
              </Button>
            </Stack>
          )}

          {/* ── SUCCESS ── */}
          {state.phase === "success" && state.result && (
            <>
              <Stack align="center" gap="xs" py="xs">
                <IconCheck size={32} color="var(--mantine-color-green-5)" />
                <Text fw={500} c="green">
                  Plugin succeeded in {state.elapsed.toFixed(0)}s
                </Text>
              </Stack>

              <Stack gap="xs">
                <Group gap="xs" justify="center">
                  <Badge color="teal" variant="light">
                    +{state.result.run.entities_created_count} entities
                  </Badge>
                  <Badge color="blue" variant="light">
                    +{state.result.run.relationships_created_count} relationships
                  </Badge>
                  <Badge color="violet" variant="light">
                    +{state.result.run.evidence_count} evidence
                  </Badge>
                </Group>
              </Stack>

              <Divider />

              <Group justify="flex-end">
                <Button size="sm" variant="light" onClick={handleClose}>
                  Close
                </Button>
              </Group>
            </>
          )}

          {/* ── ERROR ── */}
          {state.phase === "error" && (
            <>
              <Stack align="center" gap="xs" py="xs">
                <IconX size={32} color="var(--mantine-color-red-5)" />
                <Text fw={500} c="red">
                  Plugin failed
                </Text>
              </Stack>

              {state.errorMessage && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={500}>
                    Error detail
                  </Text>
                  <Code block>{state.errorMessage}</Code>
                </Stack>
              )}

              {errorHint(state.errorMessage) && (
                <Text size="xs" c="dimmed">
                  {errorHint(state.errorMessage)}
                </Text>
              )}

              <Divider />

              <Group justify="flex-end" gap="xs">
                <Button variant="subtle" color="gray" size="sm" onClick={handleClose}>
                  Close
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="orange"
                  leftSection={<IconRefresh size={14} />}
                  onClick={() => {
                    dispatch({ type: "RESET" });
                  }}
                >
                  Retry
                </Button>
              </Group>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}
