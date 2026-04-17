/**
 * CI/CD 命令引擎
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { GitHubActionsConfig } from '../../../cicd/types';
import { GitHubActionsIntegration } from '../../../cicd/github';

const CONFIG_PATH = path.join(process.cwd(), '.taskflow', 'cicd-config.json');

/**
 * 获取配置路径
 */
export function getConfigPath(customPath?: string): string {
  return customPath || CONFIG_PATH;
}

/**
 * 检查是否已初始化
 */
export async function isInitialized(customPath?: string): Promise<boolean> {
  return await fs.pathExists(getConfigPath(customPath));
}

/**
 * 加载配置
 */
export async function loadConfig(customPath?: string): Promise<GitHubActionsConfig | null> {
  const configPath = getConfigPath(customPath);
  if (!(await fs.pathExists(configPath))) {
    return null;
  }
  return await fs.readJson(configPath);
}

/**
 * 保存配置
 */
export async function saveConfig(config: GitHubActionsConfig): Promise<void> {
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

/**
 * 获取 GitHub Token
 */
export function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}

/**
 * 检测 GitHub 仓库
 */
export function detectRepo(): string | null {
  const { execSync } = require('child_process');
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)\.git?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * 创建 GitHub Actions 集成
 */
export function createIntegration(repo: string): GitHubActionsIntegration {
  const token = getGitHubToken() || '';
  return new GitHubActionsIntegration(token, repo);
}

/**
 * 验证 GitHub Token
 */
export function validateToken(): { valid: boolean; error?: string } {
  const token = getGitHubToken();
  if (!token) {
    return { valid: false, error: 'GITHUB_TOKEN environment variable not set' };
  }
  return { valid: true };
}
