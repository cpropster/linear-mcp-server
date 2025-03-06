import { LinearAuth } from '../src/auth.js';
import { config } from 'dotenv';
import express from 'express';
import open from 'open';

// Load environment variables
config();

async function main() {
  // Check if we're using PAT or OAuth
  if (process.env.LINEAR_ACCESS_TOKEN) {
    await testPat();
  } else if (process.env.LINEAR_CLIENT_ID && process.env.LINEAR_CLIENT_SECRET && process.env.LINEAR_REDIRECT_URI) {
    await testOAuth();
  } else {
    console.error('ERROR: Either LINEAR_ACCESS_TOKEN or OAuth credentials (LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET, LINEAR_REDIRECT_URI) are required');
    process.exit(1);
  }
}

async function testPat() {
  const auth = new LinearAuth();
  auth.initialize({
    type: 'pat',
    accessToken: process.env.LINEAR_ACCESS_TOKEN!
  });

  try {
    const client = auth.getClient();
    const viewer = await client.viewer;
    console.log('\nPAT Authentication successful!');
    console.log(`Connected as: ${viewer.name} (${viewer.email})`);
    console.log('\nTest Credentials:\n');
    console.log(`LINEAR_ACCESS_TOKEN=${process.env.LINEAR_ACCESS_TOKEN}`);
  } catch (error) {
    console.error('Authentication failed:', error);
    process.exit(1);
  }
}

async function testOAuth() {
  const app = express();
  const port = 3000;
  const auth = new LinearAuth();

  auth.initialize({
    type: 'oauth',
    clientId: process.env.LINEAR_CLIENT_ID!,
    clientSecret: process.env.LINEAR_CLIENT_SECRET!,
    redirectUri: process.env.LINEAR_REDIRECT_URI!
  });

  // Handle OAuth callback
  app.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      console.error('OAuth error:', error);
      res.send('Authentication failed. Check console for details.');
      return;
    }

    if (!code || typeof code !== 'string') {
      console.error('No authorization code received');
      res.send('No authorization code received');
      return;
    }

    try {
      // Exchange code for tokens
      await auth.handleCallback(code);
      
      // Get user info to verify authentication
      const client = auth.getClient();
      const viewer = await client.viewer;
      
      console.log('\nOAuth Authentication successful!');
      console.log(`Connected as: ${viewer.name} (${viewer.email})`);
      console.log('\nTest Credentials:\n');
      console.log(`LINEAR_AUTH_CODE=${code}`);
      console.log(`LINEAR_REDIRECT_URI=${process.env.LINEAR_REDIRECT_URI}`);
      
      // Get refresh token from auth instance
      const tokenData = (auth as any).tokenData;
      if (tokenData?.refreshToken) {
        console.log(`LINEAR_REFRESH_TOKEN=${tokenData.refreshToken}`);
      }

      res.send('Authentication successful! Check console for test credentials.');
    } catch (error) {
      console.error('Token exchange failed:', error);
      res.send('Token exchange failed. Check console for details.');
    }
  });

  // Start server and open auth URL
  const server = app.listen(port, () => {
    console.log(`\nStarting OAuth flow...\n`);
    
    // Get and open authorization URL
    const authUrl = auth.getAuthorizationUrl();
    console.log(`Opening: ${authUrl}\n`);
    open(authUrl);
  });

  // Handle server cleanup
  process.on('SIGINT', () => {
    server.close();
    process.exit();
  });
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
