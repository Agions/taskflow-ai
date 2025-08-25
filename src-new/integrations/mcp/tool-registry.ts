/**
 * TaskFlow AI MCP 工具注册和发现系统
 * 实现类似 gemini-cli 的工具自动注册和发现机制
 */

import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ToolCategory;
  type: ToolType;
  
  // 执行信息
  command: string;
  args: string[];
  env: Record<string, string>;
  workingDirectory?: string;
  
  // 能力定义
  capabilities: ToolCapability[];
  resources: ToolResource[];
  prompts: ToolPrompt[];
  
  // 配置信息
  config: ToolConfig;
  manifest: ToolManifest;
  
  // 状态信息
  status: ToolStatus;
  lastUsed?: Date;
  usageCount: number;
  
  // 元数据
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords: string[];
  
  // 安装信息
  installPath: string;
  installedAt: Date;
  updatedAt: Date;
}

export interface ToolCapability {
  type: 'resources' | 'tools' | 'prompts';
  name: string;
  description: string;
  schema?: any;
}

export interface ToolResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface ToolPrompt {
  name: string;
  description: string;
  arguments?: Record<string, any>;
}

export interface ToolConfig {
  required: Record<string, any>;
  optional: Record<string, any>;
  defaults: Record<string, any>;
}

export interface ToolManifest {
  name: string;
  version: string;
  mcpVersion: string;
  main: string;
  type: 'server' | 'client' | 'transport';
  transport?: TransportConfig;
}

export interface TransportConfig {
  type: 'stdio' | 'sse' | 'websocket';
  host?: string;
  port?: number;
  path?: string;
}

export enum ToolCategory {
  DEVELOPMENT = 'development',
  PRODUCTIVITY = 'productivity',
  ANALYSIS = 'analysis',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
  CUSTOM = 'custom'
}

export enum ToolType {
  BUILTIN = 'builtin',
  INSTALLED = 'installed',
  REMOTE = 'remote',
  LOCAL = 'local'
}

export enum ToolStatus {
  AVAILABLE = 'available',
  RUNNING = 'running',
  ERROR = 'error',
  DISABLED = 'disabled',
  UPDATING = 'updating'
}

export interface ToolDiscoveryOptions {
  scanPaths: string[];
  includeBuiltin: boolean;
  includeInstalled: boolean;
  includeRemote: boolean;
  autoRegister: boolean;
  watchForChanges: boolean;
}

export interface ToolRegistrationResult {
  success: boolean;
  tool?: MCPTool;
  error?: string;
  warnings: string[];
}

/**
 * MCP工具注册和发现管理器
 * 提供工具的自动发现、注册、管理和执行
 */
export class MCPToolRegistry extends EventEmitter {
  private tools = new Map<string, MCPTool>();
  private toolCategories = new Map<ToolCategory, MCPTool[]>();
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private discoveryOptions: ToolDiscoveryOptions;
  private watchedPaths = new Set<string>();
  private fileWatchers: fs.FSWatcher[] = [];
  private initialized = false;

  constructor(
    configManager: ConfigManager,
    cacheManager: CacheManager,
    options?: Partial<ToolDiscoveryOptions>
  ) {
    super();
    this.configManager = configManager;
    this.cacheManager = cacheManager;
    
    this.discoveryOptions = {
      scanPaths: [
        path.join(process.cwd(), 'mcp-servers'),
        path.join(process.cwd(), 'node_modules/@taskflow/mcp-*'),
        path.join(process.cwd(), 'src-new/integrations/mcp/tools'),
        path.join(process.env.HOME || process.cwd(), '.taskflow/mcp-tools'),
      ],
      includeBuiltin: true,
      includeInstalled: true,
      includeRemote: false,
      autoRegister: true,
      watchForChanges: true,
      ...options,
    };
  }

  /**
   * 初始化工具注册系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🔧 初始化MCP工具注册系统...');

      // 加载缓存的工具信息
      await this.loadCachedTools();

      // 注册内置工具
      if (this.discoveryOptions.includeBuiltin) {
        await this.registerBuiltinTools();
      }

      // 扫描和注册工具
      if (this.discoveryOptions.includeInstalled) {
        await this.discoverTools();
      }

      // 启动文件监听
      if (this.discoveryOptions.watchForChanges) {
        this.startFileWatching();
      }

      this.initialized = true;
      console.log(`✅ MCP工具注册系统初始化完成，发现 ${this.tools.size} 个工具`);

    } catch (error) {
      console.error('❌ MCP工具注册系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 发现和注册工具
   */
  async discoverTools(): Promise<ToolRegistrationResult[]> {
    console.log('🔍 开始扫描MCP工具...');
    const results: ToolRegistrationResult[] = [];

    for (const scanPath of this.discoveryOptions.scanPaths) {
      try {
        if (await fs.pathExists(scanPath)) {
          const pathResults = await this.scanPath(scanPath);
          results.push(...pathResults);
        }
      } catch (error) {
        console.warn(`⚠️ 扫描路径失败 ${scanPath}:`, error);
        results.push({
          success: false,
          error: `扫描路径失败: ${error}`,
          warnings: [],
        });
      }
    }

    console.log(`🔍 工具扫描完成，处理了 ${results.length} 个结果`);
    return results;
  }

