"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArchive, IconFolder, IconFolderOpen, IconPlus, IconTrash } from "@tabler/icons-react";

import { Case, CaseCreate, createCase, deleteCase, listCases, updateCase } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { formatTs } from "@/lib/format";

interface CreateFormValues {
  name: string;
  tags: string[];
}

export default function CasesListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cases, setCases] = useState<Case[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateFormValues>({
    initialValues: { name: "", tags: [] },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : "Case name is required"),
    },
  });

  // Auth guard — redirect to /login if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchCases = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const data = await listCases();
      setCases(data);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      // One-shot data fetch on mount; setState inside async effect is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCases();
    }
  }, [authLoading, user]);

  async function handleCreate(values: CreateFormValues) {
    setSubmitting(true);
    const payload: CaseCreate = {
      name: values.name.trim(),
      ...(values.tags.length > 0 ? { tags: values.tags } : {}),
    };
    try {
      await createCase(payload);
      notifications.show({
        title: "Case created",
        message: `"${payload.name}" is ready.`,
        color: "green",
      });
      setModalOpen(false);
      form.reset();
      await fetchCases();
    } catch (err: unknown) {
      notifications.show({
        title: "Create failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(c: Case) {
    const nextStatus = c.status === "active" ? "archived" : "active";
    try {
      await updateCase(c.id, { status: nextStatus });
      notifications.show({
        title: nextStatus === "archived" ? "Case archived" : "Case restored",
        message: `"${c.name}" is now ${nextStatus}.`,
        color: "blue",
      });
      await fetchCases();
    } catch (err: unknown) {
      notifications.show({
        title: "Action failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    }
  }

  async function handleDelete(c: Case) {
    if (!window.confirm(`Delete case "${c.name}"? This cannot be undone.`)) return;
    try {
      await deleteCase(c.id);
      notifications.show({
        title: "Case deleted",
        message: `"${c.name}" has been removed.`,
        color: "orange",
      });
      await fetchCases();
    } catch (err: unknown) {
      notifications.show({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    }
  }

  if (authLoading) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* Create modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          form.reset();
        }}
        title="New case"
        centered
      >
        <form onSubmit={form.onSubmit(handleCreate)} noValidate>
          <Stack gap="sm">
            <TextInput
              label="Name"
              placeholder="e.g. Operation Lighthouse"
              required
              {...form.getInputProps("name")}
            />
            <TagsInput
              label="Tags"
              placeholder="Add tags (press Enter)"
              {...form.getInputProps("tags")}
            />
            <Group justify="flex-end" mt="xs">
              <Button
                variant="default"
                onClick={() => {
                  setModalOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} leftSection={<IconPlus size={14} />}>
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Page header */}
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Cases</Title>
          <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => setModalOpen(true)}>
            New case
          </Button>
        </Group>

        {/* Loading */}
        {fetching && (
          <Center h={120}>
            <Loader size="sm" />
          </Center>
        )}

        {/* Error */}
        {!fetching && fetchError && (
          <Paper p="md" withBorder c="red">
            <Text size="sm">{fetchError}</Text>
          </Paper>
        )}

        {/* Empty state */}
        {!fetching && !fetchError && cases.length === 0 && (
          <Center h={240}>
            <Stack align="center" gap="xs">
              <IconFolder size={40} color="var(--mantine-color-dimmed)" />
              <Text size="sm" c="dimmed" fw={500}>
                No cases yet
              </Text>
              <Text size="xs" c="dimmed">
                Create one to start an investigation.
              </Text>
              <Button
                size="xs"
                leftSection={<IconPlus size={13} />}
                mt="xs"
                onClick={() => setModalOpen(true)}
              >
                Create your first case
              </Button>
            </Stack>
          </Center>
        )}

        {/* Cases table */}
        {!fetching && !fetchError && cases.length > 0 && (
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Tags</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {cases.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text
                        component={Link}
                        href={`/cases/${c.id}`}
                        size="sm"
                        fw={500}
                        c="investigatorBlue.4"
                        style={{ textDecoration: "none" }}
                      >
                        {c.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={c.status === "active" ? "green" : "gray"}
                        variant="light"
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="wrap">
                        {c.tags.map((tag) => (
                          <Badge key={tag} variant="outline" size="xs" color="investigatorBlue">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" ff="monospace" c="dimmed">
                        {formatTs(c.created_at)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          component={Link}
                          href={`/cases/${c.id}`}
                          variant="subtle"
                          color="investigatorBlue"
                          size="sm"
                          aria-label="Open case"
                        >
                          <IconFolderOpen size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color={c.status === "active" ? "orange" : "green"}
                          size="sm"
                          aria-label={c.status === "active" ? "Archive case" : "Restore case"}
                          onClick={() => handleArchive(c)}
                        >
                          <IconArchive size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          aria-label="Delete case"
                          onClick={() => handleDelete(c)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </>
  );
}
