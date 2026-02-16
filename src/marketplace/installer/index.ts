/**
 * MCP 工具包安装器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import tar from 'tar';
import {
  ToolPackage,
  InstallResult,
  DependencyTree
} from '../types';
import { RegistryManager } from '../registry';

export class PackageInstaller {
  private registryManager: RegistryManager;
  private installDir: string;
  private globalDir: string;

  constructor(registryManager: RegistryManager, installDir?: string) {
    this.registryManager = registryManager;
    this.installDir = installDir || path.join(process.cwd(), '.taskflow', 'packages');
    this.globalDir = path.join(require('os').homedir(), '.taskflow', 'packages');
  }

  /**
   * 安装工具包
   */
  async install(
    packageName: string,
    version?: string,
    options?: { global?: boolean; save?: boolean }
  ): Promise<InstallResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      console.log(`📦 Installing ${packageName}${version ? `@${version}` : ''}...`);

      // 1. 获取包信息
      const pkg = await this.registryManager.getPackage(packageName, version);
      if (!pkg) {
        return {
          success: false,
          package: {} as ToolPackage,
          installedTools: [],
          error: `Package not found: ${packageName}`
        };
      }

      // 2. 解析依赖
      const depTree = await this.resolveDependencies(pkg);

      // 3. 安装依赖
      for (const dep of depTree.dependencies) {
        await this.installDependency(dep);
      }

      // 4. 下载并安装包
      const targetDir = options?.global ? this.globalDir : this.installDir;
      const pkgDir = path.join(targetDir, pkg.name);

      await fs.ensureDir(pkgDir);
      await this.downloadPackage(pkg, pkgDir);

      // 5. 安装 npm 依赖
      if (Object.keys(pkg.dependencies).length > 0) {
        await this.installNpmDependencies(pkgDir, pkg.dependencies);
      }

      // 6. 注册工具
      const installedTools = await this.registerTools(pkg, pkgDir);

      // 7. 保存到项目配置
      if (options?.save !== false && !options?.global) {
        await this.saveToProjectConfig(pkg);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Installed ${pkg.name}@${pkg.version} in ${duration}ms`);
      console.log(`   Tools: ${installedTools.join(', ')}`);

      return {
        success: true,
        package: pkg,
        installedTools,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        package: {} as ToolPackage,
        installedTools: [],
        error: errorMessage
      };
    }
  }

  /**
   * 卸载工具包
   */
  async uninstall(packageName: string, options?: { global?: boolean }): Promise<boolean> {
    try {
      const targetDir = options?.global ? this.globalDir : this.installDir;
      const pkgDir = path.join(targetDir, packageName);

      if (await fs.pathExists(pkgDir)) {
        await fs.remove(pkgDir);
        console.log(`✅ Uninstalled ${packageName}`);

        // 从项目配置中移除
        await this.removeFromProjectConfig(packageName);

        return true;
      }

      console.log(`⚠️  Package not installed: ${packageName}`);
      return false;

    } catch (error) {
      console.error(`❌ Failed to uninstall ${packageName}:`, error);
      return false;
    }
  }

  /**
   * 更新工具包
   */
  async update(packageName: string, options?: { global?: boolean }): Promise<InstallResult> {
    try {
      // 获取当前版本
      const currentVersion = await this.getInstalledVersion(packageName, options?.global);

      // 获取最新版本
      const latestVersion = await this.registryManager.getLatestVersion(packageName);

      if (!latestVersion) {
        return {
          success: false,
          package: {} as ToolPackage,
          installedTools: [],
          error: `Could not get latest version for ${packageName}`
        };
      }

      if (currentVersion === latestVersion) {
        console.log(`✅ ${packageName} is already up to date (${currentVersion})`);
        return {
          success: true,
          package: await this.registryManager.getPackage(packageName, currentVersion) || {} as ToolPackage,
          installedTools: []
        };
      }

      console.log(`🔄 Updating ${packageName} from ${currentVersion} to ${latestVersion}...`);

      // 卸载旧版本
      await this.uninstall(packageName, options);

      // 安装新版本
      return await this.install(packageName, latestVersion, options);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        package: {} as ToolPackage,
        installedTools: [],
        error: errorMessage
      };
    }
  }

  /**
   * 列出已安装的包
   */
  async listInstalled(options?: { global?: boolean }): Promise<ToolPackage[]> {
    const targetDir = options?.global ? this.globalDir : this.installDir;
    const packages: ToolPackage[] = [];

    if (!(await fs.pathExists(targetDir))) {
      return packages;
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pkgJsonPath = path.join(targetDir, entry.name, 'package.json');
        if (await fs.pathExists(pkgJsonPath)) {
          try {
            const pkgJson = await fs.readJson(pkgJsonPath);
            packages.push(pkgJson as ToolPackage);
          } catch {
            // 忽略无效包
          }
        }
      }
    }

    return packages;
  }

  /**
   * 检查包是否已安装
   */
  async isInstalled(packageName: string, options?: { global?: boolean }): Promise<boolean> {
    const targetDir = options?.global ? this.globalDir : this.installDir;
    const pkgDir = path.join(targetDir, packageName);
    return await fs.pathExists(pkgDir);
  }

  /**
   * 获取已安装版本
   */
  async getInstalledVersion(packageName: string, global?: boolean): Promise<string | null> {
    const targetDir = global ? this.globalDir : this.installDir;
    const pkgJsonPath = path.join(targetDir, packageName, 'package.json');

    if (await fs.pathExists(pkgJsonPath)) {
      try {
        const pkgJson = await fs.readJson(pkgJsonPath);
        return pkgJson.version || null;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * 解析依赖树
   */
  private async resolveDependencies(pkg: ToolPackage): Promise<DependencyTree> {
    const tree: DependencyTree = {
      name: pkg.name,
      version: pkg.version,
      dependencies: []
    };

    for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
      const depPkg = await this.registryManager.getPackage(depName, depVersion);
      if (depPkg) {
        const depTree = await this.resolveDependencies(depPkg);
        tree.dependencies.push(depTree);
      }
    }

    return tree;
  }

  /**
   * 安装依赖
   */
  private async installDependency(dep: DependencyTree): Promise<void> {
    const pkgDir = path.join(this.installDir, dep.name);

    if (await fs.pathExists(pkgDir)) {
      // 已安装，检查版本
      const installedVersion = await this.getInstalledVersion(dep.name);
      if (installedVersion === dep.version) {
        return; // 版本匹配，跳过
      }
    }

    // 下载并安装
    const pkg = await this.registryManager.getPackage(dep.name, dep.version);
    if (pkg) {
      await fs.ensureDir(pkgDir);
      await this.downloadPackage(pkg, pkgDir);
    }
  }

  /**
   * 下载包
   */
  private async downloadPackage(pkg: ToolPackage, targetDir: string): Promise<void> {
    // 创建 package.json
    const packageJson = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      main: 'index.js',
      author: pkg.author,
      license: pkg.license,
      dependencies: pkg.dependencies,
      peerDependencies: pkg.peerDependencies,
      scripts: pkg.scripts,
      keywords: pkg.keywords,
      tools: pkg.tools
    };

    await fs.writeJson(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

    // 创建工具文件
    for (const tool of pkg.tools) {
      const toolFile = path.join(targetDir, `${tool.name}.js`);
      const toolCode = this.generateToolCode(tool);
      await fs.writeFile(toolFile, toolCode, 'utf-8');
    }

    // 创建入口文件
    const indexCode = this.generateIndexCode(pkg);
    await fs.writeFile(path.join(targetDir, 'index.js'), indexCode, 'utf-8');

    // 创建 README
    const readme = this.generateReadme(pkg);
    await fs.writeFile(path.join(targetDir, 'README.md'), readme, 'utf-8');
  }

  /**
   * 安装 npm 依赖
   */
  private async installNpmDependencies(pkgDir: string, dependencies: Record<string, string>): Promise<void> {
    try {
      console.log(`   📦 Installing npm dependencies...`);
      execSync('npm install', {
        cwd: pkgDir,
        stdio: 'pipe',
        timeout: 120000
      });
    } catch (error) {
      console.warn(`   ⚠️  Failed to install npm dependencies:`, error);
    }
  }

  /**
   * 注册工具
   */
  private async registerTools(pkg: ToolPackage, pkgDir: string): Promise<string[]> {
    const tools: string[] = [];

    for (const tool of pkg.tools) {
      tools.push(tool.name);
    }

    return tools;
  }

  /**
   * 保存到项目配置
   */
  private async saveToProjectConfig(pkg: ToolPackage): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'packages.json');
      let config: Record<string, any> = {};

      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      }

      config.dependencies = config.dependencies || {};
      config.dependencies[pkg.name] = `^${pkg.version}`;

      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      console.warn('Failed to save to project config:', error);
    }
  }

  /**
   * 从项目配置中移除
   */
  private async removeFromProjectConfig(packageName: string): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), '.taskflow', 'packages.json');

      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);

        if (config.dependencies) {
          delete config.dependencies[packageName];
          await fs.writeJson(configPath, config, { spaces: 2 });
        }
      }
    } catch (error) {
      console.warn('Failed to remove from project config:', error);
    }
  }

  /**
   * 生成工具代码
   */
  private generateToolCode(tool: any): string {
    return `/**
 * ${tool.description}
 */
module.exports = {
  name: '${tool.name}',
  description: '${tool.description}',
  inputSchema: ${JSON.stringify(tool.inputSchema, null, 2)},
  handler: async (input) => {
    // TODO: Implement tool logic
    return { success: true };
  }
};
`;
  }

  /**
   * 生成入口代码
   */
  private generateIndexCode(pkg: ToolPackage): string {
    const toolExports = pkg.tools.map(t => `  '${t.name}': require('./${t.name}'),`).join('\n');

    return `/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 */

module.exports = {
  name: '${pkg.name}',
  version: '${pkg.version}',
  description: '${pkg.description}',
  tools: {
${toolExports}
  }
};
`;
  }

  /**
   * 生成 README
   */
  private generateReadme(pkg: ToolPackage): string {
    const toolsList = pkg.tools.map(t => `- **${t.name}**: ${t.description}`).join('\n');

    return `# ${pkg.name}

${pkg.description}

## Version

${pkg.version}

## Installation

\`\`\`bash
taskflow marketplace install ${pkg.name}
\`\`\`

## Tools

${toolsList}

## License

${pkg.license}
`;
  }
}

export default PackageInstaller;
