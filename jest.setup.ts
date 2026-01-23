import "@testing-library/jest-dom";

if (!global.structuredClone) {
  global.structuredClone = <T,>(value: T): T => {
    if (value === undefined) {
      return value;
    }
    return JSON.parse(JSON.stringify(value)) as T;
  };
}

if (typeof window !== "undefined") {
  // Mock matchMedia for components relying on prefers-color-scheme.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

if (typeof DOMRect === "undefined") {
  class MockDOMRect {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    top = 0;
    right = 0;
    bottom = 0;
    left = 0;
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = y;
      this.left = x;
      this.right = x + width;
      this.bottom = y + height;
    }
    static fromRect(other?: DOMRectInit) {
      if (!other) {
        return new MockDOMRect();
      }
      return new MockDOMRect(
        other.x ?? 0,
        other.y ?? 0,
        other.width ?? 0,
        other.height ?? 0,
      );
    }
  }

  global.DOMRect = MockDOMRect as unknown as typeof DOMRect;
}

if (typeof IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    root: Element | Document | null = null;
    rootMargin = "";
    thresholds: ReadonlyArray<number> = [];
    constructor(
      _callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.root = options?.root ?? null;
      this.rootMargin = options?.rootMargin ?? "";
      this.thresholds = Array.isArray(options?.threshold)
        ? options?.threshold
        : options?.threshold != null
          ? [options.threshold]
          : [];
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

if (typeof ResizeObserver === "undefined") {
  class MockResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
}

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock next-auth
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
