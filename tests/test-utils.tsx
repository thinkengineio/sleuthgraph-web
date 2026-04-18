import { render, RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import React from "react";

import { theme } from "@/lib/theme";

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {children}
    </MantineProvider>
  );
}

function renderWithMantine(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export { renderWithMantine };
export * from "@testing-library/react";
