import "@testing-library/jest-dom/vitest";

// Mantine uses window.matchMedia for color scheme detection.
// jsdom does not implement it, so we stub it here.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
