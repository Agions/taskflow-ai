import { getLogger } from '../../utils/logger';
/**
 * 文件系统工具 - 扩展的文件操作
 */

import { ToolDefinition } from './types';
import { validateFilePath } from '../security/validator';
const logger = getLogger('mcp/tools/filesystem');


export const filesystemTools: ToolDefinition[] = [
  {
    name: 'fs_readDir',
    description: '读取目录内容',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' },
        options: {
          type: 'object',
          properties: {
            withFileTypes: { type: 'boolean', description: '返回文件类型信息' },
            recursive: { type: 'boolean', description: '递归读取子目录' },
          },
        },
      },
      required: ['path'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const result = entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        isSymbolicLink: entry.isSymbolicLink(),
      }));
      return { path: fullPath, entries: result, count: result.length };
    },
    category: 'filesystem',
    tags: ['fs', 'dir', 'read'],
  },
  {
    name: 'fs_mkdir',
    description: '创建目录',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' },
        options: {
          type: 'object',
          properties: {
            recursive: { type: 'boolean', description: '递归创建' },
            mode: { type: 'number', description: '权限模式' },
          },
        },
      },
      required: ['path'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      const options = (input.options as object) || {};
      await fs.mkdir(fullPath, { recursive: (options as any)?.recursive ?? true });
      return { success: true, path: fullPath };
    },
    category: 'filesystem',
    tags: ['fs', 'mkdir', 'create'],
  },
  {
    name: 'fs_remove',
    description: '删除文件或目录',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '路径' },
        options: {
          type: 'object',
          properties: {
            recursive: { type: 'boolean', description: '递归删除' },
            force: { type: 'boolean', description: '忽略不存在' },
          },
        },
      },
      required: ['path'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      const options = (input.options as object) || {};
      await fs.rm(fullPath, {
        recursive: (options as any)?.recursive ?? false,
        force: (options as any)?.force ?? false,
      });
      return { success: true, path: fullPath };
    },
    category: 'filesystem',
    tags: ['fs', 'rm', 'delete'],
  },
  {
    name: 'fs_copy',
    description: '复制文件或目录',
    inputSchema: {
      type: 'object',
      properties: {
        src: { type: 'string', description: '源路径' },
        dest: { type: 'string', description: '目标路径' },
        options: {
          type: 'object',
          properties: {
            recursive: { type: 'boolean', description: '递归复制' },
            overwrite: { type: 'boolean', description: '覆盖已存在' },
          },
        },
      },
      required: ['src', 'dest'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证源路径安全性
      const srcValidation = validateFilePath(input.src as string);
      if (!srcValidation.valid) {
        throw new Error(`源路径验证失败: ${srcValidation.reason}`);
      }

      // 验证目标路径安全性
      const destValidation = validateFilePath(input.dest as string);
      if (!destValidation.valid) {
        throw new Error(`目标路径验证失败: ${destValidation.reason}`);
      }

      const srcPath = path.resolve(input.src as string);
      const destPath = path.resolve(input.dest as string);
      const options = (input.options as object) || {};

      const srcStat = await fs.stat(srcPath);
      if (srcStat.isDirectory()) {
        await fs.cp(srcPath, destPath, {
          recursive: (options as any)?.recursive ?? true,
        });
      } else {
        // 文件覆盖检查
        try {
          await fs.access(destPath);
          if (!(options as any)?.overwrite) {
            throw new Error('目标文件已存在');
          }
        } catch {
          // 文件不存在，可以继续
        }
        await fs.copyFile(srcPath, destPath);
      }
      return { success: true, src: srcPath, dest: destPath };
    },
    category: 'filesystem',
    tags: ['fs', 'cp', 'copy'],
  },
  {
    name: 'fs_move',
    description: '移动/重命名文件或目录',
    inputSchema: {
      type: 'object',
      properties: {
        src: { type: 'string', description: '源路径' },
        dest: { type: 'string', description: '目标路径' },
      },
      required: ['src', 'dest'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const srcValidation = validateFilePath(input.src as string);
      if (!srcValidation.valid) {
        throw new Error(`源路径验证失败: ${srcValidation.reason}`);
      }

      const destValidation = validateFilePath(input.dest as string);
      if (!destValidation.valid) {
        throw new Error(`目标路径验证失败: ${destValidation.reason}`);
      }

      const srcPath = path.resolve(input.src as string);
      const destPath = path.resolve(input.dest as string);
      await fs.rename(srcPath, destPath);
      return { success: true, src: srcPath, dest: destPath };
    },
    category: 'filesystem',
    tags: ['fs', 'mv', 'move', 'rename'],
  },
  {
    name: 'fs_stat',
    description: '获取文件/目录状态',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件或目录路径' },
      },
      required: ['path'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      const stat = await fs.stat(fullPath);
      return {
        path: fullPath,
        size: stat.size,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        isSymbolicLink: stat.isSymbolicLink(),
        created: stat.birthtime,
        modified: stat.mtime,
        accessed: stat.atime,
        mode: stat.mode,
      };
    },
    category: 'filesystem',
    tags: ['fs', 'stat', 'info'],
  },
  {
    name: 'fs_exists',
    description: '检查文件或目录是否存在',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '路径' },
      },
      required: ['path'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      try {
        await fs.access(fullPath);
        return { exists: true, path: fullPath };
      } catch {
        return { exists: false, path: fullPath };
      }
    },
    category: 'filesystem',
    tags: ['fs', 'exists', 'check'],
  },
  {
    name: 'fs_readJson',
    description: '读取并解析 JSON 文件',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'JSON 文件路径' },
      },
      required: ['path'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      const content = await fs.readFile(fullPath, 'utf-8');
      const data = JSON.parse(content);
      return { path: fullPath, data };
    },
    category: 'filesystem',
    tags: ['fs', 'json', 'read'],
  },
  {
    name: 'fs_writeJson',
    description: '写入 JSON 文件',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'JSON 文件路径' },
        data: { type: 'object', description: '要写入的数据' },
        options: {
          type: 'object',
          properties: {
            pretty: { type: 'number', description: '缩进空格数' },
          },
        },
      },
      required: ['path', 'data'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');

      // 验证路径安全性
      const validation = validateFilePath(input.path as string);
      if (!validation.valid) {
        throw new Error(`路径验证失败: ${validation.reason}`);
      }

      const fullPath = path.resolve(input.path as string);
      const options = (input.options as object) || {};
      const pretty = (options as any)?.pretty ?? 2;
      const content = JSON.stringify(input.data, null, pretty);
      await fs.writeFile(fullPath, content, 'utf-8');
      return { success: true, path: fullPath };
    },
    category: 'filesystem',
    tags: ['fs', 'json', 'write'],
  },
  {
    name: 'fs_glob',
    description: '使用 glob 模式匹配文件',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'glob 模式，如 **/*.ts' },
        options: {
          type: 'object',
          properties: {
            cwd: { type: 'string', description: '工作目录' },
            absolute: { type: 'boolean', description: '返回绝对路径' },
          },
        },
      },
      required: ['pattern'],
    },
    handler: async input => {
      const path = await import('path');
      const fs = await import('fs/promises');
      const options = (input.options as object) || {};
      const cwd = (options as any)?.cwd || process.cwd();
      const absolute = (options as any)?.absolute ?? true;

      // 验证基础目录安全性
      const cwdValidation = validateFilePath(cwd);
      if (!cwdValidation.valid) {
        throw new Error(`工作目录验证失败: ${cwdValidation.reason}`);
      }

      // 简单的 glob 实现
      const pattern = input.pattern as string;
      const baseDir = path.resolve(cwd);

      // 解析 pattern
      const regexPattern = pattern
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\{\{GLOBSTAR\}\}/g, '.*')
        .replace(/\?/g, '[^/]');

      const regex = new RegExp(`^${regexPattern}$`);

      const matches: string[] = [];

      async function walk(dir: string): Promise<void> {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            if (regex.test(relativePath) || regex.test(entry.name)) {
              matches.push(absolute ? fullPath : relativePath);
            }

            if (entry.isDirectory()) {
              await walk(fullPath);
            }
          }
        } catch {
          // 忽略权限错误
        }
      }

      await walk(baseDir);

      return { pattern: input.pattern, matches, count: matches.length };
    },
    category: 'filesystem',
    tags: ['fs', 'glob', 'match'],
  },
];
