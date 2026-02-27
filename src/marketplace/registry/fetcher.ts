/**
 * 包获取功能
 */

import axios from 'axios';
import { Registry, ToolPackage, PackageManifest, VersionInfo } from '../types';

export class PackageFetcher {
  constructor(private registries: Map<string, Registry>) {}

  async getPackage(name: string, version?: string): Promise<ToolPackage | null> {
    for (const registry of this.registries.values()) {
      try {
        const pkg = await this.fetchPackage(registry, name, version);
        if (pkg) return pkg;
      } catch (error) {}
    }
    return null;
  }

  async getPackageVersions(name: string): Promise<VersionInfo[]> {
    for (const registry of this.registries.values()) {
      try {
        const manifest = await this.fetchManifest(registry, name);
        if (manifest) {
          return Object.entries(manifest.versions).map(([version, pkg]) => ({
            version,
            changelog: '',
            publishedAt: manifest.time[version] || new Date(),
            deprecated: (pkg as any).deprecated
          }));
        }
      } catch (error) {}
    }
    return [];
  }

  async getLatestVersion(name: string): Promise<string | null> {
    for (const registry of this.registries.values()) {
      try {
        const manifest = await this.fetchManifest(registry, name);
        if (manifest?.['dist-tags']?.latest) {
          return manifest['dist-tags'].latest;
        }
      } catch (error) {}
    }
    return null;
  }

  async checkUpdates(installedPackages: string[]): Promise<Array<{ name: string; current: string; latest: string }>> {
    const updates: Array<{ name: string; current: string; latest: string }> = [];

    for (const pkgName of installedPackages) {
      const [name, currentVersion] = pkgName.split('@');
      const latest = await this.getLatestVersion(name);

      if (latest && latest !== currentVersion) {
        updates.push({ name, current: currentVersion || 'unknown', latest });
      }
    }

    return updates;
  }

  private async fetchPackage(registry: Registry, name: string, version?: string): Promise<ToolPackage | null> {
    const manifest = await this.fetchManifest(registry, name);
    if (!manifest) return null;

    const targetVersion = version || manifest['dist-tags']?.latest;
    if (!targetVersion) return null;

    const versionData = manifest.versions[targetVersion];
    if (!versionData) return null;

    const versionData = manifest.versions[targetVersion];
    if (!versionData) return null;

    return {
      ...versionData,
      installed: false
    };
  }

  private async fetchManifest(registry: Registry, name: string): Promise<PackageManifest | null> {
    try {
      const encodedName = name.replace('/', '%2F');
      const response = await axios.get(`${registry.url}/${encodedName}`, {
        timeout: 10000
      });
      return response.data;
    } catch {
      return null;
    }
  }
}
