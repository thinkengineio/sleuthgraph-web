"use client";

import { useEffect, useState } from "react";

import { Tooltip } from "@mantine/core";

import { apiClient } from "@/lib/api";

import classes from "./HealthBadge.module.css";

type State = "checking" | "ok" | "error";

const LABELS: Record<State, string> = {
  checking: "Checking…",
  ok: "API healthy",
  error: "API unreachable",
};

const TOOLTIPS: Record<State, string> = {
  checking: "Reaching backend…",
  ok: "Backend is reachable",
  error: "Cannot reach backend",
};

export default function HealthBadge() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .health()
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stateClass =
    state === "ok" ? classes.ok : state === "error" ? classes.error : classes.checking;

  return (
    <Tooltip label={TOOLTIPS[state]} withArrow>
      <span
        className={`${classes.pill} ${stateClass}`}
        role="status"
        aria-live="polite"
        aria-label={`API status: ${LABELS[state]}`}
      >
        <span className={classes.indicator}>
          <span className={classes.dot} />
          {state === "ok" && <span className={classes.ping} aria-hidden="true" />}
        </span>
        <span>{LABELS[state]}</span>
      </span>
    </Tooltip>
  );
}
