"use client";

import { AppShell } from "@mantine/core";

import AppHeader from "@/components/AppHeader";

interface AppShellWrapperProps {
  children: React.ReactNode;
}

export default function AppShellWrapper({ children }: AppShellWrapperProps) {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppHeader />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
