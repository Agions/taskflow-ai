/**
 * 配置管理器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ToolPackage } from '../types';

export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), '.taskflow', 'config.json');
  }

  async savePackage(pkg: ToolPackage): Promise<void> {
    const config = await this.loadConfig();

    config.installedPackages = config.installedPackages || {};
    config.installedPackages[pkg.name] = {
      version: pkg.version,
      installedAt: new Date().toISOString(),
      tools: pkg.tools || [],
    };

    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  async removePackage(packageName: string): Promise<void> {
    const config = await this.loadConfig();

    if (config.installedPackages?.[packageName]) {
      delete config.installedPackages[packageName];
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    }
  }

  async loadInstalledPackages(): Promise<Array<{ name: string; version: string }>> {
    const config = await this.loadConfig();
    const packages = config.installedPackages || {};

    return Object.entries(packages).map(([name, info]: [string, any]) => ({
      name,
      version: info.version,
    }));
  }

  private async loadConfig(): Promise<any> {
    if (await fs.pathExists(this.configPath)) {
      return fs.readJson(this.configPath);
    }
    return {};
  }
}
