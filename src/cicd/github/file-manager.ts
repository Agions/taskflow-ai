/**
 * GitHub Actions 文件管理器
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export class GitHubFileManager {
  private workflowsDir: string;

  constructor(cwd: string = process.cwd()) {
    this.workflowsDir = path.join(cwd, '.github', 'workflows');
  }

  async ensureWorkflowsDir(): Promise<void> {
    await fs.ensureDir(this.workflowsDir);
  }

  async writeWorkflow(name: string, content: string): Promise<void> {
    await this.ensureWorkflowsDir();
    const filePath = path.join(this.workflowsDir, `${name}.yml`);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readWorkflow(name: string): Promise<string | null> {
    const filePath = path.join(this.workflowsDir, `${name}.yml`);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async deleteWorkflow(name: string): Promise<void> {
    const filePath = path.join(this.workflowsDir, `${name}.yml`);
    await fs.remove(filePath);
  }

  async listWorkflows(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.workflowsDir);
      return files
        .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
        .map(f => path.basename(f, path.extname(f)));
    } catch {
      return [];
    }
  }

  async workflowExists(name: string): Promise<boolean> {
    const filePath = path.join(this.workflowsDir, `${name}.yml`);
    return fs.pathExists(filePath);
  }
}
