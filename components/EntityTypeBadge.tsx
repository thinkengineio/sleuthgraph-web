"use client";

import { Badge, Group } from "@mantine/core";

import { ENTITY_TYPE_META } from "@/lib/entityTypes";
import type { EntityType } from "@/lib/entityTypes";

interface EntityTypeBadgeProps {
  type: EntityType;
  /** Override label; defaults to the canonical human label for the type. */
  label?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Renders an entity type as a coloured Mantine Badge with the appropriate
 * Tabler icon.  Used in tables, modals, and Select option renderers.
 */
export function EntityTypeBadge({ type, label, size = "sm" }: EntityTypeBadgeProps) {
  const meta = ENTITY_TYPE_META[type];
  const Icon = meta.icon;
  const displayLabel = label ?? meta.label;

  return (
    <Badge
      size={size}
      variant="light"
      color={meta.color}
      leftSection={
        <Group align="center" gap={0}>
          <Icon size={10} stroke={1.5} />
        </Group>
      }
    >
      {displayLabel}
    </Badge>
  );
}
