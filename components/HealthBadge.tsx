"use client";

import { useEffect, useState } from "react";

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
  const color =
    state === "checking"
      ? "bg-gray-200 text-gray-700"
      : state === "ok"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${color}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}
