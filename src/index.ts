#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { LinearClient } from '@linear/sdk';

// Create a Linear client with the OAuth token
const linearClient = new LinearClient({
  accessToken: process.env.LINEAR_REFRESH_TOKEN || process.env.LINEAR_ACCESS_TOKEN
});

// Define types for Linear API
interface LinearFilter {
  search?: string;
  team?: {
    id: {
      in: string[];
    };
  };
}

// Define tool schemas
const toolSchemas = [
  {
    name: 'linear_get_teams',
    description: 'Get all teams with their states and labels',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'linear_search_issues',
    description: 'Search for issues with filtering and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string'
        },
        teamIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Filter by team IDs'
        },
        first: {
          type: 'number',
          description: 'Number of issues to return (default: 50)'
        }
      }
    }
  },
  {
    name: 'linear_get_cycles',
    description: 'Get all cycles for a team',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID to get cycles for'
        }
      },
      required: ['teamId']
    }
  },
  {
    name: 'linear_get_projects',
    description: 'Get all projects',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Optional team ID to filter projects by'
        },
        first: {
          type: 'number',
          description: 'Number of projects to return (default: 50)'
        }
      }
    }
  },
  {
    name: 'linear_create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID to create the issue in'
        },
        title: {
          type: 'string',
          description: 'Title of the issue'
        },
        description: {
          type: 'string',
          description: 'Description of the issue'
        },
        assigneeId: {
          type: 'string',
          description: 'ID of the user to assign the issue to'
        },
        stateId: {
          type: 'string',
          description: 'ID of the state to set for the issue'
        },
        priority: {
          type: 'number',
          description: 'Priority of the issue (0-4)'
        },
        estimate: {
          type: 'number',
          description: 'Estimate of the issue'
        },
        cycleId: {
          type: 'string',
          description: 'ID of the cycle to add the issue to'
        },
        projectId: {
          type: 'string',
          description: 'ID of the project to add the issue to'
        },
        labelIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'IDs of labels to add to the issue'
        }
      },
      required: ['teamId', 'title']
    }
  },
  {
    name: 'linear_update_issue',
    description: 'Update an existing issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'ID of the issue to update'
        },
        title: {
          type: 'string',
          description: 'New title of the issue'
        },
        description: {
          type: 'string',
          description: 'New description of the issue'
        },
        assigneeId: {
          type: 'string',
          description: 'ID of the user to assign the issue to'
        },
        stateId: {
          type: 'string',
          description: 'ID of the state to set for the issue'
        },
        priority: {
          type: 'number',
          description: 'Priority of the issue (0-4)'
        },
        estimate: {
          type: 'number',
          description: 'Estimate of the issue'
        },
        cycleId: {
          type: 'string',
          description: 'ID of the cycle to add the issue to'
        },
        projectId: {
          type: 'string',
          description: 'ID of the project to add the issue to'
        },
        labelIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'IDs of labels to add to the issue'
        }
      },
      required: ['issueId']
    }
  }
];

