// Simple Prisma mock for testing
export const mockPrismaUser = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaBook = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaAuthor = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaGenre = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaFormat = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaGender = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaNationality = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

type MockDb = {
  user: typeof mockPrismaUser;
  book: typeof mockPrismaBook;
  author: typeof mockPrismaAuthor;
  genre: typeof mockPrismaGenre;
  format: typeof mockPrismaFormat;
  gender: typeof mockPrismaGender;
  nationality: typeof mockPrismaNationality;
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
};

export const db: MockDb = {
  user: mockPrismaUser,
  book: mockPrismaBook,
  author: mockPrismaAuthor,
  genre: mockPrismaGenre,
  format: mockPrismaFormat,
  gender: mockPrismaGender,
  nationality: mockPrismaNationality,
  $transaction: jest.fn((callback: (db: MockDb) => unknown) => callback(db)),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

export const resetAllMocks = () => {
  Object.values(mockPrismaUser).forEach((fn) => fn.mockReset());
  Object.values(mockPrismaBook).forEach((fn) => fn.mockReset());
  Object.values(mockPrismaAuthor).forEach((fn) => fn.mockReset());
  Object.values(mockPrismaGenre).forEach((fn) => fn.mockReset());
  Object.values(mockPrismaFormat).forEach((fn) => fn.mockReset());
  Object.values(mockPrismaGender).forEach((fn) => fn.mockReset());
  Object.values(mockPrismaNationality).forEach((fn) => fn.mockReset());
};
