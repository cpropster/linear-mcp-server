import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { LinearGraphQLClient } from '../../../graphql/client.js';

/**
 * Handler for authentication-related operations.
 * Manages both OAuth and Personal Access Token (PAT) authentication flows.
 */
export class AuthHandler extends BaseHandler {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Initializes OAuth flow with Linear.
   */
  async handleAuth(args: any): Promise<BaseToolResponse> {
    try {
      this.validateRequiredParams(args, ['clientId', 'clientSecret', 'redirectUri']);

      this.auth.initialize({
        type: 'oauth',
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        redirectUri: args.redirectUri,
      });

      const authUrl = this.auth.getAuthorizationUrl();

      return this.createResponse(
        `Please visit the following URL to authorize the application:\n${authUrl}`
      );
    } catch (error) {
      this.handleError(error, 'initialize authentication');
    }
  }

  /**
   * Handles OAuth callback after user authorization.
   */
  async handleAuthCallback(args: any): Promise<BaseToolResponse> {
    try {
      this.validateRequiredParams(args, ['code']);

      await this.auth.handleCallback(args.code);

      return this.createResponse('Successfully authenticated with Linear');
    } catch (error) {
      this.handleError(error, 'handle authentication callback');
    }
  }
}
