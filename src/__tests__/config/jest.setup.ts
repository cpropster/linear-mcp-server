import { jest } from '@jest/globals';
import type { LinearClient } from '@linear/sdk';
import type { LinearGraphQLClient } from '../../graphql/client';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

/**
 * Approaches to fix TypeScript errors with Jest mocks:
 * 
 * 1. Type Assertion for Mock Function [Failed]
 * - Define specific function signature type
 * - Use type assertion to match Jest's Mock type
 * - Error: Generic type 'Mock' requires between 0 and 1 type arguments
 * 
 * 2. Custom Mock Type [Failed]
 * - Create interface extending LinearClient
 * - Use jest.MockInstance for specific method types
 * - Error: Namespace 'jest' has no exported member 'MockInstance'
 * 
 * 3. Jest's Mocked Utility Type [Trying this approach]
 * - Use jest.Mocked to type the entire client
 * - Pick only needed properties
 * 
 * 4. Simplified Mock Structure [Not tried yet]
 * - Minimal typing in setup
 * - Handle specific types in test files
 */

// Approach 3: Jest's Mocked Utility Type
type MockedGraphQLClient = {
  rawRequest: jest.Mock;
};

type MockedLinearClient = {
  client: MockedGraphQLClient;
};

// Create mock client factory function
const createMockClient = () => ({
  client: {
    rawRequest: jest.fn().mockImplementation(async () => ({ data: {} }))
  },
  viewer: Promise.resolve({ id: 'test-user', name: 'Test User' })
});

// Create mock constructor that creates new instances
const MockLinearClient = jest.fn(function(this: any) {
  return Object.assign(this, createMockClient());
});

// Mock the Linear SDK
jest.mock('@linear/sdk', () => ({
  LinearClient: MockLinearClient
}));

// Export mock for use in tests
export const getMockLinearClient = () => new (MockLinearClient as any)();
