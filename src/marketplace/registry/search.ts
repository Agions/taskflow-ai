/**
 * 包搜索功能
 */

import { Registry, SearchOptions, SearchResult, ToolPackage } from '../types';
import axios from 'axios';

export class PackageSearcher {
  constructor(private registries: Map<string, Registry>) {}

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

    const uniquePackages = this.deduplicatePackages(results);
    const sorted = this.sortPackages(uniquePackages, options.sortBy || 'downloads');
    const limit = options.limit || 20;

    return {
      packages: sorted.slice(0, limit),
      total: sorted.length,
      page: 1,
      pageSize: limit,
    };
  }

  private async searchRegistry(registry: Registry, options: SearchOptions): Promise<ToolPackage[]> {
    try {
      const response = await axios.get(`${registry.url}/-/v1/search`, {
        params: {
          text: options.query,
          size: options.limit || 20,
          from: 0,
        },
        timeout: 10000,
      });

      return response.data.objects?.map((obj: any) => this.mapToToolPackage(obj.package)) || [];
    } catch {
      return [];
    }
  }

  private mapToToolPackage(pkg: any): ToolPackage {
    return {
      id: pkg.name,
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || '',
      author: pkg.author?.name || pkg.author || '',
      license: pkg.license || 'MIT',
      keywords: pkg.keywords || [],
      categories: pkg.categories || [],
      homepage: pkg.links?.homepage || '',
      repository: pkg.links?.repository || '',
      mcpVersion: pkg.mcpVersion || '1.0.0',
      tools: pkg.tools || [],
      dependencies: pkg.dependencies || {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        downloads: 0,
        rating: 0,
        reviews: 0,
        verified: false,
        official: false,
      },
    };
  }

  private deduplicatePackages(packages: ToolPackage[]): ToolPackage[] {
    const seen = new Set<string>();
    return packages.filter(pkg => {
      if (seen.has(pkg.name)) return false;
      seen.add(pkg.name);
      return true;
    });
  }

  private sortPackages(packages: ToolPackage[], sortBy: string): ToolPackage[] {
    const sorted = [...packages];

    switch (sortBy) {
      case 'downloads':
        sorted.sort((a, b) => (b.metadata?.downloads || 0) - (a.metadata?.downloads || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.metadata?.rating || 0) - (a.metadata?.rating || 0));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'updated':
        sorted.sort(
          (a, b) =>
            new Date(b.metadata?.updatedAt || 0).getTime() -
            new Date(a.metadata?.updatedAt || 0).getTime()
        );
        break;
    }

    return sorted;
  }
}
