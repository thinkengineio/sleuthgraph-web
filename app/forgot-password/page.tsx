"use client";

import { useState } from "react";
import Link from "next/link";

import { Alert, Anchor, Button, Card, Center, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMail } from "@tabler/icons-react";

import { apiForgotPassword } from "@/lib/api";

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sentForEmail, setSentForEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    initialValues: { email: "" },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address"),
    },
  });

  async function handleSubmit(values: ForgotPasswordFormValues) {
    setSubmitting(true);
    try {
      await apiForgotPassword(values.email);
      setSentForEmail(values.email);
    } catch (err) {
      notifications.show({
        title: "Something went wrong",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Center py="xl" px="md">
      <Card w="100%" maw={460} shadow="md" p="xl">
        <Stack gap="md">
          <Stack gap={4} align="center">
            <Title order={2}>Reset your password</Title>
            <Text size="sm" c="dimmed">
              OSINT investigation workbench
            </Text>
          </Stack>

          {sentForEmail ? (
            <Alert icon={<IconMail size={18} />} color="blue" variant="light">
              If an account exists for <strong>{sentForEmail}</strong>, a reset link has been sent.
              During pre-alpha, check the API server logs for the link (ConsoleEmailSender writes to
              stderr).
            </Alert>
          ) : (
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
                <Button type="submit" fullWidth loading={submitting} mt="xs">
                  Send reset link
                </Button>
              </Stack>
            </form>
          )}

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
