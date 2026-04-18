"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Anchor,
  Button,
  Card,
  Center,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

import { apiFetch, OidcStatus } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [oidcStatus, setOidcStatus] = useState<OidcStatus | null>(null);

  // Check OIDC availability on mount
  useEffect(() => {
    apiFetch("/auth/oidc-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OidcStatus | null) => setOidcStatus(data))
      .catch(() => setOidcStatus(null));
  }, []);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : "Enter a valid email address"),
      password: (value) => (value.length > 0 ? null : "Password is required"),
    },
  });

  async function handleSubmit(values: LoginFormValues) {
    setSubmitting(true);
    const result = await login(values.email, values.password);
    setSubmitting(false);

    if (result.ok) {
      notifications.show({
        title: "Signed in",
        message: "Welcome back!",
        color: "green",
      });
      router.push("/");
    } else {
      notifications.show({
        title: "Sign in failed",
        message: result.error ?? "Invalid credentials. Check your email and password.",
        color: "red",
      });
    }
  }

  return (
    <Center py="xl" px="md">
      <Card w="100%" maw={420} shadow="md" p="xl">
        <Stack gap="md">
          <Stack gap={4} align="center">
            <Title order={2}>Sign in to Sleuthgraph</Title>
            <Text size="sm" c="dimmed">
              OSINT investigation workbench
            </Text>
          </Stack>

          <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
                {...form.getInputProps("email")}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                autoComplete="current-password"
                required
                {...form.getInputProps("password")}
              />
              <Button type="submit" fullWidth loading={submitting} mt="xs">
                Sign in
              </Button>
            </Stack>
          </form>

          {oidcStatus !== null && (
            <>
              <Divider label="or" labelPosition="center" />
              <Tooltip
                label="SSO sign-in is coming in Phase 2.5"
                withArrow
                position="bottom"
              >
                <Button
                  variant="default"
                  fullWidth
                  disabled
                  aria-disabled="true"
                  aria-label="Sign in with SSO (not yet available)"
                >
                  Sign in with SSO
                </Button>
              </Tooltip>
            </>
          )}

          <Text size="xs" c="dimmed" ta="center">
            <Anchor component={Link} href="/" size="xs">
              Back to home
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}
