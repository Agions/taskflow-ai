/**
 * Marketplace Types Tests - TaskFlow AI v4.0
 */

import type {
  ToolPackage, ToolCategory, MarketTool, ToolExample, ToolPermission,
  PackageMetadata, Registry, InstallResult, PublishConfig,
  SearchOptions, SearchResult, VersionInfo, DependencyTree,
  MarketplaceConfig, PackageManifest,
} from '../types';

const ALL_CATEGORIES: ToolCategory[] = [
  'git','jira','slack','github','gitlab','notion','confluence',
  'linear','asana','trello','database','api','file','shell','ai','other',
];

describe('Marketplace Types', () => {
  describe('ToolPackage', () => {
    it('should create valid package', () => {
      const pkg: ToolPackage = {
        id: 'pkg-1', name: 'test-pkg', description: 'A test package',
        version: '1.0.0', author: 'Agions', license: 'MIT',
        keywords: ['test'], categories: ['api'],
        mcpVersion: '1.0', tools: [], dependencies: {},
        metadata: { createdAt: new Date(), updatedAt: new Date(), downloads: 0, rating: 0, reviews: 0, verified: false, official: false },
      };
      expect(pkg.license).toBe('MIT');
    });

    it('should support optional fields', () => {
      const pkg: ToolPackage = {
        id: 'pkg-2', name: 'full', description: '', version: '2.0.0',
        author: '', license: 'Apache-2.0', keywords: [], categories: ['ai'],
        repository: 'https://github.com/test', homepage: 'https://test.com',
        bugs: 'https://github.com/test/issues', mcpVersion: '2.0',
        tools: [], dependencies: {}, peerDependencies: { lodash: '^4.0' },
        scripts: { build: 'tsc' },
        metadata: { createdAt: new Date(), updatedAt: new Date(), downloads: 100, rating: 4.5, reviews: 20, verified: true, official: true },
      };
      expect(pkg.metadata.verified).toBe(true);
    });
  });

  describe('ToolCategory', () => {
    it('should have 16 categories', () => {
      expect(ALL_CATEGORIES).toHaveLength(16);
    });
  });

  describe('MarketTool', () => {
    it('should create valid tool', () => {
      const t: MarketTool = {
        name: 'read', description: 'Read file', inputSchema: { type: 'object' }, handler: 'fs-read',
      };
      expect(t.handler).toBe('fs-read');
    });
  });

  describe('PackageMetadata', () => {
    it('should create valid metadata', () => {
      const m: PackageMetadata = {
        createdAt: new Date(), updatedAt: new Date(), downloads: 50,
        rating: 4.2, reviews: 10, verified: false, official: false,
      };
      expect(m.rating).toBe(4.2);
    });
  });

  describe('Registry', () => {
    it('should support 3 types', () => {
      const types: Registry['type'][] = ['npm', 'git', 'local'];
      expect(types).toHaveLength(3);
    });
  });

  describe('InstallResult', () => {
    it('should create success result', () => {
      const r: InstallResult = {
        success: true, package: {} as ToolPackage, installedTools: ['t1'],
        warnings: ['Deprecated'],
      };
      expect(r.warnings).toHaveLength(1);
    });
  });

  describe('SearchOptions', () => {
    it('should create options with all filters', () => {
      const o: SearchOptions = {
        query: 'git', category: 'git', author: 'Agions',
        verified: true, official: false, sortBy: 'downloads', limit: 20,
      };
      expect(o.sortBy).toBe('downloads');
    });
  });

  describe('SearchResult', () => {
    it('should create valid result', () => {
      const r: SearchResult = { packages: [], total: 0, page: 1, pageSize: 20 };
      expect(r.page).toBe(1);
    });
  });

  describe('VersionInfo', () => {
    it('should support deprecation', () => {
      const v: VersionInfo = {
        version: '1.0.0', changelog: 'First', publishedAt: new Date(),
        deprecated: true, deprecatedMessage: 'Use v2',
      };
      expect(v.deprecated).toBe(true);
    });
  });

  describe('DependencyTree', () => {
    it('should create recursive tree', () => {
      const tree: DependencyTree = {
        name: 'root', version: '1.0',
        dependencies: [{ name: 'child', version: '0.1', dependencies: [] }],
      };
      expect(tree.dependencies).toHaveLength(1);
    });
  });

  describe('MarketplaceConfig', () => {
    it('should create valid config', () => {
      const c: MarketplaceConfig = {
        defaultRegistry: 'npm', registries: [], cacheDir: '.cache',
        autoUpdate: true, verifySignatures: false,
      };
      expect(c.autoUpdate).toBe(true);
    });
  });

  describe('PackageManifest', () => {
    it('should create valid manifest', () => {
      const m: PackageManifest = {
        name: 'test', versions: {}, 'dist-tags': { latest: '1.0.0' }, time: {},
      };
      expect(m['dist-tags'].latest).toBe('1.0.0');
    });
  });
});

describe('Marketplace Modules', () => {
  it('MarketplaceRegistry should be importable', async () => {
    const mod = await import('../registry');
    expect(mod).toBeDefined();
  });

  it('PackageInstaller should be importable', async () => {
    const mod = await import('../installer');
    expect(mod).toBeDefined();
  });
});
