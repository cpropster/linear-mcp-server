import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LinearAuth } from '../auth';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('LinearAuth', () => {
  let auth: LinearAuth;

  beforeEach(() => {
    auth = new LinearAuth();
  });

  describe('initialize', () => {
    it('should initialize with valid OAuth credentials', () => {
      expect(() => {
        auth.initialize({
          type: 'oauth',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback'
        });
      }).not.toThrow();
    });

    it('should initialize with valid Personal Access Token', () => {
      expect(() => {
        auth.initialize({
          type: 'pat',
          accessToken: 'test-access-token'
        });
      }).not.toThrow();

      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.needsTokenRefresh()).toBe(false);
    });

    it('should throw error when missing required OAuth parameters', () => {
      expect(() => {
        auth.initialize({
          type: 'oauth',
          clientId: 'test-client-id',
          // Missing clientSecret and redirectUri
        } as any);
      }).toThrow();
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return valid authorization URL with OAuth config', () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      const url = auth.getAuthorizationUrl();
      expect(url).toContain('https://linear.app/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
    });

    it('should throw error when called with PAT config', () => {
      auth.initialize({
        type: 'pat',
        accessToken: 'test-access-token'
      });

      expect(() => {
        auth.getAuthorizationUrl();
      }).toThrow();
    });

    it('should throw error when called before initialization', () => {
      expect(() => {
        auth.getAuthorizationUrl();
      }).toThrow();
    });
  });

  describe('handleCallback', () => {
    it('should handle valid authorization code with OAuth config', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Mock the token exchange
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600
        }),
        { status: 200 }
      ));

      await expect(auth.handleCallback('valid-code')).resolves.not.toThrow();
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('should throw error when called with PAT config', async () => {
      auth.initialize({
        type: 'pat',
        accessToken: 'test-access-token'
      });

      await expect(auth.handleCallback('valid-code')).rejects.toThrow();
    });

    it('should throw error for invalid authorization code', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Mock failed token exchange
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          error: 'invalid_grant'
        }),
        { status: 400 }
      ));

      await expect(auth.handleCallback('invalid-code')).rejects.toThrow();
    });
  });

  describe('needsTokenRefresh', () => {
    it('should return true when OAuth token is expired', () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set expired token
      auth.setTokenData({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000
      });

      expect(auth.needsTokenRefresh()).toBe(true);
    });

    it('should return false for valid OAuth token', () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set valid token
      auth.setTokenData({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      });

      expect(auth.needsTokenRefresh()).toBe(false);
    });

    it('should return false for PAT', () => {
      auth.initialize({
        type: 'pat',
        accessToken: 'test-access-token'
      });

      expect(auth.needsTokenRefresh()).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh OAuth token', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set initial token data
      auth.setTokenData({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000 // Expired
      });

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }),
        { status: 200 }
      ));

      await expect(auth.refreshAccessToken()).resolves.not.toThrow();
    });

    it('should throw error when refresh fails', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set initial token data
      auth.setTokenData({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000 // Expired
      });

      // Mock failed token refresh
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          error: 'invalid_grant'
        }),
        { status: 400 }
      ));

      await expect(auth.refreshAccessToken()).rejects.toThrow();
    });

    it('should throw error when called with PAT config', async () => {
      auth.initialize({
        type: 'pat',
        accessToken: 'test-access-token'
      });

      await expect(auth.refreshAccessToken()).rejects.toThrow();
    });
  });
});
