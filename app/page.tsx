"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSearch, IconLogout } from "@tabler/icons-react";

import HealthBadge from "@/components/HealthBadge";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    notifications.show({
      title: "Signed out",
      message: "You have been logged out.",
      color: "blue",
    });
    router.refresh();
  }

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg">
        <Title order={1} ta="center">
          Sleuthgraph
        </Title>
        <Text size="md" c="dimmed" ta="center">
          OSINT investigation workbench &middot; pre-alpha
        </Text>

        <HealthBadge />

        {!loading && !user && (
          <Stack align="center" gap="sm">
            <Text size="sm" c="dimmed">
              Sign in to start investigating.
            </Text>
            <Button
              component={Link}
              href="/login"
              leftSection={<IconSearch size={16} />}
              variant="filled"
            >
              Sign in
            </Button>
          </Stack>
        )}

        {!loading && user && (
          <Stack align="center" gap="sm">
            <Text size="sm" fw={500}>
              Welcome, {user.email}
            </Text>
            <Group gap="sm">
              <Button
                component={Link}
                href="/cases"
                variant="light"
                leftSection={<IconSearch size={16} />}
              >
                Go to Cases
              </Button>
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </Group>
          </Stack>
        )}

        <Text size="xs" c="dimmed">
          See{" "}
          <Text
            component="a"
            href="https://github.com/francose/sleuthgraph"
            target="_blank"
            rel="noopener"
            size="xs"
            c="investigatorBlue.4"
          >
            github.com/francose/sleuthgraph
          </Text>{" "}
          for docs.
        </Text>
      </Stack>
    </Container>
  );
}
