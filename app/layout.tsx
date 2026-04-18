import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorSchemeScript } from "@mantine/core";

import AppShellWrapper from "@/components/AppShellWrapper";
import MantineAppProvider from "@/components/MantineAppProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sleuthgraph",
  description: "OSINT investigation workbench",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineAppProvider>
          <AppShellWrapper>{children}</AppShellWrapper>
        </MantineAppProvider>
      </body>
    </html>
  );
}
