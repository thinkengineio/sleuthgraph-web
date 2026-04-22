"use client";

import {
  ActionIcon,
  Chip,
  Group,
  Select,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconArrowsMaximize, IconPhoto, IconSearch } from "@tabler/icons-react";

import { ENTITY_TYPES, ENTITY_TYPE_META, type EntityType } from "@/lib/entityTypes";
import { LAYOUT_LABELS, LAYOUT_NAMES, type LayoutName } from "./layouts";

interface GraphToolbarProps {
  layoutName: LayoutName;
  onLayoutChange: (name: LayoutName) => void;
  visibleTypes: Set<EntityType>;
  onVisibleTypesChange: (types: Set<EntityType>) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  entityCount: number;
  relationshipCount: number;
  onFit?: () => void;
  onExport?: () => void;
}

export function GraphToolbar({
  layoutName,
  onLayoutChange,
  visibleTypes,
  onVisibleTypesChange,
  searchQuery,
  onSearchChange,
  entityCount,
  relationshipCount,
  onFit,
  onExport,
}: GraphToolbarProps) {
  const layoutData = LAYOUT_NAMES.map((n) => ({ value: n, label: LAYOUT_LABELS[n] }));

  function handleChipChange(type: EntityType, checked: boolean) {
    const next = new Set(visibleTypes);
    if (checked) {
      next.add(type);
    } else {
      next.delete(type);
    }
    onVisibleTypesChange(next);
  }

  return (
    <Group gap="xs" wrap="wrap" align="center">
      {/* Layout selector */}
      <Select
        size="xs"
        placeholder="Layout"
        data={layoutData}
        value={layoutName}
        onChange={(v) => v && onLayoutChange(v as LayoutName)}
        w={180}
      />

      {/* Entity-type filter chips */}
      <Group gap={4} wrap="wrap">
        {ENTITY_TYPES.map((type) => {
          const meta = ENTITY_TYPE_META[type];
          return (
            <Chip
              key={type}
              size="xs"
              color={meta.color}
              checked={visibleTypes.has(type)}
              onChange={(checked) => handleChipChange(type, checked)}
            >
              {meta.label}
            </Chip>
          );
        })}
      </Group>

      {/* Search */}
      <TextInput
        size="xs"
        placeholder="Search labels..."
        leftSection={<IconSearch size={12} />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        w={160}
      />

      {/* Stats */}
      <Text size="xs" c="dimmed">
        {entityCount} entities, {relationshipCount} relationships
      </Text>

      {/* Fit button */}
      <Tooltip label="Fit to screen" withArrow>
        <ActionIcon
          variant="default"
          size="sm"
          title="Fit to screen"
          onClick={onFit}
          aria-label="Fit to screen"
        >
          <IconArrowsMaximize size={14} />
        </ActionIcon>
      </Tooltip>

      {/* Export PNG button */}
      <Tooltip label="Export as PNG" withArrow>
        <ActionIcon
          variant="default"
          size="sm"
          title="Export as PNG"
          onClick={onExport}
          aria-label="Export as PNG"
        >
          <IconPhoto size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
