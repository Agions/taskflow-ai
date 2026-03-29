import { getLogger } from '../../utils/logger';
/**
 * Git 工具 - 版本控制操作
 */

import { ToolDefinition } from './types';
import { execSync } from 'child_process';
import { promisify } from 'util';
const logger = getLogger('mcp/tools/git');


const execAsync = promisify(execSync);

async function gitExec(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const stdout = execSync(`git ${args.join(' ')}`, {
      cwd,
      encoding: 'utf-8',
    });
    return { stdout, stderr: '', code: 0 };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      code: err.status || 1,
    };
  }
}

export const gitTools: ToolDefinition[] = [
  {
    name: 'git_status',
    description: '获取 Git 仓库状态',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
      },
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const result = await gitExec(['status', '--porcelain'], cwd);

      if (result.code !== 0) {
        return { success: false, error: result.stderr };
      }

      const files = result.stdout.trim().split('\n').filter(Boolean);
      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];

      for (const file of files) {
        const status = file.substring(0, 2);
        const filename = file.substring(3);

        if (status.includes('?')) {
          untracked.push(filename);
        } else if (status.includes('M')) {
          modified.push(filename);
        } else {
          staged.push(filename);
        }
      }

      // 获取分支名
      let branch = '';
      try {
        branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
      } catch {}

      return {
        success: true,
        branch,
        staged,
        modified,
        untracked,
        isClean: files.length === 0,
      };
    },
    category: 'git',
    tags: ['git', 'status'],
  },
  {
    name: 'git_log',
    description: '获取 Git 提交历史',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
        maxCount: { type: 'number', description: '最大提交数', default: 10 },
        format: {
          type: 'string',
          description: '输出格式',
          default: '%H|%an|%ae|%at|%s',
        },
      },
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const maxCount = (input.maxCount as number) || 10;
      const format = (input.format as string) || '%H|%an|%ae|%at|%s';

      const result = await gitExec(['log', `--max-count=${maxCount}`, `--format=${format}`], cwd);

      if (result.code !== 0) {
        return { success: false, error: result.stderr };
      }

      const commits = result.stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [hash, author, email, timestamp, message] = line.split('|');
          return { hash, author, email, timestamp: parseInt(timestamp), message };
        });

      return { success: true, commits };
    },
    category: 'git',
    tags: ['git', 'log', 'history'],
  },
  {
    name: 'git_branch',
    description: '列出 Git 分支',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
        all: { type: 'boolean', description: '显示所有分支', default: true },
      },
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const all = input.all !== false;

      const args = ['branch'];
      if (all) args.push('-a');

      const result = await gitExec(args, cwd);

      if (result.code !== 0) {
        return { success: false, error: result.stderr };
      }

      const branches = result.stdout
        .trim()
        .split('\n')
        .map(b => b.replace(/^\*?\s*/, '').trim())
        .filter(Boolean);

      // 获取当前分支
      let current = '';
      try {
        current = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
      } catch {}

      return { success: true, branches, current };
    },
    category: 'git',
    tags: ['git', 'branch'],
  },
  {
    name: 'git_commit',
    description: '创建 Git 提交',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
        message: { type: 'string', description: '提交信息' },
        all: { type: 'boolean', description: '自动暂存所有文件', default: true },
      },
      required: ['message'],
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const message = input.message as string;
      const all = input.all !== false;

      // git add
      if (all) {
        await gitExec(['add', '-A'], cwd);
      }

      // git commit
      const result = await gitExec(['commit', '-m', message], cwd);

      if (result.code !== 0) {
        return { success: false, error: result.stderr };
      }

      // 获取提交 hash
      let hash = '';
      try {
        hash = execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8' }).trim();
      } catch {}

      return { success: true, message, hash };
    },
    category: 'git',
    tags: ['git', 'commit'],
  },
  {
    name: 'git_diff',
    description: '查看文件差异',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
        file: { type: 'string', description: '指定文件' },
        staged: { type: 'boolean', description: '仅显示已暂存', default: false },
        cached: { type: 'boolean', description: '同 staged', default: false },
      },
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const file = input.file as string;
      const staged = (input.staged as boolean) || (input.cached as boolean);

      const args = ['diff'];
      if (staged) args.push('--cached');
      if (file) args.push('--', file);

      const result = await gitExec(args, cwd);

      return {
        success: result.code === 0,
        diff: result.stdout,
        error: result.code !== 0 ? result.stderr : undefined,
      };
    },
    category: 'git',
    tags: ['git', 'diff'],
  },
  {
    name: 'git_push',
    description: '推送到远程仓库',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
        remote: { type: 'string', description: '远程名称', default: 'origin' },
        branch: { type: 'string', description: '分支名' },
        force: { type: 'boolean', description: '强制推送', default: false },
      },
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const remote = (input.remote as string) || 'origin';
      const branch = input.branch as string;
      const force = input.force as boolean;

      const args = ['push', remote];
      if (branch) args.push(branch);
      if (force) args.push('--force');

      const result = await gitExec(args, cwd);

      if (result.code !== 0) {
        return { success: false, error: result.stderr };
      }

      return { success: true, remote, branch: branch || 'current' };
    },
    category: 'git',
    tags: ['git', 'push'],
  },
  {
    name: 'git_pull',
    description: '从远程仓库拉取',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: '仓库目录' },
        remote: { type: 'string', description: '远程名称', default: 'origin' },
        branch: { type: 'string', description: '分支名' },
        rebase: { type: 'boolean', description: '使用 rebase', default: false },
      },
    },
    handler: async input => {
      const cwd = (input.cwd as string) || process.cwd();
      const remote = (input.remote as string) || 'origin';
      const branch = input.branch as string;
      const rebase = input.rebase as boolean;

      const args = ['pull', remote];
      if (branch) args.push(branch);
      if (rebase) args.push('--rebase');

      const result = await gitExec(args, cwd);

      if (result.code !== 0) {
        return { success: false, error: result.stderr };
      }

      return { success: true, remote, branch: branch || 'current' };
    },
    category: 'git',
    tags: ['git', 'pull'],
  },
];
