import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { LinearGraphQLClient } from '../../../graphql/client.js';

/**
 * Handler for user-related operations.
 * Manages retrieving user information and settings.
 */
export class UserHandler extends BaseHandler {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Gets information about the currently authenticated user.
   */
  async handleGetUser(args: any): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();

      const result = await client.getCurrentUser();

      return this.createJsonResponse(result);
    } catch (error) {
      this.handleError(error, 'get user info');
    }
  }
}
