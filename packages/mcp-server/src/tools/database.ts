import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

interface DatabaseFunction {
  name: string;
  parameters: Array<{
    name: string;
    type: string;
    defaultValue?: string;
  }>;
  returnType: string;
  description: string;
  purpose: string;
  securityLevel: 'definer' | 'invoker';
  schema: string;
  sourceFile: string;
}

interface SchemaFile {
  name: string;
  path: string;
  description: string;
  section: string;
  lastModified: Date;
  tables: string[];
  functions: string[];
  dependencies: string[];
  topic: string;
}

export class DatabaseTool {
  static async getSchemaFiles(): Promise<SchemaFile[]> {
    const schemasPath = join(
      process.cwd(),
      'apps',
      'web',
      'supabase',
      'schemas',
    );
    const files = await readdir(schemasPath);

    const schemaFiles: SchemaFile[] = [];

    for (const file of files.filter((f) => f.endsWith('.sql'))) {
      const filePath = join(schemasPath, file);
      const content = await readFile(filePath, 'utf8');
      const stats = await stat(filePath);

      // Extract section and description from the file header
      const sectionMatch = content.match(/\* Section: ([^\n*]+)/);
      const descriptionMatch = content.match(/\* ([^*\n]+)\n \* We create/);

      // Extract tables and functions from content
      const tables = this.extractTables(content);
      const functions = this.extractFunctionNames(content);
      const dependencies = this.extractDependencies(content);
      const topic = this.determineTopic(file, content);

      schemaFiles.push({
        name: file,
        path: filePath,
        section: sectionMatch?.[1]?.trim() || 'Unknown',
        description:
          descriptionMatch?.[1]?.trim() || 'No description available',
        lastModified: stats.mtime,
        tables,
        functions,
        dependencies,
        topic,
      });
    }

    return schemaFiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getFunctions(): Promise<DatabaseFunction[]> {
    const schemaFiles = await this.getSchemaFiles();
    const functions: DatabaseFunction[] = [];

    for (const schemaFile of schemaFiles) {
      const content = await readFile(schemaFile.path, 'utf8');
      const fileFunctions = this.extractFunctionsFromContent(
        content,
        schemaFile.name,
      );
      functions.push(...fileFunctions);
    }

    return functions.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getFunctionDetails(
    functionName: string,
  ): Promise<DatabaseFunction> {
    const functions = await this.getFunctions();
    const func = functions.find((f) => f.name === functionName);

    if (!func) {
      throw new Error(`Function "${functionName}" not found`);
    }

    return func;
  }

  static async searchFunctions(query: string): Promise<DatabaseFunction[]> {
    const allFunctions = await this.getFunctions();
    const searchTerm = query.toLowerCase();

    return allFunctions.filter((func) => {
      return (
        func.name.toLowerCase().includes(searchTerm) ||
        func.description.toLowerCase().includes(searchTerm) ||
        func.purpose.toLowerCase().includes(searchTerm) ||
        func.returnType.toLowerCase().includes(searchTerm)
      );
    });
  }

  static async getSchemaContent(fileName: string): Promise<string> {
    const schemasPath = join(
      process.cwd(),
      'apps',
      'web',
      'supabase',
      'schemas',
    );
    const filePath = join(schemasPath, fileName);

    try {
      return await readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Schema file "${fileName}" not found`);
    }
  }

  static async getSchemasByTopic(topic: string): Promise<SchemaFile[]> {
    const allSchemas = await this.getSchemaFiles();
    const searchTerm = topic.toLowerCase();

    return allSchemas.filter((schema) => {
      return (
        schema.topic.toLowerCase().includes(searchTerm) ||
        schema.section.toLowerCase().includes(searchTerm) ||
        schema.description.toLowerCase().includes(searchTerm) ||
        schema.name.toLowerCase().includes(searchTerm)
      );
    });
  }

  static async getSchemaBySection(section: string): Promise<SchemaFile | null> {
    const allSchemas = await this.getSchemaFiles();
    return (
      allSchemas.find(
        (schema) => schema.section.toLowerCase() === section.toLowerCase(),
      ) || null
    );
  }

  private static extractFunctionsFromContent(
    content: string,
    sourceFile: string,
  ): DatabaseFunction[] {
    const functions: DatabaseFunction[] = [];

    // Updated regex to capture function definitions with optional "or replace"
    const functionRegex =
      /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s*\(([^)]*)\)\s*returns?\s+([^;\n]+)(?:\s+language\s+\w+)?(?:\s+security\s+(definer|invoker))?[^$]*?\$\$([^$]*)\$\$/gi;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const [, fullName, params, returnType, securityLevel, body] = match;

      if (!fullName || !returnType) continue;

      // Extract schema and function name
      const nameParts = fullName.split('.');
      const functionName = nameParts[nameParts.length - 1];
      const schema = nameParts.length > 1 ? nameParts[0] : 'public';

      // Parse parameters
      const parameters = this.parseParameters(params || '');

      // Extract description and purpose from comments before function
      const functionIndex = match.index || 0;
      const beforeFunction = content.substring(
        Math.max(0, functionIndex - 500),
        functionIndex,
      );
      const description = this.extractDescription(beforeFunction, body || '');
      const purpose = this.extractPurpose(description, functionName);

      functions.push({
        name: functionName,
        parameters,
        returnType: returnType.trim(),
        description,
        purpose,
        securityLevel: (securityLevel as 'definer' | 'invoker') || 'invoker',
        schema,
        sourceFile,
      });
    }

    return functions;
  }

  private static parseParameters(paramString: string): Array<{
    name: string;
    type: string;
    defaultValue?: string;
  }> {
    if (!paramString.trim()) return [];

    const parameters: Array<{
      name: string;
      type: string;
      defaultValue?: string;
    }> = [];

    // Split by comma, but be careful of nested types
    const params = paramString.split(',');

    for (const param of params) {
      const cleaned = param.trim();
      if (!cleaned) continue;

      // Match parameter pattern: name type [default value]
      const paramMatch = cleaned.match(
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+([^=\s]+)(?:\s+default\s+(.+))?\s*$/i,
      );

      if (paramMatch) {
        const [, name, type, defaultValue] = paramMatch;
        if (name && type) {
          parameters.push({
            name: name.trim(),
            type: type.trim(),
            defaultValue: defaultValue?.trim(),
          });
        }
      }
    }

    return parameters;
  }

  private static extractDescription(
    beforeFunction: string,
    body: string,
  ): string {
    // Look for comments before the function
    const commentMatch = beforeFunction.match(/--\s*(.+?)(?:\n|$)/);
    if (commentMatch?.[1]) {
      return commentMatch[1].trim();
    }

    // Look for comments inside the function body
    const bodyCommentMatch = body.match(/--\s*(.+?)(?:\n|$)/);
    if (bodyCommentMatch?.[1]) {
      return bodyCommentMatch[1].trim();
    }

    return 'No description available';
  }

  private static extractPurpose(
    description: string,
    functionName: string,
  ): string {
    // Map function names to purposes
    const purposeMap: Record<string, string> = {
      create_nonce:
        'Create one-time authentication tokens for secure operations',
      verify_nonce: 'Verify and consume one-time tokens for authentication',
      is_mfa_compliant:
        'Check if user has completed multi-factor authentication',
      team_account_workspace:
        'Load comprehensive team account data with permissions',
      has_role_on_account: 'Check if user has access to a specific account',
      has_permission: 'Verify user permissions for specific account operations',
      get_user_billing_account: 'Retrieve billing account information for user',
      create_team_account: 'Create new team account with proper permissions',
      invite_user_to_account: 'Send invitation to join team account',
      accept_invitation: 'Process and accept team invitation',
      transfer_account_ownership: 'Transfer account ownership between users',
      delete_account: 'Safely delete account and associated data',
    };

    if (purposeMap[functionName]) {
      return purposeMap[functionName];
    }

    // Analyze function name for purpose hints
    if (functionName.includes('create'))
      return 'Create database records with validation';
    if (functionName.includes('delete') || functionName.includes('remove'))
      return 'Delete records with proper authorization';
    if (functionName.includes('update') || functionName.includes('modify'))
      return 'Update existing records with validation';
    if (functionName.includes('get') || functionName.includes('fetch'))
      return 'Retrieve data with access control';
    if (functionName.includes('verify') || functionName.includes('validate'))
      return 'Validate data or permissions';
    if (functionName.includes('check') || functionName.includes('is_'))
      return 'Check conditions or permissions';
    if (functionName.includes('invite'))
      return 'Handle user invitations and access';
    if (functionName.includes('transfer'))
      return 'Transfer ownership or data between entities';

    return `Custom database function: ${description}`;
  }

  private static extractTables(content: string): string[] {
    const tables: string[] = [];
    const tableRegex =
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      if (match[1]) {
        tables.push(match[1]);
      }
    }

    return [...new Set(tables)]; // Remove duplicates
  }

  private static extractFunctionNames(content: string): string[] {
    const functions: string[] = [];
    const functionRegex =
      /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      if (match[1]) {
        functions.push(match[1]);
      }
    }

    return [...new Set(functions)]; // Remove duplicates
  }

  private static extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // Look for references to other tables
    const referencesRegex =
      /references\s+(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match;

    while ((match = referencesRegex.exec(content)) !== null) {
      if (match[1] && match[1] !== 'users') {
        // Exclude auth.users as it's external
        dependencies.push(match[1]);
      }
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  private static determineTopic(fileName: string, content: string): string {
    // Map file names to topics
    const fileTopicMap: Record<string, string> = {
      '00-privileges.sql': 'security',
      '01-enums.sql': 'types',
      '02-config.sql': 'configuration',
      '03-accounts.sql': 'accounts',
      '04-roles.sql': 'permissions',
      '05-memberships.sql': 'teams',
      '06-roles-permissions.sql': 'permissions',
      '07-invitations.sql': 'teams',
      '08-billing-customers.sql': 'billing',
      '09-subscriptions.sql': 'billing',
      '10-orders.sql': 'billing',
      '11-notifications.sql': 'notifications',
      '12-one-time-tokens.sql': 'auth',
      '13-mfa.sql': 'auth',
      '14-super-admin.sql': 'admin',
      '15-account-views.sql': 'accounts',
      '16-storage.sql': 'storage',
      '17-roles-seed.sql': 'permissions',
    };

    if (fileTopicMap[fileName]) {
      return fileTopicMap[fileName];
    }

    // Analyze content for topic hints
    const contentLower = content.toLowerCase();
    if (contentLower.includes('account') && contentLower.includes('team'))
      return 'accounts';
    if (
      contentLower.includes('subscription') ||
      contentLower.includes('billing')
    )
      return 'billing';
    if (
      contentLower.includes('auth') ||
      contentLower.includes('mfa') ||
      contentLower.includes('token')
    )
      return 'auth';
    if (contentLower.includes('permission') || contentLower.includes('role'))
      return 'permissions';
    if (contentLower.includes('notification') || contentLower.includes('email'))
      return 'notifications';
    if (contentLower.includes('storage') || contentLower.includes('bucket'))
      return 'storage';
    if (contentLower.includes('admin') || contentLower.includes('super'))
      return 'admin';

    return 'general';
  }
}

export function registerDatabaseTools(server: McpServer) {
  createGetSchemaFilesTool(server);
  createGetSchemaContentTool(server);
  createGetSchemasByTopicTool(server);
  createGetSchemaBySectionTool(server);
  createGetFunctionsTool(server);
  createGetFunctionDetailsTool(server);
  createSearchFunctionsTool(server);
}

function createGetSchemaFilesTool(server: McpServer) {
  return server.tool(
    'get_schema_files',
    '🔥 DATABASE SCHEMA FILES (SOURCE OF TRUTH - ALWAYS CURRENT) - Use these over migrations!',
    async () => {
      const schemaFiles = await DatabaseTool.getSchemaFiles();

      const filesList = schemaFiles
        .map((file) => {
          const tablesInfo =
            file.tables.length > 0
              ? ` | Tables: ${file.tables.join(', ')}`
              : '';
          const functionsInfo =
            file.functions.length > 0
              ? ` | Functions: ${file.functions.join(', ')}`
              : '';
          return `${file.name} (${file.topic}): ${file.section} - ${file.description}${tablesInfo}${functionsInfo}`;
        })
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `🔥 DATABASE SCHEMA FILES (ALWAYS UP TO DATE)\n\nThese files represent the current database state. Use these instead of migrations for current schema understanding.\n\n${filesList}`,
          },
        ],
      };
    },
  );
}

function createGetFunctionsTool(server: McpServer) {
  return server.tool(
    'get_database_functions',
    'Get all database functions with descriptions and usage guidance',
    async () => {
      const functions = await DatabaseTool.getFunctions();

      const functionsList = functions
        .map((func) => {
          const security =
            func.securityLevel === 'definer' ? ' [SECURITY DEFINER]' : '';
          const params = func.parameters
            .map((p) => {
              const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
              return `${p.name}: ${p.type}${defaultVal}`;
            })
            .join(', ');

          return `${func.name}(${params}) � ${func.returnType}${security}\n  Purpose: ${func.purpose}\n  Source: ${func.sourceFile}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Database Functions:\n\n${functionsList}`,
          },
        ],
      };
    },
  );
}

function createGetFunctionDetailsTool(server: McpServer) {
  return server.tool(
    'get_function_details',
    'Get detailed information about a specific database function',
    {
      state: z.object({
        functionName: z.string(),
      }),
    },
    async ({ state }) => {
      const func = await DatabaseTool.getFunctionDetails(state.functionName);

      const params =
        func.parameters.length > 0
          ? func.parameters
              .map((p) => {
                const defaultVal = p.defaultValue
                  ? ` (default: ${p.defaultValue})`
                  : '';
                return `  - ${p.name}: ${p.type}${defaultVal}`;
              })
              .join('\n')
          : '  No parameters';

      const securityNote =
        func.securityLevel === 'definer'
          ? '\n�  SECURITY DEFINER: This function runs with elevated privileges and bypasses RLS.'
          : '\n SECURITY INVOKER: This function inherits caller permissions and respects RLS.';

      return {
        content: [
          {
            type: 'text',
            text: `Function: ${func.schema}.${func.name}

Purpose: ${func.purpose}
Description: ${func.description}
Return Type: ${func.returnType}
Security Level: ${func.securityLevel}${securityNote}

Parameters:
${params}

Source File: ${func.sourceFile}`,
          },
        ],
      };
    },
  );
}

function createSearchFunctionsTool(server: McpServer) {
  return server.tool(
    'search_database_functions',
    'Search database functions by name, description, or purpose',
    {
      state: z.object({
        query: z.string(),
      }),
    },
    async ({ state }) => {
      const functions = await DatabaseTool.searchFunctions(state.query);

      if (functions.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No database functions found matching "${state.query}"`,
            },
          ],
        };
      }

