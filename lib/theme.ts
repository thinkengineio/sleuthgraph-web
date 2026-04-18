import { createTheme, MantineColorsTuple } from "@mantine/core";

// Investigator blue — used for primary actions and links
const investigatorBlue: MantineColorsTuple = [
  "#e5f0ff",
  "#cfe1ff",
  "#9bbeff",
  "#629aff",
  "#357bff",
  "#1868ff",
  "#005fff",
  "#004fe0",
  "#0045c9",
  "#003ab2",
];

// Amber — used for warnings and highlights
const amber: MantineColorsTuple = [
  "#fff8e1",
  "#ffedcc",
  "#ffd89b",
  "#ffc267",
  "#ffae3d",
  "#ffa325",
  "#ff9d18",
  "#e3880b",
  "#ca7902",
  "#ae6900",
];

export const theme = createTheme({
  primaryColor: "investigatorBlue",
  colors: {
    investigatorBlue,
    amber,
  },
  defaultColorScheme: "dark",
  fontFamily:
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  fontFamilyMonospace:
    "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  },
  radius: {
    default: "sm",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "sm",
      },
    },
    Card: {
      defaultProps: {
        radius: "md",
        withBorder: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: "sm",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "sm",
      },
    },
  },
});
