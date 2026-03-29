import { getLogger } from '../../utils/logger';
const logger = getLogger('mcp/security/validator');

/**
 * 安全验证工具
 */

import path from 'path';

/**
 * 允许的命令白名单
 */
const ALLOWED_COMMANDS = new Set([
  'git',
  'npm',
  'pnpm',
  'yarn',
  'node',
  'python',
  'python3',
  'pip',
  'pip3',
  'docker',
  'docker-compose',
  'kubectl',
  'terraform',
  'ansible',
  'curl',
  'wget',
  'tar',
  'gzip',
  'gunzip',
  'zip',
  'unzip',
  'find',
  'grep',
  'sed',
  'awk',
  'cat',
  'head',
  'tail',
  'wc',
  'sort',
  'uniq',
  'mkdir',
  'rmdir',
  'cp',
  'mv',
  'rm',
  'ls',
  'pwd',
  'cd',
  'echo',
  'touch',
  'chmod',
  'chown',
  'npx',
  'ts-node',
  'jest',
  'vitest',
  'eslint',
  'prettier',
  'typescript',
  'rollup',
  'vite',
]);

/**
 * 危险模式
 */
const DANGEROUS_PATTERNS = [
  /;\s*rm\s+/i,
  /;\s*wget\s+/i,
  /;\s*curl\s+/i,
  /\|/,
  /&&\s*rm/i,
  /\b(wget|curl)\s+http/i,
  /\brm\s+-rf\s+\//i,
  /\$\(/,
  /`/,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\brequire\s*\(/i,
  /\bimport\s*\(/i,
  /\bopen\s*\(/i,
  /\/etc\/passwd/,
  /\/etc\/shadow/,
  /\.ssh\//,
  /\.git\/config/,
  /known_hosts/,
  /authorized_keys/,
];

/**
 * 内网地址模式
 */
const INTERNAL_HOSTS = [
  /^127\./,
  /^localhost$/i,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
  /^169\.254\.169\.254$/, // AWS/GCP/Azure metadata
  /^metadata\.google\./i,
  /^100\.100\./, // Alibaba Cloud metadata
  /^(.*\.)?localhost$/i,
  /^(.*\.)?internal$/i,
  /^(.*\.)?lan$/i,
];

/**
 * 验证命令是否安全
 */
export function validateCommand(command: string): { valid: boolean; reason?: string } {
  const trimmed = command.trim();

  // 检查危险模式
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: `命令包含危险模式: ${pattern}` };
    }
  }

  // 检查是否在白名单中（仅检查第一个命令）
  const firstCmd = trimmed.split(/\s+/)[0];
  if (firstCmd && !ALLOWED_COMMANDS.has(firstCmd)) {
    return { valid: false, reason: `命令不在白名单中: ${firstCmd}` };
  }

  return { valid: true };
}

/**
 * 验证URL是否安全（防SSRF）
 */
export function validateUrl(urlString: string): { valid: boolean; reason?: string } {
  try {
    const url = new URL(urlString);

    // 仅允许 http/https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, reason: '仅允许 HTTP/HTTPS 协议' };
    }

    // 检查主机名
    const hostname = url.hostname.toLowerCase();

    for (const pattern of INTERNAL_HOSTS) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: `禁止访问内网地址: ${hostname}` };
      }
    }

    // 检查是否为IPV6内网地址
    if (hostname.startsWith('[')) {
      // 简单检查IPv6地址
      const ipv6 = hostname.replace(/[[\]]/g, '');
      if (ipv6.startsWith('fe80:') || ipv6.startsWith('fc00:') || ipv6 === '::1') {
        return { valid: false, reason: `禁止访问内网IPv6地址: ${hostname}` };
      }
    }

    // DNS Rebinding 检查 - 确保解析后的IP也是安全的
    // 这里简化处理，实际应异步解析后验证

    return { valid: true };
  } catch {
    return { valid: false, reason: '无效的URL格式' };
  }
}

/**
 * 验证文件路径是否安全（防路径遍历）
 */
export function validateFilePath(
  filePath: string,
  allowedBaseDir?: string
): { valid: boolean; reason?: string; resolvedPath?: string } {
  try {
    // 解析路径
    const resolved = path.resolve(filePath);

    // 检查危险路径
    const dangerousPaths = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/sudoers',
      '/root/.ssh',
      '/home/*/.ssh',
      '/.ssh',
      '/.git',
      '/proc',
      '/sys',
      '/dev',
    ];

    for (const dp of dangerousPaths) {
      if (dp.includes('*')) {
        // 通配符匹配
        const regex = new RegExp('^' + dp.replace(/\*/g, '[^/]+') + '.*');
        if (regex.test(resolved)) {
          return { valid: false, reason: `禁止访问系统路径: ${dp}` };
        }
      } else if (resolved.startsWith(dp) || resolved === dp) {
        return { valid: false, reason: `禁止访问系统路径: ${dp}` };
      }
    }

    // 如果指定了基础目录，确保文件在基础目录内
    if (allowedBaseDir) {
      const baseResolved = path.resolve(allowedBaseDir);
      if (!resolved.startsWith(baseResolved + path.sep) && resolved !== baseResolved) {
        return { valid: false, reason: `文件路径超出允许目录: ${allowedBaseDir}` };
      }
    }

    return { valid: true, resolvedPath: resolved };
  } catch {
    return { valid: false, reason: '无效的文件路径' };
  }
}

/**
 * 验证下载路径是否安全
 */
export function validateDownloadPath(
  downloadPath: string,
  allowedDirs: string[] = ['./downloads', './output', './temp']
): { valid: boolean; reason?: string; resolvedPath?: string } {
  const resolved = path.resolve(downloadPath);

  // 解析允许的目录
  const allowedResolved = allowedDirs.map(d => path.resolve(d));

  // 检查是否在允许目录内
  for (const dir of allowedResolved) {
    if (resolved.startsWith(dir + path.sep) || resolved === dir) {
      return { valid: true, resolvedPath: resolved };
    }
  }

  return {
    valid: false,
    reason: `下载路径必须在允许目录内: ${allowedDirs.join(', ')}`,
  };
}
