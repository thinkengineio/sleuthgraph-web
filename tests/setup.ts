import "@testing-library/jest-dom/vitest";

// Mantine's ScrollArea (used in Modal, Select, etc.) needs ResizeObserver.
// jsdom does not implement it, so we stub it here.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;

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
