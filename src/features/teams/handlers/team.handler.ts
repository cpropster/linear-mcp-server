import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { LinearGraphQLClient } from '../../../graphql/client.js';

/**
 * Handler for team-related operations.
 * Manages retrieving team information, states, and labels.
 */
export class TeamHandler extends BaseHandler {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Gets information about all teams, including their states and labels.
   */
  async handleGetTeams(args: any): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();

      const result = await client.getTeams();

      return this.createJsonResponse(result);
    } catch (error) {
      this.handleError(error, 'get teams');
    }
  }
}
