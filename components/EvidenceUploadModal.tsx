"use client";

import { useState } from "react";

import { Button, Group, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCloudUpload, IconFile, IconX } from "@tabler/icons-react";

import { uploadEvidence } from "@/lib/api";

interface FormValues {
  query: string;
  source_plugin: string;
  reproducibility_spec: string;
}

interface EvidenceUploadModalProps {
  caseId: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EvidenceUploadModal({
  caseId,
  opened,
  onClose,
  onSuccess,
}: EvidenceUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      query: "",
      source_plugin: "manual",
      reproducibility_spec: "",
    },
    validate: {
      query: (v) => (v.trim().length > 0 ? null : "Query / description is required"),
    },
  });

  function handleClose() {
    form.reset();
    setFile(null);
    onClose();
  }

  async function handleSubmit(values: FormValues) {
    if (!file) {
      notifications.show({
        title: "No file selected",
        message: "Drop or select a file before submitting.",
        color: "orange",
      });
      return;
    }

    // Validate reproducibility_spec JSON if provided
    let parsedSpec: Record<string, unknown> | undefined;
    if (values.reproducibility_spec.trim()) {
      try {
        parsedSpec = JSON.parse(values.reproducibility_spec) as Record<string, unknown>;
      } catch {
        notifications.show({
          title: "Invalid JSON",
          message: "Reproducibility spec must be valid JSON.",
          color: "red",
          icon: <IconX size={14} />,
        });
        return;
      }
    }

    setLoading(true);
    try {
      await uploadEvidence(caseId, file, {
        query: values.query.trim(),
        source_plugin: values.source_plugin.trim() || "manual",
        ...(parsedSpec !== undefined ? { reproducibility_spec: parsedSpec } : {}),
      });
      notifications.show({
        title: "Evidence captured",
        message: `"${file.name}" uploaded successfully.`,
        color: "green",
        icon: <IconCheck size={14} />,
      });
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      notifications.show({
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
        icon: <IconX size={14} />,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Upload Evidence" size="md" centered>
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="sm">
          {/* Drop zone */}
          <Dropzone
            onDrop={(files) => setFile(files[0] ?? null)}
            maxSize={50 * 1024 * 1024}
            onReject={() => {
              notifications.show({
                title: "File rejected",
                message: "File may exceed the 50 MiB limit.",
                color: "orange",
              });
            }}
          >
            <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: "none" }}>
              <Dropzone.Accept>
                <IconCloudUpload size={40} color="var(--mantine-color-blue-6)" />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={40} color="var(--mantine-color-red-6)" />
              </Dropzone.Reject>
              <Dropzone.Idle>
                {file ? (
                  <Group gap="xs">
                    <IconFile size={24} color="var(--mantine-color-blue-4)" />
                    <Text size="sm" c="blue.4">
                      {file.name}
                    </Text>
                  </Group>
                ) : (
                  <Stack gap={4} align="center">
                    <IconCloudUpload size={32} color="var(--mantine-color-dimmed)" />
                    <Text size="sm" c="dimmed">
                      Drag a file here or click to browse
                    </Text>
                    <Text size="xs" c="dimmed">
                      Max 50 MiB
                    </Text>
                  </Stack>
                )}
              </Dropzone.Idle>
            </Group>
          </Dropzone>

          <TextInput
            label="Query / description"
            placeholder="What does this evidence capture?"
            required
            {...form.getInputProps("query")}
          />

          <TextInput
            label="Source plugin"
            placeholder="manual"
            {...form.getInputProps("source_plugin")}
          />

          <Textarea
            label="Reproducibility spec (JSON, optional)"
            placeholder='{"tool": "nmap", "args": "-sV -p 443"}'
            minRows={3}
            autosize
            maxRows={8}
            ff="monospace"
            {...form.getInputProps("reproducibility_spec")}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconCloudUpload size={14} />}>
              Upload
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
