"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { AuthProvider } from "@/lib/AuthContext";
import { theme } from "@/lib/theme";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dropzone/styles.css";

interface MantineAppProviderProps {
  children: React.ReactNode;
}

export default function MantineAppProvider({ children }: MantineAppProviderProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <AuthProvider>{children}</AuthProvider>
    </MantineProvider>
  );
}
