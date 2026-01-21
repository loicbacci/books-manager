import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { ChakraProvider } from "@/components/providers/chakra-provider";

// Mock providers wrapper for testing
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <ChakraProvider>{children}</ChakraProvider>;
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  hashedPassword: "$2a$12$hashedpassword",
  image: null,
  locale: "en",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockBook = (overrides = {}) => ({
  id: "test-book-id",
  userId: "test-user-id",
  title: "Test Book",
  coverUrl: null,
  status: "TO_READ" as const,
  totalPages: 300,
  currentPage: 0,
  rating: null,
  summary: null,
  favoriteQuote: null,
  favoriteMoment: null,
  startDate: null,
  endDate: null,
  isWishlist: false,
  formatId: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockAuthor = (overrides = {}) => ({
  id: "test-author-id",
  userId: "test-user-id",
  name: "Test Author",
  genderId: null,
  nationalityId: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockGenre = (overrides = {}) => ({
  id: "test-genre-id",
  userId: "test-user-id",
  name: "Fiction",
  color: "#3B82F6",
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockFormat = (overrides = {}) => ({
  id: "test-format-id",
  userId: "test-user-id",
  name: "Book",
  icon: "book",
  isDefault: true,
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockGender = (overrides = {}) => ({
  id: "test-gender-id",
  userId: "test-user-id",
  name: "Woman",
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockNationality = (overrides = {}) => ({
  id: "test-nationality-id",
  userId: "test-user-id",
  name: "French",
  code: "FR",
  createdAt: new Date("2024-01-01"),
  ...overrides,
});