      const functionsList = functions
        .map((func) => {
          const security = func.securityLevel === 'definer' ? ' [DEFINER]' : '';
          return `${func.name}${security}: ${func.purpose}`;
        })
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${functions.length} functions matching "${state.query}":\n\n${functionsList}`,
          },
        ],
      };
    },
  );
}

function createGetSchemaContentTool(server: McpServer) {
  return server.tool(
    'get_schema_content',
    '📋 Get raw schema file content (CURRENT DATABASE STATE) - Source of truth for database structure',
    {
      state: z.object({
        fileName: z.string(),
      }),
    },
    async ({ state }) => {
      const content = await DatabaseTool.getSchemaContent(state.fileName);

      return {
        content: [
          {
            type: 'text',
            text: `📋 SCHEMA FILE: ${state.fileName} (CURRENT STATE)\n\n${content}`,
          },
        ],
      };
    },
  );
}

function createGetSchemasByTopicTool(server: McpServer) {
  return server.tool(
    'get_schemas_by_topic',
    '🎯 Find schema files by topic (accounts, auth, billing, permissions, etc.) - Fastest way to find relevant schemas',
    {
      state: z.object({
        topic: z.string(),
      }),
    },
    async ({ state }) => {
      const schemas = await DatabaseTool.getSchemasByTopic(state.topic);

      if (schemas.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No schema files found for topic "${state.topic}". Available topics: accounts, auth, billing, permissions, teams, notifications, storage, admin, security, types, configuration.`,
            },
          ],
        };
      }

      const schemasList = schemas
        .map((schema) => {
          const tablesInfo =
            schema.tables.length > 0
              ? `\n  Tables: ${schema.tables.join(', ')}`
              : '';
          const functionsInfo =
            schema.functions.length > 0
              ? `\n  Functions: ${schema.functions.join(', ')}`
              : '';
          return `${schema.name}: ${schema.description}${tablesInfo}${functionsInfo}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🎯 SCHEMAS FOR TOPIC: "${state.topic}"\n\n${schemasList}`,
          },
        ],
      };
    },
  );
}

