import { describe, it, expect, beforeAll } from '@jest/globals';
import { LinearAuth } from '../auth';
import { LinearClient } from '@linear/sdk';

// Skip tests if no credentials are configured
const hasPatCredentials = process.env.LINEAR_ACCESS_TOKEN;
const hasOAuthCredentials = process.env.LINEAR_CLIENT_ID && 
                          process.env.LINEAR_CLIENT_SECRET && 
                          process.env.LINEAR_REDIRECT_URI;

// Only run integration tests when credentials are available
(hasPatCredentials || hasOAuthCredentials ? describe : describe.skip)('LinearAuth Integration', () => {
  
  // PAT Authentication Tests
  (hasPatCredentials ? describe : describe.skip)('Personal Access Token Authentication', () => {
    let auth: LinearAuth;

    beforeAll(() => {
      auth = new LinearAuth();
      auth.initialize({
        type: 'pat',
        accessToken: process.env.LINEAR_ACCESS_TOKEN!
      });
    });

    it('should authenticate with PAT', () => {
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.needsTokenRefresh()).toBe(false);
    });

    it('should make authenticated requests with PAT', async () => {
      const client = auth.getClient();
      expect(client).toBeInstanceOf(LinearClient);
      
      // Try to fetch viewer info to verify token works
      const viewer = await client.viewer;
      expect(viewer).toBeDefined();
      expect(viewer.id).toBeDefined();
    });
  });

  // OAuth Authentication Tests
  (hasOAuthCredentials ? describe : describe.skip)('OAuth Flow', () => {
    let auth: LinearAuth;

    beforeAll(() => {
      auth = new LinearAuth();
      auth.initialize({
        type: 'oauth',
        clientId: process.env.LINEAR_CLIENT_ID!,
        clientSecret: process.env.LINEAR_CLIENT_SECRET!,
        redirectUri: process.env.LINEAR_REDIRECT_URI!
      });
    });

    it('should generate valid authorization URL', () => {
      const url = auth.getAuthorizationUrl();
      expect(url).toContain('https://linear.app/oauth/authorize');
      expect(url).toContain(`client_id=${process.env.LINEAR_CLIENT_ID}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(process.env.LINEAR_REDIRECT_URI!)}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=read%2Cwrite%2Cissues%3Acreate%2Coffline_access');
      expect(url).toContain('actor=application');
      expect(url).toContain('state=');
    });

    // Skip token tests if we don't have auth code and refresh token
    const hasTokens = process.env.LINEAR_AUTH_CODE && process.env.LINEAR_REFRESH_TOKEN;
    (hasTokens ? it : it.skip)('should exchange auth code for tokens', async () => {
      const authCode = process.env.LINEAR_AUTH_CODE;
      if (!authCode) {
        throw new Error('LINEAR_AUTH_CODE environment variable is required');
      }

      await auth.handleCallback(authCode);
      expect(auth.isAuthenticated()).toBe(true);
    });

    (hasTokens ? it : it.skip)('should make authenticated requests with OAuth token', async () => {
      // Set initial token data (requires valid refresh token)
      const refreshToken = process.env.LINEAR_REFRESH_TOKEN;
      if (!refreshToken) {
        throw new Error('LINEAR_REFRESH_TOKEN environment variable is required');
      }

      auth.setTokenData({
        accessToken: 'expired-token',
        refreshToken,
        expiresAt: Date.now() - 1000 // Expired
      });

      await auth.refreshAccessToken();
      expect(auth.isAuthenticated()).toBe(true);
      
      const client = auth.getClient();
      expect(client).toBeInstanceOf(LinearClient);
      
      // Try to fetch viewer info to verify token works
      const viewer = await client.viewer;
      expect(viewer).toBeDefined();
      expect(viewer.id).toBeDefined();
    });
  });
});