// Create the MCP server
const server = new Server(
  {
    name: 'linear-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('Handling mcp.listTools request');
  return {
    tools: toolSchemas
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`Handling mcp.callTool request for tool: ${request.params.name}`);
  
  if (request.params.name === 'linear_get_teams') {
    try {
      console.error('Getting teams from Linear');
      const teams = await linearClient.teams();
      
      console.error(`Found ${teams.nodes.length} teams`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ teams }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error getting teams:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get teams: ${error.message}`
      );
    }
  } else if (request.params.name === 'linear_search_issues') {
    try {
      console.error('Searching issues in Linear');
      const filter: LinearFilter = {};
      
      if (request.params.arguments && typeof request.params.arguments.query === 'string') {
        filter.search = request.params.arguments.query;
      }
      
      if (request.params.arguments && Array.isArray(request.params.arguments.teamIds)) {
        filter.team = { id: { in: request.params.arguments.teamIds as string[] } };
      }
      
      const first: number = (request.params.arguments && typeof request.params.arguments.first === 'number') 
        ? request.params.arguments.first 
        : 50;
      
      const issues = await linearClient.issues({
        filter,
        first
      });
      
      console.error(`Found ${issues.nodes.length} issues`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ issues }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error searching issues:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search issues: ${error.message}`
      );
    }
  } else if (request.params.name === 'linear_get_cycles') {
    try {
      console.error('Getting cycles from Linear');
      
      if (!request.params.arguments || !request.params.arguments.teamId) {
        throw new Error('Team ID is required');
      }
      
      const teamId = request.params.arguments.teamId as string;
      const team = await linearClient.team(teamId);
      const cycles = await team.cycles();
      
      console.error(`Found ${cycles.nodes.length} cycles for team ${teamId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ cycles }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error getting cycles:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get cycles: ${error.message}`
      );
    }
  } else if (request.params.name === 'linear_get_projects') {
    try {
      console.error('Getting projects from Linear');
      
      const first: number = (request.params.arguments && typeof request.params.arguments.first === 'number') 
        ? request.params.arguments.first 
        : 50;
      
      // If teamId is provided, get projects for that team directly
      if (request.params.arguments && typeof request.params.arguments.teamId === 'string') {
        const teamId = request.params.arguments.teamId;
        const team = await linearClient.team(teamId);
        const projects = await team.projects({ first });
        
        console.error(`Found ${projects.nodes.length} projects for team ${teamId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ projects }, null, 2)
            }
          ]
        };
      } else {
        // No team specified, return all projects
        const projects = await linearClient.projects({ first });
        console.error(`Found ${projects.nodes.length} projects`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ projects }, null, 2)
            }
          ]
        };
      }
    } catch (error: any) {
      console.error('Error getting projects:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get projects: ${error.message}`
      );
    }
  } else if (request.params.name === 'linear_create_issue') {
    try {
      console.error('Creating issue in Linear');
      
      if (!request.params.arguments || !request.params.arguments.teamId || !request.params.arguments.title) {
        throw new Error('Team ID and title are required');
      }
      
      const issueInput: any = {
        teamId: request.params.arguments.teamId,
        title: request.params.arguments.title,
      };
      
      // Add optional fields if provided
      if (request.params.arguments.description) {
        issueInput.description = request.params.arguments.description;
      }
      
      if (request.params.arguments.assigneeId) {
        issueInput.assigneeId = request.params.arguments.assigneeId;
      }
      
      if (request.params.arguments.stateId) {
        issueInput.stateId = request.params.arguments.stateId;
      }
      
      if (request.params.arguments.priority !== undefined) {
        issueInput.priority = request.params.arguments.priority;
      }
      
      if (request.params.arguments.estimate !== undefined) {
        issueInput.estimate = request.params.arguments.estimate;
      }
      
      if (request.params.arguments.cycleId) {
        issueInput.cycleId = request.params.arguments.cycleId;
      }
      
      if (request.params.arguments.projectId) {
        issueInput.projectId = request.params.arguments.projectId;
      }
      
      if (request.params.arguments.labelIds) {
        issueInput.labelIds = request.params.arguments.labelIds;
      }
      
      const issuePayload = await linearClient.createIssue(issueInput);
      
      console.error(`Created issue with ID ${(issuePayload as any).success ? (issuePayload as any).issue?.id : 'unknown'}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ issuePayload }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error creating issue:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create issue: ${error.message}`
      );
    }
  } else if (request.params.name === 'linear_update_issue') {
    try {
      console.error('Updating issue in Linear');
      
      if (!request.params.arguments || !request.params.arguments.issueId) {
        throw new Error('Issue ID is required');
      }
      
      const issueId = request.params.arguments.issueId as string;
      const issueInput: any = {};
      
      // Add fields if provided
      if (request.params.arguments.title) {
        issueInput.title = request.params.arguments.title;
      }
      
      if (request.params.arguments.description) {
        issueInput.description = request.params.arguments.description;
      }
      
      if (request.params.arguments.assigneeId) {
        issueInput.assigneeId = request.params.arguments.assigneeId;
      }
      
      if (request.params.arguments.stateId) {
        issueInput.stateId = request.params.arguments.stateId;
      }
      
      if (request.params.arguments.priority !== undefined) {
        issueInput.priority = request.params.arguments.priority;
      }
      
      if (request.params.arguments.estimate !== undefined) {
        issueInput.estimate = request.params.arguments.estimate;
      }
      
      if (request.params.arguments.cycleId) {
        issueInput.cycleId = request.params.arguments.cycleId;
      }
      
      if (request.params.arguments.projectId) {
        issueInput.projectId = request.params.arguments.projectId;
      }
      
      if (request.params.arguments.labelIds) {
        issueInput.labelIds = request.params.arguments.labelIds;
      }
      
      const issuePayload = await linearClient.updateIssue(issueId, issueInput);
      
      console.error(`Updated issue with ID ${(issuePayload as any).success ? (issuePayload as any).issue?.id : 'unknown'}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ issuePayload }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error updating issue:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update issue: ${error.message}`
      );
    }
  } else {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  }
});

// Set up error handler
server.onerror = (error: unknown) => {
  console.error('MCP Server Error:', error);
};

// Start the server
async function main() {
  console.error('Starting Linear MCP server');
  
  // Test the Linear client
  try {
    const me = await linearClient.viewer;
    console.error(`Authenticated as: ${me.name} (${me.email})`);
  } catch (error: any) {
    console.error('Authentication failed:', error.message);
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Linear MCP server running on stdio');
}

main().catch((error: unknown) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
