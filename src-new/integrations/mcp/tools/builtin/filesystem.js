/**
 * 内置文件系统MCP工具
 * 提供文件和目录操作功能
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs-extra');
const path = require('path');

class FileSystemMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'filesystem',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // 注册工具
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: '读取文件内容',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '文件路径',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: '写入文件内容',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '文件路径',
                },
                content: {
                  type: 'string',
                  description: '文件内容',
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'list_directory',
            description: '列出目录内容',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '目录路径',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'create_directory',
            description: '创建目录',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '目录路径',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'delete_file',
            description: '删除文件或目录',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '文件或目录路径',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(args.path);

          case 'write_file':
            return await this.writeFile(args.path, args.content);

          case 'list_directory':
            return await this.listDirectory(args.path);

          case 'create_directory':
            return await this.createDirectory(args.path);

          case 'delete_file':
            return await this.deleteFile(args.path);

          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // 注册资源
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: [
          {
            uri: 'file://current-directory',
            name: '当前目录',
            description: '当前工作目录的文件树',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // 处理资源请求
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;

      if (uri === 'file://current-directory') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(await this.getDirectoryTree(process.cwd()), null, 2),
            },
          ],
        };
      }

      throw new Error(`未知资源: ${uri}`);
    });
  }

  async readFile(filePath) {
    const absolutePath = path.resolve(filePath);
    
    if (!await fs.pathExists(absolutePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`路径不是文件: ${filePath}`);
    }

    const content = await fs.readFile(absolutePath, 'utf8');
    
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  async writeFile(filePath, content) {
    const absolutePath = path.resolve(filePath);
    
    // 确保目录存在
    await fs.ensureDir(path.dirname(absolutePath));
    
    await fs.writeFile(absolutePath, content, 'utf8');
    
    return {
      content: [
        {
          type: 'text',
          text: `文件已写入: ${filePath}`,
        },
      ],
    };
  }

  async listDirectory(dirPath) {
    const absolutePath = path.resolve(dirPath);
    
    if (!await fs.pathExists(absolutePath)) {
      throw new Error(`目录不存在: ${dirPath}`);
    }

    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      throw new Error(`路径不是目录: ${dirPath}`);
    }

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const items = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name),
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(items, null, 2),
        },
      ],
    };
  }

  async createDirectory(dirPath) {
    const absolutePath = path.resolve(dirPath);
    
    await fs.ensureDir(absolutePath);
    
    return {
      content: [
        {
          type: 'text',
          text: `目录已创建: ${dirPath}`,
        },
      ],
    };
  }

  async deleteFile(filePath) {
    const absolutePath = path.resolve(filePath);
    
    if (!await fs.pathExists(absolutePath)) {
      throw new Error(`路径不存在: ${filePath}`);
    }

    await fs.remove(absolutePath);
    
    return {
      content: [
        {
          type: 'text',
          text: `已删除: ${filePath}`,
        },
      ],
    };
  }

  async getDirectoryTree(dirPath, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      return { path: dirPath, type: 'directory', children: '...' };
    }

    const absolutePath = path.resolve(dirPath);
    const stats = await fs.stat(absolutePath);

    if (stats.isFile()) {
      return {
        path: dirPath,
        type: 'file',
        size: stats.size,
      };
    }

    if (stats.isDirectory()) {
      try {
        const entries = await fs.readdir(absolutePath, { withFileTypes: true });
        const children = [];

        for (const entry of entries.slice(0, 20)) { // 限制子项数量
          const childPath = path.join(dirPath, entry.name);
          const child = await this.getDirectoryTree(childPath, maxDepth, currentDepth + 1);
          children.push(child);
        }

        return {
          path: dirPath,
          type: 'directory',
          children,
        };
      } catch (error) {
        return {
          path: dirPath,
          type: 'directory',
          error: error.message,
        };
      }
    }

    return { path: dirPath, type: 'unknown' };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('文件系统MCP服务器已启动');
  }
}

// 启动服务器
if (require.main === module) {
  const server = new FileSystemMCPServer();
  server.run().catch(error => {
    console.error('服务器启动失败:', error);
    process.exit(1);
  });
}

module.exports = FileSystemMCPServer;
