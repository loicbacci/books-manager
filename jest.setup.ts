import "@testing-library/jest-dom";

if (!global.structuredClone) {
  global.structuredClone = <T,>(value: T): T => {
    if (value === undefined) {
      return value;
    }
    return JSON.parse(JSON.stringify(value)) as T;
  };
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
