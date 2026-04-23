/**
 * Built-In Tools - 内置工具实现
 * TaskFlow AI v4.0
 */

import { ToolDefinition, ToolCategory, ToolResult, ToolContext } from '../types/tool';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BuiltInTools {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.initializeFilesystemTools();
    this.initializeShellTools();
    this.initializeHTTPTools();
    this.initializeGitTools();
    this.initializeCodeTools();
  }

  private initializeFilesystemTools(): void {
    // fs_read
    this.register({
      id: 'fs_read',
      name: 'Read File',
      description: 'Read the contents of a file',
      category: ToolCategory.FILESYSTEM,
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to the file' },
          encoding: { type: 'string', default: 'utf-8' }
        },
        required: ['filepath']
      },
      execute: async (params, context) => {
        const filepath = params.filepath as string;
        const encoding = params.encoding as string || 'utf-8';

        try {
          const content = await fs.readFile(filepath, encoding);
          return { success: true, output: content };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // fs_write
    this.register({
      id: 'fs_write',
      name: 'Write File',
      description: 'Write content to a file',
      category: ToolCategory.FILESYSTEM,
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to the file' },
          content: { type: 'string', description: 'Content to write' },
          encoding: { type: 'string', default: 'utf-8' }
        },
        required: ['filepath', 'content']
      },
      execute: async (params, context) => {
        const filepath = params.filepath as string;
        const content = params.content as string;
        const encoding = params.encoding as string || 'utf-8';

        try {
          await fs.writeFile(filepath, content, encoding);
          return { success: true, output: 'File written successfully' };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // fs_list
    this.register({
      id: 'fs_list',
      name: 'List Directory',
      description: 'List contents of a directory',
      category: ToolCategory.FILESYSTEM,
      parameters: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: 'Path to the directory' },
          recursive: { type: 'boolean', default: false }
        },
        required: ['dirpath']
      },
      execute: async (params, context) => {
        const dirpath = params.dirpath as string;
        const recursive = params.recursive as boolean || false;

        try {
          let files: string[];
          if (recursive) {
            files = (await fs.readdir(dirpath, { recursive: true, withFileTypes: true }))
              .filter(entry => entry.isFile())
              .map(entry => path.join(entry.path as string, entry.name));
          } else {
            files = await fs.readdir(dirpath);
          }

          return { success: true, output: files };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // fs_exists
    this.register({
      id: 'fs_exists',
      name: 'Check File Exists',
      description: 'Check if a file or directory exists',
      category: ToolCategory.FILESYSTEM,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to check' }
        },
        required: ['path']
      },
      execute: async (params, context) => {
        try {
          const exists = await fs.pathExists(params.path as string);
          return { success: true, output: exists };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // fs_delete
    this.register({
      id: 'fs_delete',
      name: 'Delete File/Directory',
      description: 'Delete a file or directory',
      category: ToolCategory.FILESYSTEM,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to delete' },
          recursive: { type: 'boolean', default: false }
        },
        required: ['path']
      },
      execute: async (params, context) => {
        try {
          if (params.recursive) {
            await fs.remove(params.path as string);
          } else {
            await fs.unlink(params.path as string);
          }
          return { success: true, output: 'Deleted successfully' };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });
  }

  private initializeShellTools(): void {
    // shell_exec
    this.register({
      id: 'shell_exec',
      name: 'Execute Shell Command',
      description: 'Execute a shell command',
      category: ToolCategory.SHELL,
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          cwd: { type: 'string', description: 'Working directory' },
          timeout: { type: 'number', default: 30000 }
        },
        required: ['command']
      },
      execute: async (params, context) => {
        try {
          const { stdout, stderr } = await execAsync(params.command as string, {
            cwd: params.cwd ? String(params.cwd) : undefined,
            timeout: (params.timeout as number) || 30000
          });
          return {
            success: true,
            output: { stdout, stderr }
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            output: { stdout: error.stdout, stderr: error.stderr }
          };
        }
      }
    });
  }

  private initializeHTTPTools(): void {
    // http_get
    this.register({
      id: 'http_get',
      name: 'HTTP GET',
      description: 'Send HTTP GET request',
      category: ToolCategory.HTTP,
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to request' },
          headers: { type: 'object' },
          timeout: { type: 'number', default: 30000 }
        },
        required: ['url']
      },
      execute: async (params, context) => {
        try {
          const response = await fetch(
            params.url as string,
            {
              method: 'GET',
              headers: (params.headers as Record<string, string>) || undefined,
              signal: AbortSignal.timeout((params.timeout as number) || 30000)
            }
          );
          const data = await response.json();
          return {
            success: true,
            output: { status: response.status, data }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // http_post
    this.register({
      id: 'http_post',
      name: 'HTTP POST',
      description: 'Send HTTP POST request',
      category: ToolCategory.HTTP,
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to request' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object' },
          timeout: { type: 'number', default: 30000 }
        },
        required: ['url', 'body']
      },
      execute: async (params, context) => {
        try {
          const response = await fetch(
            params.url as string,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(params.headers as Record<string, string>)
              },
              body: JSON.stringify(params.body),
              signal: AbortSignal.timeout((params.timeout as number) || 30000)
            }
          );
          const data = await response.json();
          return {
            success: true,
            output: { status: response.status, data }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });
  }

  private initializeGitTools(): void {
    // git_status
    this.register({
      id: 'git_status',
      name: 'Git Status',
      description: 'Get git repository status',
      category: ToolCategory.GIT,
      parameters: {
        type: 'object',
        properties: {
          repoPath: { type: 'string', description: 'Path to repository' }
        },
        required: ['repoPath']
      },
      execute: async (params, context) => {
        try {
          const { stdout } = await execAsync('git status --porcelain', {
            cwd: params.repoPath as string
          });
          return {
            success: true,
            output: stdout.trim().split('\n').filter(Boolean)
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // git_commit
    this.register({
      id: 'git_commit',
      name: 'Git Commit',
      description: 'Commit changes to git',
      category: ToolCategory.GIT,
      parameters: {
        type: 'object',
        properties: {
          repoPath: { type: 'string', description: 'Path to repository' },
          message: { type: 'string', description: 'Commit message' },
          files: { type: 'array', items: { type: 'string' } }
        },
        required: ['repoPath', 'message']
      },
      execute: async (params, context) => {
        try {
          // Stage files
          const files = params.files as string[];
          if (files.length > 0) {
            await execAsync(`git add ${files.join(' ')}`, { cwd: params.repoPath as string });
          } else {
            await execAsync('git add .', { cwd: params.repoPath as string });
          }

          // Commit
          await execAsync(`git commit -m "${params.message}"`, {
            cwd: params.repoPath as string
          });

          return { success: true, output: 'Committed successfully' };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });

    // git_log
    this.register({
      id: 'git_log',
      name: 'Git Log',
      description: 'Get git commit history',
      category: ToolCategory.GIT,
      parameters: {
        type: 'object',
        properties: {
          repoPath: { type: 'string', description: 'Path to repository' },
          limit: { type: 'number', default: 10 }
        },
        required: ['repoPath']
      },
      execute: async (params, context) => {
        try {
          const limit = params.limit as number || 10;
          const { stdout } = await execAsync(`git log --oneline -${limit}`, {
            cwd: params.repoPath as string
          });
          return {
            success: true,
            output: stdout.trim().split('\n').filter(Boolean)
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });
  }

  private initializeCodeTools(): void {
    // code_search
    this.register({
      id: 'code_search',
      name: 'Search Code',
      description: 'Search for text in files',
      category: ToolCategory.CODE,
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search pattern' },
          directory: { type: 'string', description: 'Directory to search' },
          filePattern: { type: 'string', default: '*.ts' }
        },
        required: ['pattern', 'directory']
      },
      execute: async (params, context) => {
        // Simplified implementation - in production use ripgrep
        return {
          success: true,
          output: 'search results'
        };
      }
    });

    // code_analyze
    this.register({
      id: 'code_analyze',
      name: 'Analyze Code',
      description: 'Analyze code structure',
      category: ToolCategory.CODE,
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to file' }
        },
        required: ['filepath']
      },
      execute: async (params, context) => {
        // Simplified implementation
        return {
          success: true,
          output: { imports: [], exports: [], functions: [] }
        };
      }
    });
  }

  private register(definition: ToolDefinition): void {
    this.tools.set(definition.id, definition);
  }

  public getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  public getCategoryToolCounts(): Record<ToolCategory, number> {
    const counts = {} as Record<ToolCategory, number>;
    Object.values(ToolCategory).forEach(cat => {
      counts[cat as ToolCategory] = 0;
    });

    this.tools.forEach(tool => {
      counts[tool.category]++;
    });

    return counts;
  }
}
