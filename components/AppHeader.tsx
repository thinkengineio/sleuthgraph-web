"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Anchor, Badge, Button, Group, AppShell, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { useAuth } from "@/lib/AuthContext";

export default function AppHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    notifications.show({
      title: "Signed out",
      message: "You have been logged out.",
      color: "blue",
    });
    router.push("/");
  }

  return (
    <AppShell.Header p="sm">
      <Group justify="space-between" h="100%">
        {/* Wordmark */}
        <Anchor component={Link} href="/" underline="never">
          <Text fw={700} size="lg" c="investigatorBlue.4">
            Sleuthgraph
          </Text>
        </Anchor>

        {/* Right side: auth actions */}
        <Group gap="sm">
          {!loading && user && (
            <>
              <Anchor
                component={Link}
                href="/cases"
                size="sm"
                fw={500}
                c="investigatorBlue.4"
                underline="never"
              >
                Cases
              </Anchor>
              <Badge color="investigatorBlue" variant="light" size="sm">
                {user.email}
              </Badge>
              <Button variant="subtle" color="gray" size="xs" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          )}
          {!loading && !user && (
            <Button component={Link} href="/login" variant="filled" size="xs">
              Sign in
            </Button>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
