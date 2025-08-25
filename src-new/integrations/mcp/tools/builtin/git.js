/**
 * 内置Git操作MCP服务器
 * 提供版本控制操作工具
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class GitMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'git-operations',
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
            name: 'git_status',
            description: '获取Git仓库状态',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径（可选，默认当前目录）',
                },
              },
            },
          },
          {
            name: 'git_log',
            description: '查看Git提交历史',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径',
                },
                count: {
                  type: 'number',
                  description: '显示提交数量',
                  default: 10,
                },
                oneline: {
                  type: 'boolean',
                  description: '简洁显示',
                  default: false,
                },
              },
            },
          },
          {
            name: 'git_diff',
            description: '查看文件差异',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径',
                },
                file: {
                  type: 'string',
                  description: '特定文件路径（可选）',
                },
                staged: {
                  type: 'boolean',
                  description: '查看暂存区差异',
                  default: false,
                },
              },
            },
          },
          {
            name: 'git_add',
            description: '添加文件到暂存区',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径',
                },
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '要添加的文件列表',
                },
                all: {
                  type: 'boolean',
                  description: '添加所有变更文件',
                  default: false,
                },
              },
            },
          },
          {
            name: 'git_commit',
            description: '提交变更',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径',
                },
                message: {
                  type: 'string',
                  description: '提交信息',
                },
                amend: {
                  type: 'boolean',
                  description: '修正上次提交',
                  default: false,
                },
              },
              required: ['message'],
            },
          },
          {
            name: 'git_branch',
            description: '分支操作',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径',
                },
                action: {
                  type: 'string',
                  enum: ['list', 'create', 'delete', 'switch'],
                  description: '操作类型',
                },
                name: {
                  type: 'string',
                  description: '分支名称（创建、删除、切换时必需）',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'git_merge',
            description: '合并分支',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: '仓库路径',
                },
                branch: {
                  type: 'string',
                  description: '要合并的分支',
                },
                strategy: {
                  type: 'string',
                  enum: ['merge', 'rebase', 'squash'],
                  description: '合并策略',
                  default: 'merge',
                },
              },
              required: ['branch'],
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
          case 'git_status':
            return await this.gitStatus(args.path);

          case 'git_log':
            return await this.gitLog(args.path, args.count, args.oneline);

          case 'git_diff':
            return await this.gitDiff(args.path, args.file, args.staged);

          case 'git_add':
            return await this.gitAdd(args.path, args.files, args.all);

          case 'git_commit':
            return await this.gitCommit(args.path, args.message, args.amend);

          case 'git_branch':
            return await this.gitBranch(args.path, args.action, args.name);

          case 'git_merge':
            return await this.gitMerge(args.path, args.branch, args.strategy);

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
            uri: 'git://repository-info',
            name: 'Git仓库信息',
            description: '当前Git仓库的详细信息',
            mimeType: 'application/json',
          },
          {
            uri: 'git://commit-history',
            name: 'Git提交历史',
            description: '仓库的提交历史记录',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // 处理资源请求
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;

      if (uri === 'git://repository-info') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(await this.getRepositoryInfo(), null, 2),
            },
          ],
        };
      }

      if (uri === 'git://commit-history') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(await this.getCommitHistory(), null, 2),
            },
          ],
        };
      }

      throw new Error(`未知资源: ${uri}`);
    });
  }

  async gitStatus(repoPath = process.cwd()) {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      const output = execSync('git status --porcelain', {
        cwd: workingDir,
        encoding: 'utf8',
      });

      const branchOutput = execSync('git branch --show-current', {
        cwd: workingDir,
        encoding: 'utf8',
      }).trim();

      const files = output.split('\n').filter(line => line.trim()).map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        return { status, file };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              branch: branchOutput,
              files,
              clean: files.length === 0,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git status 失败: ${error.message}`);
    }
  }

  async gitLog(repoPath = process.cwd(), count = 10, oneline = false) {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      const format = oneline ? '--oneline' : '--pretty=format:"%H|%an|%ae|%ad|%s"';
      const output = execSync(`git log ${format} -${count}`, {
        cwd: workingDir,
        encoding: 'utf8',
      });

      let commits;
      if (oneline) {
        commits = output.split('\n').filter(line => line.trim());
      } else {
        commits = output.split('\n').filter(line => line.trim()).map(line => {
          const [hash, author, email, date, message] = line.split('|');
          return { hash, author, email, date, message };
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ commits }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git log 失败: ${error.message}`);
    }
  }

  async gitDiff(repoPath = process.cwd(), file = null, staged = false) {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      let command = 'git diff';
      if (staged) command += ' --staged';
      if (file) command += ` -- "${file}"`;

      const output = execSync(command, {
        cwd: workingDir,
        encoding: 'utf8',
      });

      return {
        content: [
          {
            type: 'text',
            text: output || '没有差异',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git diff 失败: ${error.message}`);
    }
  }

  async gitAdd(repoPath = process.cwd(), files = [], all = false) {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      let command = 'git add';
      if (all) {
        command += ' -A';
      } else if (files && files.length > 0) {
        command += ' ' + files.map(f => `"${f}"`).join(' ');
      } else {
        throw new Error('请指定要添加的文件或使用 all 选项');
      }

      execSync(command, {
        cwd: workingDir,
        encoding: 'utf8',
      });

      return {
        content: [
          {
            type: 'text',
            text: '文件已添加到暂存区',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git add 失败: ${error.message}`);
    }
  }

  async gitCommit(repoPath = process.cwd(), message, amend = false) {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      let command = `git commit -m "${message}"`;
      if (amend) command += ' --amend';

      const output = execSync(command, {
        cwd: workingDir,
        encoding: 'utf8',
      });

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git commit 失败: ${error.message}`);
    }
  }

  async gitBranch(repoPath = process.cwd(), action, name = null) {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      let command;
      let output;

      switch (action) {
        case 'list':
          command = 'git branch -a';
          output = execSync(command, { cwd: workingDir, encoding: 'utf8' });
          break;

        case 'create':
          if (!name) throw new Error('创建分支需要指定分支名');
          command = `git branch "${name}"`;
          execSync(command, { cwd: workingDir, encoding: 'utf8' });
          output = `分支 "${name}" 已创建`;
          break;

        case 'delete':
          if (!name) throw new Error('删除分支需要指定分支名');
          command = `git branch -d "${name}"`;
          execSync(command, { cwd: workingDir, encoding: 'utf8' });
          output = `分支 "${name}" 已删除`;
          break;

        case 'switch':
          if (!name) throw new Error('切换分支需要指定分支名');
          command = `git checkout "${name}"`;
          output = execSync(command, { cwd: workingDir, encoding: 'utf8' });
          break;

        default:
          throw new Error(`未知的分支操作: ${action}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git branch 操作失败: ${error.message}`);
    }
  }

  async gitMerge(repoPath = process.cwd(), branch, strategy = 'merge') {
    const workingDir = path.resolve(repoPath);
    
    if (!await this.isGitRepository(workingDir)) {
      throw new Error(`目录不是Git仓库: ${repoPath}`);
    }

    try {
      let command;
      
      switch (strategy) {
        case 'merge':
          command = `git merge "${branch}"`;
          break;
        case 'rebase':
          command = `git rebase "${branch}"`;
          break;
        case 'squash':
          command = `git merge --squash "${branch}"`;
          break;
        default:
          throw new Error(`未知的合并策略: ${strategy}`);
      }

      const output = execSync(command, {
        cwd: workingDir,
        encoding: 'utf8',
      });

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git merge 失败: ${error.message}`);
    }
  }

  async getRepositoryInfo() {
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', {
        encoding: 'utf8',
      }).trim();

      const currentBranch = execSync('git branch --show-current', {
        encoding: 'utf8',
      }).trim();

      const lastCommit = execSync('git log -1 --pretty=format:"%H|%an|%ad|%s"', {
        encoding: 'utf8',
      }).trim();

      const [hash, author, date, message] = lastCommit.split('|');

      return {
        remoteUrl,
        currentBranch,
        lastCommit: { hash, author, date, message },
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getCommitHistory(count = 20) {
    try {
      const output = execSync(`git log --pretty=format:"%H|%an|%ae|%ad|%s" -${count}`, {
        encoding: 'utf8',
      });

      const commits = output.split('\n').filter(line => line.trim()).map(line => {
        const [hash, author, email, date, message] = line.split('|');
        return { hash, author, email, date, message };
      });

      return { commits };
    } catch (error) {
      return { error: error.message };
    }
  }

  async isGitRepository(dir) {
    try {
      await fs.access(path.join(dir, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git操作MCP服务器已启动');
  }
}

// 启动服务器
if (require.main === module) {
  const server = new GitMCPServer();
  server.run().catch(error => {
    console.error('服务器启动失败:', error);
    process.exit(1);
  });
}

module.exports = GitMCPServer;