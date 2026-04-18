"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArchive,
  IconArrowLeft,
  IconDeviceFloppy,
  IconTrash,
} from "@tabler/icons-react";

import { Case, CaseStatus, deleteCase, getCase, updateCase } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface EditFormValues {
  name: string;
  status: CaseStatus;
  tags: string[];
}

interface CaseDetailContentProps {
  caseId: string;
}

function CaseDetailContent({ caseId }: CaseDetailContentProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<EditFormValues>({
    initialValues: { name: "", status: "active", tags: [] },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : "Case name is required"),
    },
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchCase = async () => {
    setFetching(true);
    setNotFound(false);
    try {
      const data = await getCase(caseId);
      if (data === null) {
        setNotFound(true);
        setCaseData(null);
      } else {
        setCaseData(data);
        form.setValues({
          name: data.name,
          status: data.status,
          tags: data.tags,
        });
      }
    } catch (err: unknown) {
      notifications.show({
        title: "Load failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      // One-shot data fetch on mount; setState inside async effect is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCase();
    }
  }, [authLoading, user, caseId]);

  async function handleSave(values: EditFormValues) {
    if (!caseData) return;
    setSaving(true);
    try {
      const updated = await updateCase(caseData.id, {
        name: values.name.trim(),
        status: values.status,
        tags: values.tags,
      });
      if (updated === null) {
        setNotFound(true);
        return;
      }
      setCaseData(updated);
      form.setValues({
        name: updated.name,
        status: updated.status,
        tags: updated.tags,
      });
      notifications.show({
        title: "Saved",
        message: "Case updated.",
        color: "green",
      });
    } catch (err: unknown) {
      notifications.show({
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleArchive() {
    if (!caseData) return;
    const nextStatus: CaseStatus = caseData.status === "active" ? "archived" : "active";
    setSaving(true);
    try {
      const updated = await updateCase(caseData.id, { status: nextStatus });
      if (updated === null) {
        setNotFound(true);
        return;
      }
      setCaseData(updated);
      form.setFieldValue("status", updated.status);
      notifications.show({
        title: nextStatus === "archived" ? "Case archived" : "Case restored",
        message: `"${updated.name}" is now ${nextStatus}.`,
        color: "blue",
      });
    } catch (err: unknown) {
      notifications.show({
        title: "Action failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!caseData) return;
    if (!window.confirm(`Delete case "${caseData.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCase(caseData.id);
      notifications.show({
        title: "Case deleted",
        message: `"${caseData.name}" has been removed.`,
        color: "orange",
      });
      router.push("/cases");
    } catch (err: unknown) {
      notifications.show({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
      setDeleting(false);
    }
  }

  if (authLoading || fetching) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (!user) return null;

  if (notFound) {
    return (
      <Stack gap="md">
        <Button
          component={Link}
          href="/cases"
          variant="subtle"
          leftSection={<IconArrowLeft size={14} />}
          size="xs"
          w="fit-content"
        >
          Back to cases
        </Button>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Case not found"
          color="red"
          variant="light"
        >
          Case not found or you don&apos;t have access.
        </Alert>
      </Stack>
    );
  }

  if (!caseData) return null;

  return (
    <Stack gap="lg">
      {/* Back nav */}
      <Button
        component={Link}
        href="/cases"
        variant="subtle"
        leftSection={<IconArrowLeft size={14} />}
        size="xs"
        w="fit-content"
        color="gray"
      >
        Back to cases
      </Button>

      {/* Case title + status badge */}
      <Group align="center" gap="sm">
        <Title order={3}>{caseData.name}</Title>
        <Badge color={caseData.status === "active" ? "green" : "gray"} variant="light" size="sm">
          {caseData.status}
        </Badge>
      </Group>

      {/* Edit form */}
      <Card withBorder>
        <form onSubmit={form.onSubmit(handleSave)} noValidate>
          <Stack gap="sm">
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <Select
              label="Status"
              data={[
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ]}
              {...form.getInputProps("status")}
            />
            <TagsInput
              label="Tags"
              placeholder="Add tags (press Enter)"
              {...form.getInputProps("tags")}
            />

            {/* Timestamps */}
            <Group gap="xl" mt="xs">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Created
                </Text>
                <Text size="xs" ff="monospace">
                  {formatTs(caseData.created_at)}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Updated
                </Text>
                <Text size="xs" ff="monospace">
                  {formatTs(caseData.updated_at)}
                </Text>
              </Stack>
            </Group>

            <Group justify="space-between" mt="sm">
              {/* Destructive actions */}
              <Group gap="xs">
                <Button
                  variant="light"
                  color={caseData.status === "active" ? "orange" : "green"}
                  size="xs"
                  leftSection={<IconArchive size={13} />}
                  loading={saving}
                  onClick={handleToggleArchive}
                  type="button"
                >
                  {caseData.status === "active" ? "Archive" : "Unarchive"}
                </Button>
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={13} />}
                  loading={deleting}
                  onClick={handleDelete}
                  type="button"
                >
                  Delete
                </Button>
              </Group>

              {/* Save */}
              <Button
                type="submit"
                size="sm"
                loading={saving}
                leftSection={<IconDeviceFloppy size={14} />}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {/* Entities placeholder */}
      <Card withBorder>
        <Stack gap="xs">
          <Group align="center" gap="xs">
            <Title order={5} c="dimmed">
              Entities (0)
            </Title>
            <Badge color="gray" variant="dot" size="sm">
              coming next
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Entity graph — coming in the next frontend task.
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}

/**
 * Next.js 16 page component: params is a Promise in Client Components.
 * We use React.use() to unwrap it, then delegate to CaseDetailContent
 * which holds all the state and effects.
 */
export default function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  return <CaseDetailContent caseId={caseId} />;
}

// Export the inner component for unit testing without the params Promise
export { CaseDetailContent };
