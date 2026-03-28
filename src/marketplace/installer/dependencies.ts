/**
 * 依赖管理器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { ToolPackage, DependencyTree } from '../types';
import { RegistryManager } from '../registry';
import { getLogger } from '../../utils/logger';

const logger = getLogger('marketplace:dependencies');

export class DependencyManager {
  constructor(private registryManager: RegistryManager) {}

  async resolve(pkg: ToolPackage): Promise<DependencyTree> {
    const tree: DependencyTree = {
      name: pkg.name,
      version: pkg.version,
      dependencies: [],
    };

    for (const [depName, depVersion] of Object.entries(pkg.dependencies || {})) {
      const dep = await this.registryManager.getPackage(depName, depVersion as string);
      if (dep) {
        tree.dependencies.push({
          name: dep.name,
          version: dep.version,
          dependencies: [],
        });
      }
    }

    return tree;
  }

  async installDependency(pkg: ToolPackage): Promise<void> {
    logger.info(`📦 Installing dependency: ${pkg.name}@${pkg.version}`);
  }

  async installNpmDependencies(
    pkgDir: string,
    dependencies: Record<string, string>
  ): Promise<void> {
    const nodeModulesPath = path.join(pkgDir, 'node_modules');

    if (await fs.pathExists(nodeModulesPath)) {
      return;
    }

    logger.info('📦 Installing npm dependencies...');

    const packageJsonPath = path.join(pkgDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath).catch(() => ({}));

    packageJson.dependencies = { ...packageJson.dependencies, ...dependencies };
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    try {
      execSync('npm install --production', {
        cwd: pkgDir,
        stdio: 'ignore',
        timeout: 120000,
      });
    } catch (error) {
      console.warn('  ⚠️  Failed to install npm dependencies:', error);
    }
  }
}
