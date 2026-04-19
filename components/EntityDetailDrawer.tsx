"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconDeviceFloppy, IconPencil, IconTrash, IconX } from "@tabler/icons-react";

import type { EntityRead } from "@/lib/api";
import { deleteEntity, updateEntity } from "@/lib/api";
import { formatTs } from "@/lib/format";
import { EntityTypeBadge } from "./EntityTypeBadge";

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      {children}
    </Stack>
  );
}

interface EditFormValues {
  label: string;
  confidence: number;
  attrs: string;
}

interface EntityDetailDrawerProps {
  entity: EntityRead | null;
  opened: boolean;
  onClose: () => void;
  onUpdated: (entity: EntityRead) => void;
  onDeleted: (entityId: string) => void;
}

export function EntityDetailDrawer({
  entity,
  opened,
  onClose,
  onUpdated,
  onDeleted,
}: EntityDetailDrawerProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<EditFormValues>({
    initialValues: {
      label: "",
      confidence: 1.0,
      attrs: "",
    },
    validate: {
      label: (v) =>
        v.trim().length === 0
          ? "Label is required"
          : v.trim().length > 512
            ? "Label must be 512 characters or fewer"
            : null,
      confidence: (v) => (v < 0 || v > 1 ? "Confidence must be between 0.0 and 1.0" : null),
    },
  });

  function enterEdit() {
    if (!entity) return;
    form.setValues({
      label: entity.label,
      confidence: entity.confidence,
      attrs: entity.attrs && Object.keys(entity.attrs).length > 0
        ? JSON.stringify(entity.attrs, null, 2)
        : "",
    });
    setEditMode(true);
  }

  function cancelEdit() {
    form.reset();
    setEditMode(false);
  }

  async function handleSave(values: EditFormValues) {
    if (!entity) return;

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

    setSaving(true);
    try {
      const updated = await updateEntity(entity.case_id, entity.id, {
        label: values.label.trim(),
        confidence: values.confidence,
        ...(parsedAttrs !== undefined ? { attrs: parsedAttrs } : {}),
      });
      if (updated === null) {
        notifications.show({
          title: "Not found",
          message: "Entity not found or access denied.",
          color: "orange",
        });
        onClose();
        return;
      }
      notifications.show({
        title: "Saved",
        message: `"${updated.label}" updated.`,
        color: "green",
        icon: <IconCheck size={14} />,
      });
      setEditMode(false);
      onUpdated(updated);
    } catch (err: unknown) {
      notifications.show({
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entity) return;
    if (!window.confirm(`Delete entity "${entity.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteEntity(entity.case_id, entity.id);
      notifications.show({
        title: "Entity deleted",
        message: `"${entity.label}" has been removed.`,
        color: "orange",
      });
      onDeleted(entity.id);
      onClose();
    } catch (err: unknown) {
      notifications.show({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
      setDeleting(false);
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        cancelEdit();
        onClose();
      }}
      title="Entity Detail"
      position="right"
      size="md"
      padding="md"
    >
      {entity && (
        <Stack gap="md">
          {/* Type + edit toggle */}
          <Group justify="space-between" align="flex-start">
            <EntityTypeBadge type={entity.type} size="md" />
            {!editMode && (
              <Button
                size="xs"
                variant="subtle"
                leftSection={<IconPencil size={13} />}
                onClick={enterEdit}
              >
                Edit
              </Button>
            )}
          </Group>

          <Divider />

          {/* ID */}
          <DetailRow label="Entity ID">
            <Text ff="monospace" size="xs" style={{ wordBreak: "break-all" }}>
              {entity.id}
            </Text>
          </DetailRow>

          {/* Label */}
          {editMode ? (
            <form onSubmit={form.onSubmit(handleSave)} noValidate>
              <Stack gap="sm">
                <TextInput
                  label="Label"
                  required
                  maxLength={512}
                  {...form.getInputProps("label")}
                />
                <NumberInput
                  label="Confidence"
                  min={0}
                  max={1}
                  step={0.05}
                  decimalScale={2}
                  {...form.getInputProps("confidence")}
                />
                <Textarea
                  label="Attrs (JSON, optional)"
                  minRows={3}
                  autosize
                  maxRows={8}
                  ff="monospace"
                  {...form.getInputProps("attrs")}
                />
                <Group justify="flex-end" gap="xs">
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    loading={saving}
                    leftSection={<IconDeviceFloppy size={13} />}
                  >
                    Save
                  </Button>
                </Group>
              </Stack>
            </form>
          ) : (
            <>
              <DetailRow label="Label">
                <Text size="sm">{entity.label}</Text>
              </DetailRow>

              <DetailRow label="Confidence">
                <Text size="sm" ff="monospace">
                  {entity.confidence.toFixed(2)}
                </Text>
              </DetailRow>

              {/* Timestamps */}
              <Group grow>
                <DetailRow label="Created">
                  <Text size="xs" ff="monospace" c="dimmed">
                    {formatTs(entity.created_at)}
                  </Text>
                </DetailRow>
                <DetailRow label="Updated">
                  <Text size="xs" ff="monospace" c="dimmed">
                    {formatTs(entity.updated_at)}
                  </Text>
                </DetailRow>
              </Group>

              {/* Attrs */}
              <DetailRow label="Attrs">
                <Box
                  p="xs"
                  style={{
                    background: "var(--mantine-color-dark-7)",
                    borderRadius: "var(--mantine-radius-sm)",
                    border: "1px solid var(--mantine-color-dark-5)",
                    overflowX: "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--mantine-font-family-monospace)",
                      fontSize: "0.75rem",
                      color: "var(--mantine-color-gray-3)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {Object.keys(entity.attrs).length > 0
                      ? JSON.stringify(entity.attrs, null, 2)
                      : "{}"}
                  </pre>
                </Box>
              </DetailRow>
            </>
          )}

          <Divider />

          {/* Delete */}
          <Button
            variant="light"
            color="red"
            size="sm"
            fullWidth
            leftSection={<IconTrash size={14} />}
            loading={deleting}
            onClick={handleDelete}
          >
            Delete entity
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}
