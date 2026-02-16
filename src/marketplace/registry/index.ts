/**
 * MCP 工具市场注册表管理
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import {
  ToolPackage,
  Registry,
  SearchOptions,
  SearchResult,
  PackageManifest,
  VersionInfo
} from '../types';

export class RegistryManager {
  private registries: Map<string, Registry> = new Map();
  private cacheDir: string;
  private cache: Map<string, ToolPackage> = new Map();

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), '.taskflow', 'marketplace-cache');
  }

  /**
   * 初始化注册表
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.cacheDir);

    // 加载默认注册表
    this.addRegistry({
      name: 'taskflow-official',
      url: 'https://registry.taskflow.ai',
      type: 'npm',
      packages: []
    });

    // 加载本地缓存
    await this.loadCache();
  }

  /**
   * 添加注册表
   */
  addRegistry(registry: Registry): void {
    this.registries.set(registry.name, registry);
  }

  /**
   * 移除注册表
   */
  removeRegistry(name: string): boolean {
    return this.registries.delete(name);
  }

  /**
   * 获取所有注册表
   */
  getRegistries(): Registry[] {
    return Array.from(this.registries.values());
  }

  /**
   * 搜索工具包
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    const results: ToolPackage[] = [];

    for (const registry of this.registries.values()) {
      try {
        const packages = await this.searchRegistry(registry, options);
        results.push(...packages);
      } catch (error) {
        console.warn(`Failed to search registry ${registry.name}:`, error);
      }
    }

    // 去重
    const uniquePackages = this.deduplicatePackages(results);

    // 排序
    const sorted = this.sortPackages(uniquePackages, options.sortBy || 'downloads');

    // 分页
    const limit = options.limit || 20;
    const page = 1;
    const pageSize = limit;

    return {
      packages: sorted.slice(0, limit),
      total: sorted.length,
      page,
      pageSize
    };
  }

  /**
   * 获取工具包信息
   */
  async getPackage(name: string, version?: string): Promise<ToolPackage | null> {
    const cacheKey = `${name}@${version || 'latest'}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 从注册表获取
    for (const registry of this.registries.values()) {
      try {
        const pkg = await this.fetchPackage(registry, name, version);
        if (pkg) {
          this.cache.set(cacheKey, pkg);
          await this.saveToCache(pkg);
          return pkg;
        }
      } catch (error) {
        // 继续尝试下一个注册表
      }
    }

    return null;
  }

  /**
   * 获取包的所有版本
   */
  async getPackageVersions(name: string): Promise<VersionInfo[]> {
    for (const registry of this.registries.values()) {
      try {
        const manifest = await this.fetchManifest(registry, name);
        if (manifest) {
          return Object.entries(manifest.versions).map(([version, pkg]) => ({
            version,
            changelog: '', // 从包中提取
            publishedAt: manifest.time[version] || new Date(),
            deprecated: (pkg as any).deprecated
          }));
        }
      } catch (error) {
        // 继续尝试下一个注册表
      }
    }

    return [];
  }

  /**
   * 获取最新版本
   */
  async getLatestVersion(name: string): Promise<string | null> {
    for (const registry of this.registries.values()) {
      try {
        const manifest = await this.fetchManifest(registry, name);
        if (manifest && manifest['dist-tags']?.latest) {
          return manifest['dist-tags'].latest;
        }
      } catch (error) {
        // 继续尝试下一个注册表
      }
    }

    return null;
  }

  /**
   * 检查更新
   */
  async checkUpdates(installedPackages: string[]): Promise<Array<{ name: string; current: string; latest: string }>> {
    const updates: Array<{ name: string; current: string; latest: string }> = [];

    for (const pkgName of installedPackages) {
      const [name, currentVersion] = pkgName.split('@');
      const latest = await this.getLatestVersion(name);

      if (latest && latest !== currentVersion) {
        updates.push({
          name,
          current: currentVersion || 'unknown',
          latest
        });
      }
    }

    return updates;
  }

  /**
   * 同步注册表
   */
  async syncRegistry(name: string): Promise<void> {
    const registry = this.registries.get(name);
    if (!registry) {
      throw new Error(`Registry not found: ${name}`);
    }

    try {
      // 获取所有包列表
      const packages = await this.fetchPackageList(registry);
      registry.packages = packages.map(p => p.name);
      registry.lastSync = new Date();

      // 更新缓存
      for (const pkg of packages) {
        this.cache.set(`${pkg.name}@${pkg.version}`, pkg);
        await this.saveToCache(pkg);
      }

      console.log(`✅ Synced ${packages.length} packages from ${name}`);
    } catch (error) {
      throw new Error(`Failed to sync registry ${name}: ${error}`);
    }
  }

  /**
   * 搜索单个注册表
   */
  private async searchRegistry(registry: Registry, options: SearchOptions): Promise<ToolPackage[]> {
    if (registry.type === 'npm') {
      return this.searchNpmRegistry(registry, options);
    } else if (registry.type === 'git') {
      return this.searchGitRegistry(registry, options);
    } else {
      return this.searchLocalRegistry(registry, options);
    }
  }

  /**
   * 搜索 NPM 注册表
   */
  private async searchNpmRegistry(registry: Registry, options: SearchOptions): Promise<ToolPackage[]> {
    const searchUrl = `${registry.url}/-/v1/search`;
    const params: any = {
      text: options.query || '',
      size: options.limit || 20
    };

    if (options.category) {
      params.text += ` keywords:${options.category}`;
    }

    const response = await axios.get(searchUrl, { params, timeout: 10000 });
    const results = response.data.objects || [];

    return results.map((obj: any) => this.convertToToolPackage(obj.package));
  }

  /**
   * 搜索 Git 注册表
   */
  private async searchGitRegistry(registry: Registry, options: SearchOptions): Promise<ToolPackage[]> {
    // 简化实现：从 Git 仓库搜索
    return [];
  }

  /**
   * 搜索本地注册表
   */
  private async searchLocalRegistry(registry: Registry, options: SearchOptions): Promise<ToolPackage[]> {
    const packages: ToolPackage[] = [];

    for (const pkgName of registry.packages) {
      const pkg = await this.getPackage(pkgName);
      if (pkg && this.matchesSearch(pkg, options)) {
        packages.push(pkg);
      }
    }

    return packages;
  }

  /**
   * 获取包信息
   */
  private async fetchPackage(
    registry: Registry,
    name: string,
    version?: string
  ): Promise<ToolPackage | null> {
    if (registry.type === 'npm') {
      const pkgUrl = `${registry.url}/${name}`;
      const response = await axios.get(pkgUrl, { timeout: 10000 });
      return this.convertToToolPackage(response.data);
    } else if (registry.type === 'local') {
      const pkgPath = path.join(registry.url, `${name}.json`);
      if (await fs.pathExists(pkgPath)) {
        return await fs.readJson(pkgPath);
      }
    }

    return null;
  }

  /**
   * 获取包清单
   */
  private async fetchManifest(registry: Registry, name: string): Promise<PackageManifest | null> {
    if (registry.type === 'npm') {
      const pkgUrl = `${registry.url}/${name}`;
      const response = await axios.get(pkgUrl, { timeout: 10000 });
      return response.data;
    }

    return null;
  }

  /**
   * 获取包列表
   */
  private async fetchPackageList(registry: Registry): Promise<ToolPackage[]> {
    if (registry.type === 'npm') {
      // 获取所有包（简化实现）
      return [];
    } else if (registry.type === 'local') {
      const packages: ToolPackage[] = [];
      const files = await fs.readdir(registry.url);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const pkg = await fs.readJson(path.join(registry.url, file));
          packages.push(pkg);
        }
      }

      return packages;
    }

    return [];
  }

  /**
   * 转换为工具包格式
   */
  private convertToToolPackage(data: any): ToolPackage {
    return {
      id: data.name,
      name: data.name,
      description: data.description || '',
      version: data['dist-tags']?.latest || data.version || '1.0.0',
      author: data.author?.name || data.author || 'unknown',
      license: data.license || 'MIT',
      keywords: data.keywords || [],
      categories: data.keywords?.filter((k: string) => this.isValidCategory(k)) || ['other'],
      repository: data.repository?.url,
      homepage: data.homepage,
      bugs: data.bugs?.url,
      mcpVersion: '1.0.0',
      tools: data.tools || [],
      dependencies: data.dependencies || {},
      peerDependencies: data.peerDependencies,
      scripts: data.scripts,
      metadata: {
        createdAt: new Date(data.time?.created || Date.now()),
        updatedAt: new Date(data.time?.modified || Date.now()),
        downloads: data.downloads || 0,
        rating: 0,
        reviews: 0,
        verified: false,
        official: data.name.startsWith('@taskflow/')
      }
    };
  }

  /**
   * 检查是否是有效类别
   */
  private isValidCategory(keyword: string): boolean {
    const validCategories = [
      'git', 'jira', 'slack', 'github', 'gitlab',
      'notion', 'confluence', 'linear', 'asana', 'trello',
      'database', 'api', 'file', 'shell', 'ai', 'other'
    ];
    return validCategories.includes(keyword.toLowerCase());
  }

  /**
   * 匹配搜索条件
   */
  private matchesSearch(pkg: ToolPackage, options: SearchOptions): boolean {
    if (options.category && !pkg.categories.includes(options.category)) {
      return false;
    }

    if (options.author && pkg.author !== options.author) {
      return false;
    }

    if (options.verified && !pkg.metadata.verified) {
      return false;
    }

    if (options.official && !pkg.metadata.official) {
      return false;
    }

    return true;
  }

  /**
   * 去重包列表
   */
  private deduplicatePackages(packages: ToolPackage[]): ToolPackage[] {
    const seen = new Set<string>();
    return packages.filter(pkg => {
      if (seen.has(pkg.name)) {
        return false;
      }
      seen.add(pkg.name);
      return true;
    });
  }

  /**
   * 排序包列表
   */
  private sortPackages(packages: ToolPackage[], sortBy: string): ToolPackage[] {
    return packages.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.metadata.downloads - a.metadata.downloads;
        case 'rating':
          return b.metadata.rating - a.metadata.rating;
        case 'updated':
          return b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  /**
   * 加载缓存
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheFile = path.join(this.cacheDir, 'registry-cache.json');
      if (await fs.pathExists(cacheFile)) {
        const data = await fs.readJson(cacheFile);
        for (const [key, value] of Object.entries(data)) {
          this.cache.set(key, value as ToolPackage);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(pkg: ToolPackage): Promise<void> {
    try {
      const cacheFile = path.join(this.cacheDir, 'registry-cache.json');
      const data: Record<string, ToolPackage> = {};

      // 读取现有缓存
      if (await fs.pathExists(cacheFile)) {
        Object.assign(data, await fs.readJson(cacheFile));
      }

      // 添加新包
      data[`${pkg.name}@${pkg.version}`] = pkg;

      // 保存
      await fs.writeJson(cacheFile, data, { spaces: 2 });
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }
}

export default RegistryManager;
