# Linear MCP Architecture

This document outlines the architecture of the Linear MCP (Model Context Protocol) implementation.

## Overview

The Linear MCP provides a type-safe, modular interface to the Linear API. It abstracts away the complexity of GraphQL operations while providing a clean, domain-driven API surface through MCP tools.

## Core Concepts

### Domain-Driven Design

The codebase is organized around business domains:
- Authentication
- Issues
- Projects
- Teams
- Users

Each domain has its own set of:
- Handlers (for MCP tool operations)
- Types
- Tests

### Layered Architecture

The codebase follows a layered architecture pattern:

```
src/
├── core/               # Core infrastructure
│   ├── handlers/      # Base handler and factory
│   │   ├── base.handler.ts
│   │   └── handler.factory.ts
│   ├── types/         # Shared type definitions
│   │   ├── tool.types.ts     # MCP tool schemas
│   │   └── common.types.ts
│   └── interfaces/    # Core interfaces
│       └── tool-handler.interface.ts
│
├── features/          # Feature modules by domain
│   ├── auth/         # Authentication
│   │   └── handlers/
│   ├── issues/       # Issue management
│   │   └── handlers/
│   ├── projects/     # Project operations
│   │   └── handlers/
│   ├── teams/        # Team operations
│   │   └── handlers/
│   └── users/        # User operations
│       └── handlers/
│
├── infrastructure/    # Infrastructure concerns
│   ├── graphql/      # GraphQL implementation
│   │   ├── operations/   # GraphQL operations by domain
│   │   └── fragments/    # Shared GraphQL fragments
│   └── http/         # HTTP client
│
└── utils/            # Shared utilities
    ├── logger.ts     # Logging system
    └── config.ts     # Configuration management
```

## Key Components

### Handler Architecture

The handler system provides a clean separation of concerns for MCP tool operations:

```typescript
// Base handler with shared functionality
abstract class BaseHandler {
  protected verifyAuth(): LinearGraphQLClient;
  protected createResponse(text: string): BaseToolResponse;
  protected createJsonResponse(data: unknown): BaseToolResponse;
  protected handleError(error: unknown, operation: string): never;
  protected validateRequiredParams(params: Record<string, unknown>, required: string[]): void;
}

// Feature-specific handlers extend the base
class IssueHandler extends BaseHandler {
  handleCreateIssue(args: any): Promise<BaseToolResponse>;
  handleSearchIssues(args: any): Promise<BaseToolResponse>;
  // ... other issue operations
}

// Factory for managing handlers
class HandlerFactory {
  private authHandler: AuthHandler;
  private issueHandler: IssueHandler;
  // ... other handlers

  getHandlerForTool(toolName: string): { handler: BaseHandler; method: string };
}
```

### Authentication Layer

The authentication system supports both PAT and OAuth flows:

```typescript
class AuthHandler extends BaseHandler {
  handleAuth(args: any): Promise<BaseToolResponse>;
  handleAuthCallback(args: any): Promise<BaseToolResponse>;
}

interface AuthConfig {
  type: 'pat' | 'oauth';
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}
```

### GraphQL Layer

The GraphQL layer provides domain-specific operations with atomic and composite patterns:

```typescript
class LinearGraphQLClient {
  // Execute GraphQL operations
  async execute<T>(document: DocumentNode, variables?: any): Promise<T>;
  
  // Atomic operations
  async createProject(input: ProjectInput): Promise<ProjectResponse>;
  async createBatchIssues(issues: CreateIssueInput[]): Promise<IssueBatchResponse>;
  
  // Composite operations (built from atomic operations)
  async createProjectWithIssues(
    projectInput: ProjectInput, 
    issues: CreateIssueInput[]
  ): Promise<ProjectResponse> {
    // Creates project first, then creates issues with project reference
    const project = await this.createProject(projectInput);
    const issuesWithProject = issues.map(issue => ({
      ...issue,
      projectId: project.projectCreate.project.id
    }));
    const batchResult = await this.createBatchIssues(issuesWithProject);
    return { projectCreate: project.projectCreate, issueBatchCreate: batchResult.issueBatchCreate };
  }
}
```

