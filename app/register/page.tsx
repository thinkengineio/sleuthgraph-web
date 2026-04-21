"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";

import { apiRegister, AuthConfig, getAuthConfig } from "@/lib/api";

interface RegisterFormValues {
  email: string;
  password: string;
  confirm: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAuthConfig()
      .then((c) => setConfig(c))
      .catch(() => setConfig(null))
      .finally(() => setConfigLoading(false));
  }, []);

  const form = useForm<RegisterFormValues>({
    initialValues: { email: "", password: "", confirm: "", name: "" },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address"),
      password: (v) => (v.length >= 8 ? null : "Password must be at least 8 characters"),
      confirm: (v, values) => (v === values.password ? null : "Passwords do not match"),
    },
  });

  async function handleSubmit(values: RegisterFormValues) {
    setSubmitting(true);
    try {
      await apiRegister(values.email, values.password, values.name.trim() || undefined);
      notifications.show({
        title: "Account created",
        message: "Sign in with your new credentials.",
        color: "green",
      });
      router.push("/login");
    } catch (err) {
      notifications.show({
        title: "Registration failed",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (configLoading) {
    return null;
  }

  if (config && !config.signup_enabled) {
    return (
      <Center py="xl" px="md">
        <Card w="100%" maw={420} shadow="md" p="xl">
          <Stack gap="md">
            <Stack gap={4} align="center">
              <Title order={2}>Registration disabled</Title>
              <Text size="sm" c="dimmed">
                OSINT investigation workbench
              </Text>
            </Stack>
            <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
              Self-signup is turned off on this Sleuthgraph instance. Contact your administrator to
              request an account.
            </Alert>
            <Text size="xs" c="dimmed" ta="center">
              <Anchor component={Link} href="/login" size="xs">
                Back to sign in
              </Anchor>
            </Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Center py="xl" px="md">
      <Card w="100%" maw={420} shadow="md" p="xl">
        <Stack gap="md">
          <Stack gap={4} align="center">
            <Title order={2}>Create your account</Title>
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
              <TextInput
                label="Name"
                placeholder="Display name (optional)"
                autoComplete="name"
                {...form.getInputProps("name")}
              />
              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                {...form.getInputProps("password")}
              />
              <PasswordInput
                label="Confirm password"
                placeholder="Repeat the password"
                autoComplete="new-password"
                required
                {...form.getInputProps("confirm")}
              />
              <Button type="submit" fullWidth loading={submitting} mt="xs">
                Create account
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Already have an account?{" "}
            <Anchor component={Link} href="/login" size="xs">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}
