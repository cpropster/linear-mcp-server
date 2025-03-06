/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|js)x?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testRegex: '(/__tests__/(?!config/).*(test|spec))\\.(ts|js)$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '\\.d\\.ts$',
    '/__tests__/config/'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/config/jest.setup.ts'],
  setupFiles: ['dotenv/config'], // Load .env file before tests
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  resetMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*'
  ]
};