This pattern ensures:
- Clear separation between atomic and composite operations
- Type safety through the entire operation chain
- Proper error handling at each step
- Reusable atomic operations

### Error Handling

Errors are handled consistently through the MCP error system:

```typescript
interface BaseToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface ErrorToolResponse extends BaseToolResponse {
  isError: true;
}
```

## Best Practices

1. **Handler Organization**
   - Each domain has its own handler
   - Handlers extend BaseHandler
   - Keep handler methods focused and single-purpose

2. **Type Safety**
   - Define tool schemas in tool.types.ts
   - Use interfaces for handler methods
   - Minimize use of 'any' type

3. **Error Handling**
   - Use BaseHandler error methods
   - Provide clear error messages
   - Include operation context in errors

4. **Testing**
   - Test each handler independently
   - Use integration tests for full flows
   - Mock GraphQL responses

## Planned Improvements

### Type Safety & Validation
- Replace all 'any' types with proper interfaces
- Generate types from GraphQL schema
- Add runtime type checking
- Implement JSON schema validation for inputs
- Improve error messages for validation failures

### Performance Optimizations
- Implement true batch mutations for bulk operations
- Pre-import and cache GraphQL operations
- Add query batching for related operations
- Implement proper error handling for GraphQL errors
- Move to GraphQL code generation
- Add operation validation

### Handler Enhancements
- Add comprehensive input validation
- Implement response caching with invalidation
- Add retry logic with backoff strategy
- Add handler lifecycle hooks
- Improve error context and debugging

### OAuth Implementation
- Complete OAuth flow with proper state management
- Add token refresh with automatic retry
- Implement secure token storage
- Add proper error handling for OAuth flows
- Support multiple OAuth scopes

### GraphQL Operations
- Implement true batching for bulk operations
- Move to code generation for type safety
- Add operation validation and optimization
- Implement proper error handling
- Add query complexity analysis

### Authentication Refactoring
- Split authentication into separate implementations:
  ```typescript
  interface ILinearAuth {
    initialize(config: AuthConfig): void;
    isAuthenticated(): boolean;
    getClient(): LinearClient;
  }

  class OAuthLinearAuth implements ILinearAuth {
    // OAuth-specific implementation
  }

  class PatLinearAuth implements ILinearAuth {
    // PAT-specific implementation
  }
  ```

### Caching Layer
- Implement caching for frequently accessed data:
  ```typescript
  interface CacheConfig {
    ttl: number;
    maxSize: number;
  }

  class CacheManager {
    private cache: Map<string, CacheEntry>;
    
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): void;
    invalidate(pattern: string): void;
  }
  ```

### Rate Limiting
- Add rate limiting middleware:
  ```typescript
  class RateLimiter {
    private readonly limits: Map<string, number>;
    private readonly windowMs: number;

    async checkLimit(operation: string): Promise<boolean>;
    async waitForAvailability(operation: string): Promise<void>;
  }
  ```

### Error Handling
- Implement domain-specific error types:
  ```typescript
  class LinearApiError extends Error {
    constructor(
      public code: string,
      public operation: string,
      message: string
    ) {
      super(message);
    }
  }
  ```

## Contributing

When contributing to this codebase:

1. Follow the handler pattern
2. Maintain domain separation
3. Add tests for new handlers
4. Update tool schemas
5. Keep handlers focused
6. Document new tools

## File Organization

Keep related code together:

```
features/issues/
├── handlers/          # Issue-related handlers
│   └── issue.handler.ts
├── types/            # Issue-specific types
│   └── issue.types.ts
└── __tests__/        # Tests
    ├── issue.test.ts
    └── issue.integration.test.ts
```

## Dependency Management

- Keep dependencies minimal
- Use peer dependencies where appropriate
- Lock dependency versions
- Document breaking changes
