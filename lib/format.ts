/**
 * Shared formatting utilities used across UI components.
 * Centralised here to avoid duplication (closed web#13).
 */

/**
 * Format a byte count to a human-readable string (B / KB / MB / GB).
 */
export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format an ISO 8601 timestamp to a locale-aware display string.
 */
export function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Return a human-friendly relative-time string for an ISO 8601 timestamp.
 *
 * Thresholds:
 *   < 60 s       -> "just now"
 *   < 60 min     -> "N minutes ago"  (singular when N == 1)
 *   < 24 h       -> "N hours ago"
 *   < 7 d        -> "N days ago"
 *   >= 7 d       -> falls back to formatTs() for an absolute date
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;

  // Future timestamps or clock-skew: fall back to absolute.
  if (diffMs < 0) return formatTs(iso);

  const SEC = 1_000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  if (diffMs < 60 * SEC) return "just now";

  const minutes = Math.floor(diffMs / MIN);
  if (diffMs < 60 * MIN) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.floor(diffMs / HOUR);
  if (diffMs < 24 * HOUR) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(diffMs / DAY);
  if (diffMs < 7 * DAY) return days === 1 ? "1 day ago" : `${days} days ago`;

  return formatTs(iso);
}
