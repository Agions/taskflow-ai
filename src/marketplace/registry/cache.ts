import { getLogger } from '../../utils/logger';
const logger = getLogger('module');
/**
 * 包缓存管理
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ToolPackage } from '../types';

export class PackageCache {
  private cache: Map<string, ToolPackage> = new Map();

  constructor(private cacheDir: string) {}

  async load(): Promise<void> {
    try {
      if (await fs.pathExists(this.cacheDir)) {
        const files = await fs.readdir(this.cacheDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const pkg = await fs.readJson(path.join(this.cacheDir, file));
              this.cache.set(`${pkg.name}@${pkg.version}`, pkg);
            } catch {}
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to load cache:', error);
    }
  }

  async save(pkg: ToolPackage): Promise<void> {
    await fs.ensureDir(this.cacheDir);
    const cachePath = path.join(
      this.cacheDir,
      `${pkg.name.replace('/', '__')}@${pkg.version}.json`
    );
    await fs.writeJson(cachePath, pkg, { spaces: 2 });
    this.cache.set(`${pkg.name}@${pkg.version}`, pkg);
  }

  get(key: string): ToolPackage | undefined {
    return this.cache.get(key);
  }

  set(key: string, pkg: ToolPackage): void {
    this.cache.set(key, pkg);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await fs.remove(this.cacheDir);
  }
}
