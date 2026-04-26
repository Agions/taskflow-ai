/**
 * Marketplace Tests
 * TaskFlow AI v4.0.1
 *
 * Tests for MCP tool marketplace functionality including registry management,
 * package searching, installation, and dependency resolution.
 */

import {
  ToolPackage,
  ToolCategory,
  MarketTool,
  ToolExample,
  ToolPermission,
  PackageMetadata,
  Registry,
  InstallResult,
  PublishConfig,
  SearchOptions,
  SearchResult,
  VersionInfo,
  DependencyTree,
  MarketplaceConfig,
  PackageManifest,
} from '../types';

describe('Marketplace Types', () => {
  describe('ToolCategory', () => {
    it('should support all category values', () => {
      const categories: ToolCategory[] = [
        'git',
        'jira',
        'slack',
        'github',
        'gitlab',
        'notion',
        'confluence',
        'linear',
        'asana',
        'trello',
        'database',
        'api',
        'file',
        'shell',
        'ai',
        'other',
      ];
      expect(categories).toHaveLength(16);
    });

    it('should create single category value', () => {
      const category: ToolCategory = 'github';
      expect(category).toBe('github');
    });
  });

  describe('MarketTool', () => {
    it('should create complete market tool', () => {
      const tool: MarketTool = {
        name: 'git-status',
        description: 'Get git repository status',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
        handler: './index.js#status',
        examples: [
          {
            name: 'Get status',
            description: 'Get current repository status',
            input: { path: '/repo' },
            output: { status: 'clean' },
          },
        ],
        permissions: [
          {
            resource: 'file-system',
            actions: ['read', 'write'],
          },
        ],
      };

      expect(tool.name).toBe('git-status');
      expect(tool.examples).toHaveLength(1);
      expect(tool.permissions).toHaveLength(1);
    });

    it('should create minimal market tool', () => {
      const tool: MarketTool = {
        name: 'simple-tool',
        description: 'A simple tool',
        inputSchema: {},
        handler: './handler.js',
      };

      expect(tool.name).toBe('simple-tool');
    });
  });

  describe('ToolPackage', () => {
    it('should create complete tool package', () => {
      const pkg: ToolPackage = {
        id: '@taskflow/git-tools',
        name: '@taskflow/git-tools',
        description: 'Git integration tools',
        version: '1.0.0',
        author: 'Agions',
        license: 'MIT',
        keywords: ['git', 'version-control'],
        categories: ['git', 'shell'],
        repository: 'https://github.com/taskflow/git-tools',
        homepage: 'https://taskflow.ai/docs/git-tools',
        bugs: 'https://github.com/taskflow/git-tools/issues',
        mcpVersion: '1.0.0',
        tools: [
          {
            name: 'git-status',
            description: 'Get git status',
            inputSchema: {},
            handler: './status.js',
          },
        ],
        dependencies: {},
        peerDependencies: {
          taskflow: '^4.0.0',
        },
        scripts: {
          test: 'jest',
        },
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-04-01'),
          downloads: 1000,
          rating: 4.5,
          reviews: 20,
          verified: true,
          official: true,
        },
      };

      expect(pkg.id).toBe('@taskflow/git-tools');
      expect(pkg.tools).toHaveLength(1);
      expect(pkg.metadata.verified).toBe(true);
    });

    it('should create minimal tool package', () => {
      const pkg: ToolPackage = {
        id: 'test-package',
        name: 'test-package',
        description: 'Test package',
        version: '1.0.0',
        author: 'Test Author',
        license: 'MIT',
        keywords: [],
        categories: ['other'],
        mcpVersion: '1.0.0',
        tools: [],
        dependencies: {},
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

      expect(pkg.name).toBe('test-package');
    });
  });

  describe('PackageMetadata', () => {
    it('should handle verified and official packages', () => {
      const metadata: PackageMetadata = {
        createdAt: new Date(),
        updatedAt: new Date(),
        downloads: 5000,
        rating: 4.8,
        reviews: 100,
        verified: true,
        official: true,
      };

      expect(metadata.verified).toBe(true);
      expect(metadata.official).toBe(true);
      expect(metadata.rating).toBeGreaterThan(4);
    });
  });

  describe('Registry', () => {
    it('should create npm registry', () => {
      const registry: Registry = {
        name: 'npm-official',
        url: 'https://registry.npmjs.org',
        type: 'npm',
        packages: ['@taskflow/*'],
        lastSync: new Date(),
      };

      expect(registry.type).toBe('npm');
      expect(registry.packages).toContain('@taskflow/*');
    });

    it('should create git registry', () => {
      const registry: Registry = {
        name: 'github-packages',
        url: 'https://github.com/taskflow/packages',
        type: 'git',
        packages: ['custom-tools'],
      };

      expect(registry.type).toBe('git');
    });

    it('should create local registry', () => {
      const registry: Registry = {
        name: 'local-packages',
        url: '/path/to/packages',
        type: 'local',
        packages: ['local-tool'],
      };

      expect(registry.type).toBe('local');
    });
  });

  describe('SearchOptions', () => {
    it('should create complete search options', () => {
      const options: SearchOptions = {
        query: 'git',
        category: 'git',
        author: 'Agions',
        verified: true,
        official: true,
        sortBy: 'rating',
        limit: 20,
      };

      expect(options.category).toBe('git');
      expect(options.sortBy).toBe('rating');
    });

    it('should support all sort options', () => {
      const sortByOptions: Array<SearchOptions['sortBy']> = [
        'downloads',
        'rating',
        'updated',
        'name',
      ];
      expect(sortByOptions).toHaveLength(4);
    });
  });

  describe('InstallResult', () => {
    it('should create successful install result', () => {
      const pkg: ToolPackage = {
        id: 'test-pkg',
        name: 'test-pkg',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        categories: ['other'],
        mcpVersion: '1.0.0',
        tools: [],
        dependencies: {},
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

      const result: InstallResult = {
        success: true,
        package: pkg,
        installedTools: ['tool1', 'tool2'],
        warnings: ['Warning message'],
      };

      expect(result.success).toBe(true);
      expect(result.installedTools).toHaveLength(2);
    });

    it('should create failed install result', () => {
      const result: InstallResult = {
        success: false,
        package: {} as ToolPackage,
        installedTools: [],
        error: 'Installation failed due to network error',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('DependencyTree', () => {
    it('should create dependency tree', () => {
      const tree: DependencyTree = {
        name: 'main-package',
        version: '1.0.0',
        dependencies: [
          {
            name: 'dependency-1',
            version: '2.0.0',
            dependencies: [
              {
                name: 'sub-dep',
                version: '1.0.0',
                dependencies: [],
              },
            ],
          },
        ],
      };

      expect(tree.name).toBe('main-package');
      expect(tree.dependencies).toHaveLength(1);
      expect(tree.dependencies[0].dependencies).toHaveLength(1);
    });
  });

  describe('MarketplaceConfig', () => {
    it('should create marketplace config', () => {
      const config: MarketplaceConfig = {
        defaultRegistry: 'npm-official',
        registries: [
          {
            name: 'npm-official',
            url: 'https://registry.npmjs.org',
            type: 'npm',
            packages: [],
          },
        ],
        cacheDir: '/tmp/marketplace-cache',
        autoUpdate: true,
        verifySignatures: true,
      };

      expect(config.defaultRegistry).toBe('npm-official');
      expect(config.autoUpdate).toBe(true);
    });
  });
});

describe('Tool Permission System', () => {
  it('should define resource permissions', () => {
    const permission: ToolPermission = {
      resource: 'file-system',
      actions: ['read', 'write', 'delete'],
    };

    expect(permission.actions).toContain('write');
  });

  it('should define API permissions', () => {
    const permission: ToolPermission = {
      resource: 'api',
      actions: ['GET', 'POST', 'PUT', 'DELETE'],
    };

    expect(permission.actions).toHaveLength(4);
  });
});

describe('Tool Example System', () => {
  it('should create tool example', () => {
    const example: ToolExample = {
      name: 'Get File Content',
      description: 'Read file content from repository',
      input: { path: '/src/file.ts' } as object,
      output: { content: 'const x = 1;' } as object,
    };

    expect(example.name).toBe('Get File Content');
    expect((example.input as any).path).toBe('/src/file.ts');
  });
});

describe('Package Lifecycle', () => {
  it('should track version history', () => {
    const versions: VersionInfo[] = [
      {
        version: '1.0.0',
        changelog: 'Initial release',
        publishedAt: new Date('2024-01-01'),
      },
      {
        version: '1.1.0',
        changelog: 'Added new features',
        publishedAt: new Date('2024-02-01'),
      },
      {
        version: '2.0.0',
        changelog: 'Major update',
        publishedAt: new Date('2024-03-01'),
        deprecated: true,
        deprecatedMessage: 'Use version 3.0.0 instead',
      },
    ];

    expect(versions).toHaveLength(3);
    expect(versions[2].deprecated).toBe(true);
  });

  it('should handle package manifest', () => {
    const manifest: PackageManifest = {
      name: '@taskflow/git-tools',
      versions: {
        '1.0.0': {} as ToolPackage,
        '1.1.0': {} as ToolPackage,
        '2.0.0': {} as ToolPackage,
      },
      'dist-tags': {
        latest: '2.0.0',
        stable: '1.1.0',
      },
      time: {
        created: new Date('2024-01-01'),
        modified: new Date('2024-03-01'),
      } as Record<string, Date>,
    };

    expect(Object.keys(manifest.versions)).toHaveLength(3);
    expect(manifest['dist-tags'].latest).toBe('2.0.0');
  });
});

describe('Search and Discovery', () => {
  it('should search by query', () => {
    const options: SearchOptions = {
      query: 'git',
      limit: 10,
    };

    expect(options.query).toBe('git');
  });

  it('should filter by category', () => {
    const options: SearchOptions = {
      category: 'github',
      sortBy: 'downloads',
    };

    expect(options.category).toBe('github');
  });

  it('should filter verified packages', () => {
    const options: SearchOptions = {
      verified: true,
    };

    expect(options.verified).toBe(true);
  });

  it('should handle search results with pagination', () => {
    const result: SearchResult = {
      packages: [{}] as ToolPackage[],
      total: 100,
      page: 1,
      pageSize: 20,
    };

    expect(result.total).toBe(100);
    expect(result.page).toBe(1);
  });
});

describe('Publish Configuration', () => {
  it('should configure public publish', () => {
    const config: PublishConfig = {
      registry: 'npm-official',
      access: 'public',
      tag: 'latest',
    };

    expect(config.access).toBe('public');
  });

  it('should configure restricted publish', () => {
    const config: PublishConfig = {
      registry: 'npm-official',
      access: 'restricted',
    };

    expect(config.access).toBe('restricted');
  });
});

describe('Integration Scenarios', () => {
  it('should handle package installation workflow', () => {
    const pkg: ToolPackage = {
      id: '@taskflow/example',
      name: '@taskflow/example',
      description: 'Example package',
      version: '1.0.0',
      author: 'Agions',
      license: 'MIT',
      keywords: [],
      categories: ['other'],
      mcpVersion: '1.0.0',
      tools: [
        {
          name: 'tool1',
          description: 'First tool',
          inputSchema: {},
          handler: './tool1.js',
        },
        {
          name: 'tool2',
          description: 'Second tool',
          inputSchema: {},
          handler: './tool2.js',
        },
      ],
      dependencies: {
        axios: '^1.0.0',
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        downloads: 100,
        rating: 4.0,
        reviews: 5,
        verified: true,
        official: false,
      },
    };

    const installResult: InstallResult = {
      success: true,
      package: pkg,
      installedTools: ['tool1', 'tool2'],
    };

    expect(installResult.success).toBe(true);
    expect(installResult.installedTools).toHaveLength(2);
    expect(pkg.dependencies).toHaveProperty('axios');
  });

  it('should handle dependency resolution', () => {
    const dependencyTree: DependencyTree = {
      name: 'my-app',
      version: '1.0.0',
      dependencies: [
        {
          name: 'dep1',
          version: '1.0.0',
          dependencies: [
            {
              name: 'dep1-1',
              version: '0.5.0',
              dependencies: [],
            },
          ],
        },
        {
          name: 'dep2',
          version: '2.0.0',
          dependencies: [],
        },
      ],
    };

    expect(dependencyTree.dependencies).toHaveLength(2);
  });
});

describe('Tool Categories Integration', () => {
  it('should support git-related tools', () => {
    const category: ToolCategory = 'git';
    expect(category).toBeDefined();
  });

  it('should support AI/ML tools', () => {
    const category: ToolCategory = 'ai';
    expect(category).toBeDefined();
  });

  it('should support communication tools', () => {
    const categories: ToolCategory[] = ['slack', 'notion', 'confluence'];
    expect(categories).toHaveLength(3);
  });

  it('should support project management tools', () => {
    const categories: ToolCategory[] = ['jira', 'linear', 'asana', 'trello'];
    expect(categories).toHaveLength(4);
  });
});

describe('Metadata and Quality Metrics', () => {
  it('should track package quality metrics', () => {
    const metadata: PackageMetadata = {
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-04-01'),
      downloads: 10000,
      rating: 4.8,
      reviews: 150,
      verified: true,
      official: true,
    };

    expect(metadata.downloads).toBeGreaterThan(1000);
    expect(metadata.rating).toBeGreaterThan(4.5);
    expect(metadata.reviews).toBeGreaterThan(100);
  });

  it('should distinguish verified vs verified packages', () => {
    const verified: PackageMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      downloads: 0,
      rating: 0,
      reviews: 0,
      verified: true,
      official: false,
    };

    const official: PackageMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      downloads: 0,
      rating: 0,
      reviews: 0,
      verified: true,
      official: true,
    };

    expect(verified.official).toBe(false);
    expect(official.official).toBe(true);
  });
});
