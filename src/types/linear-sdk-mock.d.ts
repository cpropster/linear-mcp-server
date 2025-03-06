import { jest } from '@jest/globals';

declare module '@linear/sdk' {
  interface LinearClient {
    client: {
      rawRequest: jest.Mock<Promise<any>, [string, Record<string, unknown>?]>
    };
  }
}