function createGetSchemaBySectionTool(server: McpServer) {
  return server.tool(
    'get_schema_by_section',
    '📂 Get specific schema by section name (Accounts, Permissions, etc.) - Direct access to schema sections',
    {
      state: z.object({
        section: z.string(),
      }),
    },
    async ({ state }) => {
      const schema = await DatabaseTool.getSchemaBySection(state.section);

      if (!schema) {
        return {
          content: [
            {
              type: 'text',
              text: `No schema found for section "${state.section}". Use get_schema_files to see available sections.`,
            },
          ],
        };
      }

      const tablesInfo =
        schema.tables.length > 0 ? `\nTables: ${schema.tables.join(', ')}` : '';
      const functionsInfo =
        schema.functions.length > 0
          ? `\nFunctions: ${schema.functions.join(', ')}`
          : '';
      const dependenciesInfo =
        schema.dependencies.length > 0
          ? `\nDependencies: ${schema.dependencies.join(', ')}`
          : '';

      return {
        content: [
          {
            type: 'text',
            text: `📂 SCHEMA SECTION: ${schema.section}\n\nFile: ${schema.name}\nTopic: ${schema.topic}\nDescription: ${schema.description}${tablesInfo}${functionsInfo}${dependenciesInfo}\n\nLast Modified: ${schema.lastModified.toISOString()}`,
          },
        ],
      };
    },
  );
}
