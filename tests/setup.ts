import "@testing-library/jest-dom/vitest";

// Mantine's ScrollArea (used in Modal, Select, etc.) needs ResizeObserver.
// jsdom does not implement it, so we stub it here.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;

// Mantine Combobox tries to call scrollIntoView on list items.
// jsdom does not implement Element.scrollIntoView, so we stub it.
if (typeof window !== "undefined" && typeof window.HTMLElement !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

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
