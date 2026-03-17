/**
 * MCP 工具市场注册表管理
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Registry, SearchOptions, SearchResult, ToolPackage, VersionInfo } from '../types';
import { Logger } from '../../utils/logger';
import { PackageSearcher } from './search';
import { PackageFetcher } from './fetcher';
import { PackageCache } from './cache';

export * from './search';
export * from './fetcher';
export * from './cache';

export class RegistryManager {
  private registries: Map<string, Registry> = new Map();
  private cacheDir: string;
  private cache: PackageCache;
  private searcher: PackageSearcher;
  private fetcher: PackageFetcher;
  private logger: Logger;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), '.taskflow', 'marketplace-cache');
    this.cache = new PackageCache(this.cacheDir);
    this.searcher = new PackageSearcher(this.registries);
    this.fetcher = new PackageFetcher(this.registries);
    this.logger = Logger.getInstance('RegistryManager');
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.cacheDir);

    this.addRegistry({
      name: 'taskflow-official',
      url: 'https://registry.taskflow.ai',
      type: 'npm',
      packages: [],
    });

    await this.cache.load();
  }

  addRegistry(registry: Registry): void {
    this.registries.set(registry.name, registry);
  }

  removeRegistry(name: string): boolean {
    return this.registries.delete(name);
  }

  getRegistries(): Registry[] {
    return Array.from(this.registries.values());
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    return this.searcher.search(options);
  }

  async getPackage(name: string, version?: string): Promise<ToolPackage | null> {
    const cacheKey = `${name}@${version || 'latest'}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const pkg = await this.fetcher.getPackage(name, version);
    if (pkg) {
      this.cache.set(cacheKey, pkg);
      await this.cache.save(pkg);
    }

    return pkg;
  }

  async getPackageVersions(name: string): Promise<VersionInfo[]> {
    return this.fetcher.getPackageVersions(name);
  }

  async getLatestVersion(name: string): Promise<string | null> {
    return this.fetcher.getLatestVersion(name);
  }

  async checkUpdates(
    installedPackages: string[]
  ): Promise<Array<{ name: string; current: string; latest: string }>> {
    return this.fetcher.checkUpdates(installedPackages);
  }

  async syncRegistry(name: string): Promise<void> {
    const registry = this.registries.get(name);
    if (!registry) {
      throw new Error(`Registry not found: ${name}`);
    }

    this.logger.info(`Syncing registry: ${name}`);
    registry.lastSync = new Date();
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}

export default RegistryManager;