  /**
   * 注册单个工具
   */
  async registerTool(toolPath: string, manifest?: ToolManifest): Promise<ToolRegistrationResult> {
    try {
      console.log(`📦 注册工具: ${toolPath}`);

      // 读取工具清单
      const toolManifest = manifest || await this.readToolManifest(toolPath);
      if (!toolManifest) {
        return {
          success: false,
          error: '无法读取工具清单文件',
          warnings: [],
        };
      }

      // 验证工具清单
      const validation = this.validateToolManifest(toolManifest);
      if (!validation.valid) {
        return {
          success: false,
          error: `工具清单验证失败: ${validation.errors.join(', ')}`,
          warnings: validation.warnings,
        };
      }

      // 创建工具对象
      const tool = await this.createToolFromManifest(toolPath, toolManifest);

      // 检查重复
      if (this.tools.has(tool.id)) {
        const existingTool = this.tools.get(tool.id)!;
        if (this.compareVersions(tool.version, existingTool.version) <= 0) {
          return {
            success: false,
            error: `工具 ${tool.id} 已存在更新版本`,
            warnings: [],
          };
        }
      }

      // 注册工具
      this.tools.set(tool.id, tool);
      this.addToCategory(tool);

      // 缓存工具信息
      await this.cacheToolInfo(tool);

      this.emit('toolRegistered', tool);
      console.log(`✅ 工具注册成功: ${tool.name} v${tool.version}`);

      return {
        success: true,
        tool,
        warnings: validation.warnings,
      };

    } catch (error) {
      console.error(`❌ 工具注册失败 ${toolPath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        warnings: [],
      };
    }
  }

  /**
   * 获取所有已注册的工具
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 按类别获取工具
   */
  getToolsByCategory(category: ToolCategory): MCPTool[] {
    return this.toolCategories.get(category) || [];
  }

  /**
   * 搜索工具
   */
  searchTools(query: string): MCPTool[] {
    const searchTerm = query.toLowerCase();
    return this.getAllTools().filter(tool => 
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * 获取工具详细信息
   */
  getToolInfo(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * 启用/禁用工具
   */
  async setToolEnabled(toolId: string, enabled: boolean): Promise<boolean> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return false;
    }

    tool.status = enabled ? ToolStatus.AVAILABLE : ToolStatus.DISABLED;
    tool.updatedAt = new Date();

    await this.cacheToolInfo(tool);
    this.emit('toolStatusChanged', tool, enabled);

    console.log(`${enabled ? '✅' : '❌'} 工具 ${tool.name} 已${enabled ? '启用' : '禁用'}`);
    return true;
  }

  /**
   * 卸载工具
   */
  async unregisterTool(toolId: string): Promise<boolean> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return false;
    }

    // 不能卸载内置工具
    if (tool.type === ToolType.BUILTIN) {
      console.warn(`⚠️ 无法卸载内置工具: ${tool.name}`);
      return false;
    }

    this.tools.delete(toolId);
    this.removeFromCategory(tool);

    // 清理缓存
    await this.cacheManager.delete(`mcp-tool:${toolId}`);

    this.emit('toolUnregistered', tool);
    console.log(`🗑️ 工具已卸载: ${tool.name}`);

    return true;
  }

  /**
   * 更新工具信息
   */
  async updateTool(toolId: string): Promise<ToolRegistrationResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        success: false,
        error: '工具不存在',
        warnings: [],
      };
    }

    if (tool.type === ToolType.BUILTIN) {
      return {
        success: false,
        error: '内置工具无法更新',
        warnings: [],
      };
    }

    // 重新注册工具
    return await this.registerTool(tool.installPath);
  }

  /**
   * 获取工具使用统计
   */
  getToolStats(): ToolStats {
    const tools = this.getAllTools();
    
    return {
      totalTools: tools.length,
      enabledTools: tools.filter(t => t.status === ToolStatus.AVAILABLE).length,
      byCategory: Object.fromEntries(
        Object.values(ToolCategory).map(cat => [
          cat,
          this.getToolsByCategory(cat).length
        ])
      ),
      byType: Object.fromEntries(
        Object.values(ToolType).map(type => [
          type,
          tools.filter(t => t.type === type).length
        ])
      ),
      mostUsed: tools
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(t => ({ name: t.name, count: t.usageCount })),
    };
  }

  /**
   * 关闭工具注册系统
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // 停止文件监听
      for (const watcher of this.fileWatchers) {
        watcher.close();
      }
      this.fileWatchers = [];

      // 保存工具信息
      await this.saveAllToolsToCache();

      this.initialized = false;
      console.log('✅ MCP工具注册系统已关闭');

    } catch (error) {
      console.error('❌ MCP工具注册系统关闭失败:', error);
      throw error;
    }
  }

  // 私有方法

  private async loadCachedTools(): Promise<void> {
    try {
      const cachedTools = await this.cacheManager.get('mcp-tools:all');
      if (cachedTools && Array.isArray(cachedTools)) {
        for (const toolData of cachedTools) {
          const tool = toolData as MCPTool;
          this.tools.set(tool.id, tool);
          this.addToCategory(tool);
        }
        console.log(`📦 从缓存加载了 ${cachedTools.length} 个工具`);
      }
    } catch (error) {
      console.warn('⚠️ 加载工具缓存失败:', error);
    }
  }

  private async registerBuiltinTools(): Promise<void> {
    console.log('🔧 注册内置工具...');

    const builtinTools: Partial<MCPTool>[] = [
      {
        id: 'filesystem',
        name: 'File System',
        description: '文件系统操作工具',
        version: '1.0.0',
        category: ToolCategory.UTILITY,
        type: ToolType.BUILTIN,
        command: 'node',
        args: [path.join(__dirname, 'builtin/filesystem.js')],
        env: {},
        capabilities: [
          {
            type: 'tools',
            name: 'read_file',
            description: '读取文件内容',
          },
          {
            type: 'tools',
            name: 'write_file',
            description: '写入文件内容',
          },
          {
            type: 'resources',
            name: 'file_tree',
            description: '文件树结构',
          },
        ],
        keywords: ['filesystem', 'file', 'directory'],
      },
      {
        id: 'git',
        name: 'Git Operations',
        description: 'Git版本控制操作工具',
        version: '1.0.0',
        category: ToolCategory.DEVELOPMENT,
        type: ToolType.BUILTIN,
        command: 'node',
        args: [path.join(__dirname, 'builtin/git.js')],
        env: {},
        capabilities: [
          {
            type: 'tools',
            name: 'git_status',
            description: '获取Git状态',
          },
          {
            type: 'tools',
            name: 'git_commit',
            description: '提交更改',
          },
        ],
        keywords: ['git', 'version control', 'commit'],
      },
    ];

    for (const toolData of builtinTools) {
      const tool = this.createBuiltinTool(toolData);
      this.tools.set(tool.id, tool);
      this.addToCategory(tool);
      console.log(`✅ 内置工具已注册: ${tool.name}`);
    }
  }

  private createBuiltinTool(data: Partial<MCPTool>): MCPTool {
    return {
      id: data.id!,
      name: data.name!,
      description: data.description!,
      version: data.version!,
      category: data.category!,
      type: ToolType.BUILTIN,
      command: data.command!,
      args: data.args!,
      env: data.env!,
      capabilities: data.capabilities || [],
      resources: [],
      prompts: [],
      config: { required: {}, optional: {}, defaults: {} },
      manifest: {
        name: data.name!,
        version: data.version!,
        mcpVersion: '2024-11-05',
        main: 'index.js',
        type: 'server',
      },
      status: ToolStatus.AVAILABLE,
      usageCount: 0,
      keywords: data.keywords || [],
      installPath: __dirname,
      installedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async scanPath(scanPath: string): Promise<ToolRegistrationResult[]> {
    const results: ToolRegistrationResult[] = [];
    
    try {
      const entries = await fs.readdir(scanPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const toolPath = path.join(scanPath, entry.name);
          const result = await this.registerTool(toolPath);
          results.push(result);
        }
      }
    } catch (error) {
      console.warn(`扫描路径失败 ${scanPath}:`, error);
    }

    return results;
  }

  private async readToolManifest(toolPath: string): Promise<ToolManifest | null> {
    const manifestPaths = [
      path.join(toolPath, 'mcp.json'),
      path.join(toolPath, 'package.json'),
      path.join(toolPath, 'manifest.json'),
    ];

    for (const manifestPath of manifestPaths) {
      try {
        if (await fs.pathExists(manifestPath)) {
          const content = await fs.readJSON(manifestPath);
          
          if (manifestPath.endsWith('package.json')) {
            // 从package.json提取MCP信息
            return this.extractMCPFromPackageJson(content);
          } else {
            return content as ToolManifest;
          }
        }
      } catch (error) {
        console.warn(`读取清单文件失败 ${manifestPath}:`, error);
      }
    }

    return null;
  }

  private extractMCPFromPackageJson(packageJson: any): ToolManifest | null {
    if (!packageJson.mcp) {
      return null;
    }

    return {
      name: packageJson.name,
      version: packageJson.version,
      mcpVersion: packageJson.mcp.version || '2024-11-05',
      main: packageJson.mcp.main || packageJson.main || 'index.js',
      type: packageJson.mcp.type || 'server',
      transport: packageJson.mcp.transport,
    };
  }

  private validateToolManifest(manifest: ToolManifest): ManifestValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.name) errors.push('缺少工具名称');
    if (!manifest.version) errors.push('缺少版本号');
    if (!manifest.mcpVersion) warnings.push('缺少MCP版本号');
    if (!manifest.main) errors.push('缺少主入口文件');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async createToolFromManifest(toolPath: string, manifest: ToolManifest): Promise<MCPTool> {
    const toolId = `${manifest.name}@${manifest.version}`;
    
    return {
      id: toolId,
      name: manifest.name,
      description: '自动发现的MCP工具',
      version: manifest.version,
      category: ToolCategory.INTEGRATION,
      type: ToolType.INSTALLED,
      command: 'node',
      args: [path.join(toolPath, manifest.main)],
      env: {},
      capabilities: [],
      resources: [],
      prompts: [],
      config: { required: {}, optional: {}, defaults: {} },
      manifest,
      status: ToolStatus.AVAILABLE,
      usageCount: 0,
      keywords: [],
      installPath: toolPath,
      installedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private addToCategory(tool: MCPTool): void {
    if (!this.toolCategories.has(tool.category)) {
      this.toolCategories.set(tool.category, []);
    }
    const categoryTools = this.toolCategories.get(tool.category)!;
    
    // 避免重复添加
    const index = categoryTools.findIndex(t => t.id === tool.id);
    if (index >= 0) {
      categoryTools[index] = tool;
    } else {
      categoryTools.push(tool);
    }
  }

  private removeFromCategory(tool: MCPTool): void {
    const categoryTools = this.toolCategories.get(tool.category);
    if (categoryTools) {
      const index = categoryTools.findIndex(t => t.id === tool.id);
      if (index >= 0) {
        categoryTools.splice(index, 1);
      }
    }
  }

  private async cacheToolInfo(tool: MCPTool): Promise<void> {
    await this.cacheManager.set(`mcp-tool:${tool.id}`, tool, 86400); // 24小时
  }

  private async saveAllToolsToCache(): Promise<void> {
    const tools = this.getAllTools();
    await this.cacheManager.set('mcp-tools:all', tools, 86400);
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  private startFileWatching(): void {
    for (const scanPath of this.discoveryOptions.scanPaths) {
      this.watchPath(scanPath);
    }
  }

  private async watchPath(watchPath: string): Promise<void> {
    try {
      if (!await fs.pathExists(watchPath)) {
        return;
      }

      if (this.watchedPaths.has(watchPath)) {
        return;
      }

      const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('mcp.json') || filename.endsWith('package.json'))) {
          console.log(`📁 检测到工具变更: ${filename}`);
          // 延迟处理，避免文件正在写入
          setTimeout(() => {
            this.handleFileChange(watchPath, filename, eventType);
          }, 1000);
        }
      });

      this.fileWatchers.push(watcher);
      this.watchedPaths.add(watchPath);
      console.log(`👀 开始监听路径: ${watchPath}`);

    } catch (error) {
      console.warn(`监听路径失败 ${watchPath}:`, error);
    }
  }

  private async handleFileChange(basePath: string, filename: string, eventType: string): Promise<void> {
    try {
      const fullPath = path.join(basePath, filename);
      const toolPath = path.dirname(fullPath);

      if (eventType === 'rename' && !await fs.pathExists(fullPath)) {
        // 文件被删除，尝试卸载工具
        const tools = this.getAllTools().filter(t => t.installPath === toolPath);
        for (const tool of tools) {
          await this.unregisterTool(tool.id);
        }
      } else {
        // 文件创建或修改，重新注册工具
        const result = await this.registerTool(toolPath);
        if (result.success) {
          this.emit('toolDiscovered', result.tool);
        }
      }
    } catch (error) {
      console.warn('处理文件变更失败:', error);
    }
  }
}

// 类型定义

export interface ManifestValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ToolStats {
  totalTools: number;
  enabledTools: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  mostUsed: Array<{ name: string; count: number }>;
}