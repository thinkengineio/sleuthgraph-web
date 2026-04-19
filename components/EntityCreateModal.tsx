"use client";

import { useState } from "react";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconPlus, IconX } from "@tabler/icons-react";

import type { EntityRead } from "@/lib/api";
import { createEntity } from "@/lib/api";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/lib/entityTypes";
import type { EntityType } from "@/lib/entityTypes";
import { EntityTypeBadge } from "./EntityTypeBadge";

interface FormValues {
  type: EntityType | "";
  label: string;
  confidence: number;
  attrs: string;
}

interface EntityCreateModalProps {
  caseId: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: (entity: EntityRead) => void;
}

const TYPE_SELECT_DATA = ENTITY_TYPES.map((t) => ({
  value: t,
  label: ENTITY_TYPE_META[t].label,
}));

export function EntityCreateModal({ caseId, opened, onClose, onSuccess }: EntityCreateModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      type: "",
      label: "",
      confidence: 1.0,
      attrs: "",
    },
    validate: {
      type: (v) => (v ? null : "Entity type is required"),
      label: (v) =>
        v.trim().length === 0
          ? "Label is required"
          : v.trim().length > 512
            ? "Label must be 512 characters or fewer"
            : null,
      confidence: (v) => (v < 0 || v > 1 ? "Confidence must be between 0.0 and 1.0" : null),
    },
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  async function handleSubmit(values: FormValues) {
    if (!values.type) return;

    // Validate attrs JSON if provided
    let parsedAttrs: Record<string, unknown> | undefined;
    if (values.attrs.trim()) {
      try {
        parsedAttrs = JSON.parse(values.attrs) as Record<string, unknown>;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "parse error";
        notifications.show({
          title: "Invalid JSON in attrs",
          message: msg,
          color: "red",
          icon: <IconX size={14} />,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const entity = await createEntity(caseId, {
        type: values.type,
        label: values.label.trim(),
        confidence: values.confidence,
        ...(parsedAttrs !== undefined ? { attrs: parsedAttrs } : {}),
      });
      notifications.show({
        title: "Entity created",
        message: `"${entity.label}" added.`,
        color: "green",
        icon: <IconCheck size={14} />,
      });
      handleClose();
      onSuccess(entity);
    } catch (err: unknown) {
      notifications.show({
        title: "Create failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Add Entity" size="md" centered>
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="sm">
          <Select
            label="Type"
            placeholder="Select entity type"
            required
            data={TYPE_SELECT_DATA}
            renderOption={({ option }) => {
              const type = option.value as EntityType;
              return <EntityTypeBadge type={type} />;
            }}
            {...form.getInputProps("type")}
          />

          <TextInput
            label="Label"
            placeholder="e.g. john.doe@example.com"
            required
            maxLength={512}
            {...form.getInputProps("label")}
          />

          <Tooltip
            label="How confident are you this entity is real? 1.0 = certain."
            position="right"
            withArrow
          >
            <NumberInput
              label="Confidence"
              min={0}
              max={1}
              step={0.05}
              decimalScale={2}
              {...form.getInputProps("confidence")}
            />
          </Tooltip>

          <Textarea
            label="Attrs (JSON, optional)"
            placeholder='{"source": "manual", "note": "..."}'
            minRows={3}
            autosize
            maxRows={8}
            ff="monospace"
            {...form.getInputProps("attrs")}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconPlus size={14} />}>
              Add entity
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
