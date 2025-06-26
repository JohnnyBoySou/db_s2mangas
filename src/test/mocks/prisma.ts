export const prismaMock = {
  manga: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  category: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  collection: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  review: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  view: {
    create: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  mangaTranslation: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn()
  },
  libraryEntry: {
    create: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn()
  },
  $transaction: jest.fn(),
  $executeRaw: jest.fn()
};

// Mock do módulo prisma/client
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock
}));