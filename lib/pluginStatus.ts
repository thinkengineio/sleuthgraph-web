/**
 * Maps PluginRunStatus values to display metadata used across
 * PluginRunsTable, PluginRunDetailDrawer, and RunPluginModal.
 */

import {
  IconCheck,
  IconClock,
  IconX,
} from "@tabler/icons-react";

import type { PluginRunStatus } from "@/lib/api";

export type PluginStatusMeta = {
  color: string;
  icon: typeof IconCheck;
  label: string;
  description: string;
};

const STATUS_MAP: Record<PluginRunStatus, PluginStatusMeta> = {
  running: {
    color: "yellow",
    icon: IconClock,
    label: "Running",
    description: "Plugin is currently executing",
  },
  succeeded: {
    color: "green",
    icon: IconCheck,
    label: "Succeeded",
    description: "Plugin completed successfully",
  },
  failed: {
    color: "red",
    icon: IconX,
    label: "Failed",
    description: "Plugin encountered an error",
  },
};

export function getPluginStatusMeta(status: PluginRunStatus): PluginStatusMeta {
  return STATUS_MAP[status];
}

/**
 * Format a duration in seconds to a human-readable string e.g. "27.6s".
 * Returns "—" if either timestamp is null.
 */
export function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format elapsed seconds as MM:SS for the running-state counter.
 */
export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
