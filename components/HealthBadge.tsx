"use client";

import { useEffect, useState } from "react";

import { Badge, Tooltip } from "@mantine/core";
import { IconCircleFilled } from "@tabler/icons-react";

import { apiClient } from "@/lib/api";

type State = "checking" | "ok" | "error";

export default function HealthBadge() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    apiClient
      .health()
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, []);

  const label =
    state === "checking" ? "Checking..." : state === "ok" ? "API healthy" : "API unreachable";
  const color = state === "checking" ? "gray" : state === "ok" ? "green" : "red";

  return (
    <Tooltip label={state === "ok" ? "Backend is reachable" : "Cannot reach backend"} withArrow>
      <Badge
        color={color}
        variant="light"
        leftSection={<IconCircleFilled size={8} />}
        aria-label={`API status: ${label}`}
      >
        {label}
      </Badge>
    </Tooltip>
  );
}
