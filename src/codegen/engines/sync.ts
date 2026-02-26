/**
 * 代码同步器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { GeneratedComponent, SyncConfig } from '../types';

export class CodeSyncer {
  constructor(private outputDir: string) {}

  async sync(
    component: GeneratedComponent,
    config?: Partial<SyncConfig>
  ): Promise<{ success: boolean; syncedFiles: string[]; error?: string }> {
    const syncConfig: SyncConfig = {
      strategy: 'overwrite',
      backup: true,
      dryRun: false,
      ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...config
    };

    const syncedFiles: string[] = [];

    try {
      for (const file of component.files) {
        const targetPath = path.join(this.outputDir, file.path);

        if (this.shouldIgnore(targetPath, syncConfig.ignorePatterns)) {
          continue;
        }

        if (syncConfig.backup && await fs.pathExists(targetPath)) {
          const backupPath = `${targetPath}.backup-${Date.now()}`;
          await fs.copy(targetPath, backupPath);
        }

        const exists = await fs.pathExists(targetPath);

        if (exists && syncConfig.strategy === 'skip') {
          console.log(`⏭️  Skipped: ${file.path}`);
          continue;
        }

        if (!syncConfig.dryRun) {
          await fs.ensureDir(path.dirname(targetPath));
          await fs.writeFile(targetPath, file.content, 'utf-8');
        }

        syncedFiles.push(file.path);
        console.log(`✅ ${syncConfig.dryRun ? '[DRY RUN] ' : ''}Synced: ${file.path}`);
      }

      return { success: true, syncedFiles };
    } catch (error) {
      return {
        success: false,
        syncedFiles,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private shouldIgnore(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => filePath.includes(pattern));
  }
}
