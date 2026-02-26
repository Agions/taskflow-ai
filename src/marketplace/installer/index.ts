/**
 * MCP 工具包安装器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ToolPackage, InstallResult } from '../types';
import { RegistryManager } from '../registry';
import { PackageDownloader } from './downloader';
import { DependencyManager } from './dependencies';
import { ConfigManager } from './config';

export * from './downloader';
export * from './dependencies';
export * from './config';

export class PackageInstaller {
  private installDir: string;
  private globalDir: string;
  private downloader: PackageDownloader;
  private depManager: DependencyManager;
  private configManager: ConfigManager;

  constructor(
    private registryManager: RegistryManager,
    installDir?: string
  ) {
    this.installDir = installDir || path.join(process.cwd(), '.taskflow', 'packages');
    this.globalDir = path.join(require('os').homedir(), '.taskflow', 'packages');
    this.downloader = new PackageDownloader();
    this.depManager = new DependencyManager(registryManager);
    this.configManager = new ConfigManager();
  }

  async install(
    packageName: string,
    version?: string,
    options?: { global?: boolean; save?: boolean }
  ): Promise<InstallResult> {
    const startTime = Date.now();

    try {
      console.log(`📦 Installing ${packageName}${version ? `@${version}` : ''}...`);

      const pkg = await this.registryManager.getPackage(packageName, version);
      if (!pkg) {
        return {
          success: false,
          package: {} as ToolPackage,
          installedTools: [],
          error: `Package not found: ${packageName}`
        };
      }

      const depTree = await this.depManager.resolve(pkg);
      for (const dep of depTree.dependencies) {
        await this.depManager.installDependency(dep);
      }

      const targetDir = options?.global ? this.globalDir : this.installDir;
      const pkgDir = path.join(targetDir, pkg.name);

      await fs.ensureDir(pkgDir);
      await this.downloader.download(pkg, pkgDir);

      if (Object.keys(pkg.dependencies).length > 0) {
        await this.depManager.installNpmDependencies(pkgDir, pkg.dependencies);
      }

      const installedTools = pkg.tools?.map(t => t.name) || [];

      if (options?.save !== false && !options?.global) {
        await this.configManager.savePackage(pkg);
      }

      console.log(`✅ Installed ${pkg.name}@${pkg.version} in ${Date.now() - startTime}ms`);

      return { success: true, package: pkg, installedTools };
    } catch (error) {
      return {
        success: false,
        package: {} as ToolPackage,
        installedTools: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async uninstall(packageName: string, options?: { global?: boolean }): Promise<boolean> {
    try {
      const targetDir = options?.global ? this.globalDir : this.installDir;
      const pkgDir = path.join(targetDir, packageName);

      if (await fs.pathExists(pkgDir)) {
        await fs.remove(pkgDir);
        await this.configManager.removePackage(packageName);
        console.log(`✅ Uninstalled ${packageName}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Failed to uninstall ${packageName}:`, error);
      return false;
    }
  }

  async update(packageName: string, options?: { global?: boolean }): Promise<InstallResult> {
    try {
      const latestVersion = await this.registryManager.getLatestVersion(packageName);
      if (!latestVersion) {
        return { success: false, package: {} as ToolPackage, installedTools: [], error: 'No version found' };
      }

      await this.uninstall(packageName, options);
      return this.install(packageName, latestVersion, options);
    } catch (error) {
      return {
        success: false,
        package: {} as ToolPackage,
        installedTools: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async listInstalled(options?: { global?: boolean }): Promise<ToolPackage[]> {
    const targetDir = options?.global ? this.globalDir : this.installDir;
    const packages: ToolPackage[] = [];

    if (!(await fs.pathExists(targetDir))) return packages;

    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const pkgJsonPath = path.join(targetDir, entry.name, 'package.json');
          if (await fs.pathExists(pkgJsonPath)) {
            const pkgJson = await fs.readJson(pkgJsonPath);
            packages.push(pkgJson as ToolPackage);
          }
        } catch {}
      }
    }

    return packages;
  }
}

export default PackageInstaller;
