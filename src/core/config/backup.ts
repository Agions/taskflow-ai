/**
 * 配置备份与恢复
 */

import path = require('path');
import fs = require('fs-extra');
import { CONFIG_FILE } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants';
import { ConfigOperations } from './operations';
import { validateConfig } from '../../utils/config';

/**
 * 配置备份管理器
 */
export class ConfigBackupManager {
  constructor(private operations: ConfigOperations) {}

  /**
   * 备份配置文件
   */
  async backupConfig(): Promise<string> {
    const exists = await this.operations.configExists();
    if (!exists) {
      throw createTaskFlowError('config', ERROR_CODES.CONFIG_NOT_FOUND, '配置文件不存在，无法备份');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.operations.getConfigDir(),
      `${CONFIG_FILE}.backup.${timestamp}`
    );

    await fs.copy(this.operations.getConfigPath(), backupPath);
    return backupPath;
  }

  /**
   * 恢复配置文件
   */
  async restoreConfig(backupPath: string): Promise<void> {
    if (!(await fs.pathExists(backupPath))) {
      throw createTaskFlowError('config', ERROR_CODES.FILE_NOT_FOUND, '备份文件不存在');
    }

    const backupData = await fs.readJson(backupPath);
    const validation = validateConfig(backupData);

    if (!validation.valid) {
      throw createTaskFlowError(
        'config',
        ERROR_CODES.CONFIG_INVALID,
        `备份文件无效: ${validation.errors?.join(', ')}`
      );
    }

    await fs.copy(backupPath, this.operations.getConfigPath());
  }

  /**
   * 列出所有备份
   */
  async listBackups(): Promise<{ path: string; created: Date; size: number }[]> {
    const configDir = this.operations.getConfigDir();

    if (!(await fs.pathExists(configDir))) {
      return [];
    }

    const files = await fs.readdir(configDir);
    const backups = [];

    for (const file of files) {
      if (file.startsWith(`${CONFIG_FILE}.backup.`)) {
        const fullPath = path.join(configDir, file);
        const stats = await fs.stat(fullPath);
        backups.push({
          path: fullPath,
          created: stats.mtime,
          size: stats.size,
        });
      }
    }

    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * 清理旧备份
   */
  async cleanupOldBackups(keepCount: number = 5): Promise<number> {
    const backups = await this.listBackups();

    if (backups.length <= keepCount) {
      return 0;
    }

    const toDelete = backups.slice(keepCount);
    let deleted = 0;

    for (const backup of toDelete) {
      await fs.remove(backup.path);
      deleted++;
    }

    return deleted;
  }
}
