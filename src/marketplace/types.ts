/**
 * MCP 工具市场类型定义
 * TaskFlow AI v3.0 - MCP 工具市场
 */

export interface ToolPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  keywords: string[];
  categories: ToolCategory[];
  repository?: string;
  homepage?: string;
  bugs?: string;
  mcpVersion: string;
  tools: MarketTool[];
  dependencies: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  metadata: PackageMetadata;
}

export type ToolCategory =
  | 'git'
  | 'jira'
  | 'slack'
  | 'github'
  | 'gitlab'
  | 'notion'
  | 'confluence'
  | 'linear'
  | 'asana'
  | 'trello'
  | 'database'
  | 'api'
  | 'file'
  | 'shell'
  | 'ai'
  | 'other';

export interface MarketTool {
  name: string;
  description: string;
  inputSchema: object;
  outputSchema?: object;
  handler: string;
  examples?: ToolExample[];
  permissions?: ToolPermission[];
}

export interface ToolExample {
  name: string;
  description: string;
  input: object;
  output: object;
}

export interface ToolPermission {
  resource: string;
  actions: string[];
}

export interface PackageMetadata {
  createdAt: Date;
  updatedAt: Date;
  downloads: number;
  rating: number;
  reviews: number;
  verified: boolean;
  official: boolean;
}

export interface Registry {
  name: string;
  url: string;
  type: 'npm' | 'git' | 'local';
  packages: string[];
  lastSync?: Date;
}

export interface InstallResult {
  success: boolean;
  package: ToolPackage;
  installedTools: string[];
  warnings?: string[];
  error?: string;
}

export interface PublishConfig {
  registry: string;
  access: 'public' | 'restricted';
  tag?: string;
}

export interface SearchOptions {
  query?: string;
  category?: ToolCategory;
  author?: string;
  verified?: boolean;
  official?: boolean;
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name';
  limit?: number;
}

export interface SearchResult {
  packages: ToolPackage[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VersionInfo {
  version: string;
  changelog: string;
  publishedAt: Date;
  deprecated?: boolean;
  deprecatedMessage?: string;
}

export interface DependencyTree {
  name: string;
  version: string;
  dependencies: DependencyTree[];
}

export interface MarketplaceConfig {
  defaultRegistry: string;
  registries: Registry[];
  cacheDir: string;
  autoUpdate: boolean;
  verifySignatures: boolean;
}

export interface PackageManifest {
  name: string;
  versions: Record<string, ToolPackage>;
  'dist-tags': Record<string, string>;
  time: Record<string, Date>;
}
