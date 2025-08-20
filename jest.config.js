module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/prisma/client$': '<rootDir>/src/prisma/client',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  collectCoverageFrom: [
    'src/modules/**/routers/**/*.{ts,tsx}',
    'src/modules/**/handlers/**/*.{ts,tsx}',
    'src/modules/**/controllers/**/*.{ts,tsx}',
    'src/middlewares/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 0,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};