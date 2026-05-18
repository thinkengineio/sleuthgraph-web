import { describe, it, expect, vi, afterEach } from "vitest";

import { relativeTime, formatTs } from "@/lib/format";

describe("relativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function freeze(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    freeze("2026-05-17T12:00:30Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("just now");
  });

  it('returns "1 minute ago" at exactly 60 seconds', () => {
    freeze("2026-05-17T12:01:00Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("1 minute ago");
  });

  it('returns "N minutes ago" for timestamps in the minutes range', () => {
    freeze("2026-05-17T12:25:00Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("25 minutes ago");
  });

  it('returns "1 hour ago" for a 60-minute difference', () => {
    freeze("2026-05-17T13:00:00Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("1 hour ago");
  });

  it('returns "N hours ago" for timestamps in the hours range', () => {
    freeze("2026-05-17T18:00:00Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("6 hours ago");
  });

  it('returns "1 day ago" for a 24-hour difference', () => {
    freeze("2026-05-18T12:00:00Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("1 day ago");
  });

  it('returns "N days ago" for timestamps in the days range', () => {
    freeze("2026-05-20T12:00:00Z");
    expect(relativeTime("2026-05-17T12:00:00Z")).toBe("3 days ago");
  });

  it("falls back to formatTs for timestamps 7 or more days old", () => {
    freeze("2026-05-24T12:00:00Z");
    const iso = "2026-05-17T12:00:00Z";
    expect(relativeTime(iso)).toBe(formatTs(iso));
  });

  it("falls back to formatTs for future timestamps (clock skew)", () => {
    freeze("2026-05-17T12:00:00Z");
    const iso = "2026-05-17T13:00:00Z";
    expect(relativeTime(iso)).toBe(formatTs(iso));
  });
});
