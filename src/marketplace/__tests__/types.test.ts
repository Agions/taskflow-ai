
/**
 * Marketplace Types Tests
 * TaskFlow AI v4.0
 */

import type {
  ToolPackage,
  ToolCategory,
  MarketTool,
  ToolExample,
  PackageMetadata,
  SearchResult,
  SearchOptions,
  InstallResult,
  VersionInfo,
  MarketplaceConfig,
  Registry
} from '../types';

describe('Marketplace Types', () => {
  describe('ToolCategory', () => {
    it('should support git category', () => {
      const category: ToolCategory = 'git';
      expect(category).toBe('git');
    });

    it('should support jira category', () => {
      const category: ToolCategory = 'jira';
      expect(category).toBe('jira');
    });

    it('should support slack category', () => {
      const category: ToolCategory = 'slack';
      expect(category).toBe('slack');
    });

    it('should support github category', () => {
      const category: ToolCategory = 'github';
      expect(category).toBe('github');
    });

    it('should support ai category', () => {
      const category: ToolCategory = 'ai';
      expect(category).toBe('ai');
    });
  });

  describe('ToolExample', () => {
    it('should create tool example', () => {
      const example: ToolExample = {
        name: 'Get repository info',
        description: 'Get repository information',
        input: {
          owner: 'openclaw',
          repo: 'taskflow-ai'
        },
        output: {
          name: 'taskflow-ai',
          stars: 1234
        }
      };

      expect(example.description).toBeDefined();
      expect(example.input).toBeDefined();
      expect(example.output).toBeDefined();
      expect(example.name).toBeDefined();
    });
  });

  describe('MarketTool', () => {
    it('should create market tool with schemas', () => {
      const tool: MarketTool = {
        name: 'git-status',
        description: 'Get current git repository status',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' }
          },
          required: ['path']
        },
        outputSchema: {
          type: 'object',
          properties: {
            branch: { type: 'string' },
            changes: { type: 'array' }
          }
        },
        handler: './handlers/git.ts::status'
      };

      expect(tool.name).toBe('git-status');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
    });
  });

  describe('PackageMetadata', () => {
    it('should create complete package metadata', () => {
      const metadata: PackageMetadata = {
        downloads: 50000,
        rating: 4.5,
        reviews: 120,
        verified: true,
        official: true,
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-01-15')
      };

      expect(metadata.downloads).toBe(50000);
      expect(metadata.rating).toBe(4.5);
      expect(metadata.verified).toBe(true);
      expect(metadata.official).toBe(true);
    });

    it('should create minimal package metadata', () => {
      const metadata: PackageMetadata = {
        downloads: 0,
        rating: 0,
        reviews: 0,
        verified: false,
        official: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(metadata.downloads).toBe(0);
      expect(metadata.verified).toBe(false);
    });
  });

  describe('ToolPackage', () => {
    it('should create complete tool package', () => {
      const toolPackage: ToolPackage = {
        id: 'marketplace-git-tools',
        name: 'Git Tools',
        description: 'Comprehensive git integration tools',
        version: '1.2.0',
        author: 'Agions',
        license: 'MIT',
        keywords: ['git', 'version-control'],
        categories: ['git'],
        repository: 'https://github.com/example/git-tools',
        mcpVersion: '1.0.0',
        tools: [
          {
            name: 'git-status',
            description: 'Get git status',
            inputSchema: { type: 'object' },
            handler: './handlers/status.ts'
          }
        ],
        dependencies: {
          'simple-git': '^3.0.0'
        },
        metadata: {
          downloads: 10000,
          rating: 4.8,
          reviews: 50,
          verified: true,
          official: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      expect(toolPackage.id).toBe('marketplace-git-tools');
      expect(toolPackage.version).toBe('1.2.0');
      expect(toolPackage.tools).toHaveLength(1);
      expect(toolPackage.dependencies['simple-git']).toBe('^3.0.0');
    });

    it('should create package with peer dependencies', () => {
      const toolPackage: ToolPackage = {
        id: 'slack-integration',
        name: 'Slack Integration',
        description: 'Slack message tools',
        version: '2.0.0',
        author: 'Team',
        license: 'Apache-2.0',
        keywords: ['slack', 'messaging'],
        categories: ['slack'],
        mcpVersion: '1.0.0',
        tools: [],
        dependencies: {},
        peerDependencies: {
          '@slack/web-api': '^7.0.0'
        },
        metadata: {
          downloads: 5000,
          rating: 4.2,
          reviews: 20,
          verified: false,
          official: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      expect(toolPackage.peerDependencies).toBeDefined();
      expect(toolPackage.peerDependencies!['@slack/web-api']).toBe('^7.0.0');
    });
  });

  describe('SearchOptions', () => {
    it('should create basic search options', () => {
      const options: SearchOptions = {
        query: 'git tools',
        limit: 10,
        sortBy: 'downloads'
      };

      expect(options.query).toBe('git tools');
      expect(options.limit).toBe(10);
      expect(options.sortBy).toBe('downloads');
    });

    it('should create search options with filters', () => {
      const options: SearchOptions = {
        category: 'git',
        verified: true,
        official: false,
        sortBy: 'rating'
      };

      expect(options.category).toBe('git');
      expect(options.verified).toBe(true);
    });
  });

  describe('SearchResult', () => {
    it('should create search result', () => {
      const result: SearchResult = {
        packages: [
          {
            id: 'test-package',
            name: 'Test Package',
            description: 'A test package',
            version: '1.0.0',
            author: 'Test',
            license: 'MIT',
            keywords: [],
            categories: [],
            mcpVersion: '1.0.0',
            tools: [],
            dependencies: {},
            metadata: {
              downloads: 0,
              rating: 0,
              reviews: 0,
              verified: false,
              official: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ],
        total: 1,
        page: 1,
        pageSize: 10
      };

      expect(result.packages).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('MarketplaceConfig', () => {
    it('should create marketplace configuration', () => {
      const registries: Registry[] = [
        {
          name: 'official',
          url: 'https://marketplace.taskflow.ai',
          type: 'npm',
          packages: []
        }
      ];

      const config: MarketplaceConfig = {
        defaultRegistry: 'https://marketplace.taskflow.ai',
        registries,
        cacheDir: '/tmp/taskflow-marketplace',
        autoUpdate: true,
        verifySignatures: true
      };

      expect(config.defaultRegistry).toBe('https://marketplace.taskflow.ai');
      expect(config.autoUpdate).toBe(true);
      expect(config.verifySignatures).toBe(true);
      expect(config.registries).toHaveLength(1);
    });
  });

  describe('VersionInfo', () => {
    it('should create version information', () => {
      const versionInfo: VersionInfo = {
        version: '1.2.0',
        changelog: '- Added new feature\n- Fixed bug',
        publishedAt: new Date('2024-01-15'),
        deprecated: false
      };

      expect(versionInfo.version).toBe('1.2.0');
      expect(versionInfo.deprecated).toBe(false);
      expect(versionInfo.changelog).toContain('Added new feature');
    });

    it('should create deprecated version info', () => {
      const versionInfo: VersionInfo = {
        version: '1.0.0',
        changelog: 'Initial release',
        publishedAt: new Date('2023-01-01'),
        deprecated: true,
        deprecatedMessage: 'Please upgrade to v2.0.0'
      };

      expect(versionInfo.deprecated).toBe(true);
      expect(versionInfo.deprecatedMessage).toBe('Please upgrade to v2.0.0');
    });
  });
});
