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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLink, IconX } from "@tabler/icons-react";

import type { EntityRead, RelationshipRead } from "@/lib/api";
import { createRelationship } from "@/lib/api";
import { ENTITY_TYPE_META, RELATIONSHIP_TYPES } from "@/lib/entityTypes";
import type { RelationshipType } from "@/lib/entityTypes";

interface FormValues {
  src_entity_id: string;
  dst_entity_id: string;
  rel_type: RelationshipType | "";
  confidence: number;
  source_plugin: string;
  attrs: string;
}

interface RelationshipCreateModalProps {
  caseId: string;
  entities: EntityRead[];
  opened: boolean;
  onClose: () => void;
  onSuccess: (rel: RelationshipRead) => void;
}

const REL_TYPE_DATA = RELATIONSHIP_TYPES.map((t) => ({ value: t, label: t }));

export function RelationshipCreateModal({
  caseId,
  entities,
  opened,
  onClose,
  onSuccess,
}: RelationshipCreateModalProps) {
  const [loading, setLoading] = useState(false);

  const entitySelectData = entities.map((e) => ({
    value: e.id,
    label: `${ENTITY_TYPE_META[e.type].label}: ${e.label}`,
  }));

  const form = useForm<FormValues>({
    initialValues: {
      src_entity_id: "",
      dst_entity_id: "",
      rel_type: "",
      confidence: 1.0,
      source_plugin: "",
      attrs: "",
    },
    validate: {
      src_entity_id: (v) => (v ? null : "Source entity is required"),
      dst_entity_id: (v, values) => {
        if (!v) return "Destination entity is required";
        if (v === values.src_entity_id) return "Source and destination must be different entities";
        return null;
      },
      rel_type: (v) => (v ? null : "Relationship type is required"),
      confidence: (v) => (v < 0 || v > 1 ? "Confidence must be between 0.0 and 1.0" : null),
    },
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  async function handleSubmit(values: FormValues) {
    if (!values.rel_type) return;

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
      const rel = await createRelationship(caseId, {
        src_entity_id: values.src_entity_id,
        dst_entity_id: values.dst_entity_id,
        rel_type: values.rel_type,
        confidence: values.confidence,
        ...(values.source_plugin.trim() ? { source_plugin: values.source_plugin.trim() } : {}),
        ...(parsedAttrs !== undefined ? { attrs: parsedAttrs } : {}),
      });
      notifications.show({
        title: "Relationship created",
        message: `${rel.rel_type} link added.`,
        color: "green",
        icon: <IconCheck size={14} />,
      });
      handleClose();
      onSuccess(rel);
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
    <Modal opened={opened} onClose={handleClose} title="Create Relationship" size="md" centered>
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="sm">
          <Select
            label="Source entity"
            placeholder="Search entities…"
            searchable
            required
            data={entitySelectData}
            {...form.getInputProps("src_entity_id")}
          />

          <Select
            label="Destination entity"
            placeholder="Search entities…"
            searchable
            required
            data={entitySelectData}
            {...form.getInputProps("dst_entity_id")}
          />

          <Select
            label="Relationship type"
            placeholder="Select type"
            required
            data={REL_TYPE_DATA}
            {...form.getInputProps("rel_type")}
          />

          <NumberInput
            label="Confidence"
            min={0}
            max={1}
            step={0.05}
            decimalScale={2}
            {...form.getInputProps("confidence")}
          />

          <TextInput
            label="Source plugin (optional)"
            placeholder="e.g. passive-dns"
            {...form.getInputProps("source_plugin")}
          />

          <Textarea
            label="Attrs (JSON, optional)"
            placeholder='{"note": "..."}'
            minRows={3}
            autosize
            maxRows={6}
            ff="monospace"
            {...form.getInputProps("attrs")}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconLink size={14} />}>
              Create relationship
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
