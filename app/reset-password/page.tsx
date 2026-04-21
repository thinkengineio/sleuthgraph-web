"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle } from "@tabler/icons-react";

import { apiResetPassword } from "@/lib/api";

interface ResetPasswordFormValues {
  password: string;
  confirm: string;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (v) => (v.length >= 8 ? null : "Password must be at least 8 characters"),
      confirm: (v, values) => (v === values.password ? null : "Passwords do not match"),
    },
  });

  async function handleSubmit(values: ResetPasswordFormValues) {
    if (!token) return;
    setSubmitting(true);
    try {
      await apiResetPassword(token, values.password);
      notifications.show({
        title: "Password reset",
        message: "Sign in with your new password.",
        color: "green",
      });
      router.push("/login");
    } catch (err) {
      notifications.show({
        title: "Reset failed",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Center py="xl" px="md">
        <Card w="100%" maw={460} shadow="md" p="xl">
          <Stack gap="md">
            <Stack gap={4} align="center">
              <Title order={2}>Missing reset link</Title>
              <Text size="sm" c="dimmed">
                OSINT investigation workbench
              </Text>
            </Stack>
            <Alert icon={<IconAlertTriangle size={18} />} color="red" variant="light">
              No reset token found in this URL. Please use the link from your password-reset email.
            </Alert>
            <Text size="xs" c="dimmed" ta="center">
              <Anchor component={Link} href="/forgot-password" size="xs">
                Request a new link
              </Anchor>
            </Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Center py="xl" px="md">
      <Card w="100%" maw={460} shadow="md" p="xl">
        <Stack gap="md">
          <Stack gap={4} align="center">
            <Title order={2}>Set a new password</Title>
            <Text size="sm" c="dimmed">
              OSINT investigation workbench
            </Text>
          </Stack>

          <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
            <Stack gap="sm">
              <PasswordInput
                label="New password"
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
                Update password
              </Button>
            </Stack>
          </form>

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

export default function ResetPasswordPage() {
  // useSearchParams must be under a Suspense boundary in Next.js 16 App Router.
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
