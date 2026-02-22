/**
 * 搜索替换工具
 * 支持批量搜索替换
 */

import { Logger } from '../../utils/logger';

export interface SearchReplaceOptions {
  paths?: string[];
  extensions?: string[];
  exclude?: string[];
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export interface SearchResult {
  file: string;
  matches: Array<{
    line: number;
    content: string;
    replacement?: string;
  }>;
}

export class SearchReplaceTool {
  private logger = Logger.getInstance('SearchReplaceTool');

  /**
   * 搜索文件
   */
  async search(
    pattern: string,
    options: SearchReplaceOptions = {}
  ): Promise<SearchResult[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const results: SearchResult[] = [];
    const extensions = options.extensions || ['ts', 'js', 'tsx', 'jsx', 'md', 'json'];
    const exclude = options.exclude || ['node_modules', '.git', 'dist'];
    
    // 获取搜索目录
    const searchPaths = options.paths || [process.cwd()];
    
    for (const searchPath of searchPaths) {
      await this.scanDirectory(searchPath, extensions, exclude, async (file) => {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        const matches: SearchResult['matches'] = [];
        
        // 构建正则
        let regex: RegExp;
        try {
          const flags = (options.caseSensitive ? '' : 'i') + (options.useRegex ? 'g' : 'g');
          const patternStr = options.wholeWord ? `\\b${pattern}\\b` : pattern;
          regex = options.useRegex ? new RegExp(pattern, flags) : new RegExp(patternStr, flags);
        } catch {
          this.logger.warn(`无效的正则表达式: ${pattern}`);
          return;
        }
        
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            matches.push({
              line: i + 1,
              content: lines[i].trim(),
            });
            regex.lastIndex = 0; // 重置正则状态
          }
        }
        
        if (matches.length > 0) {
          results.push({
            file: path.resolve(file),
            matches,
          });
        }
      });
    }
    
    this.logger.info(`搜索完成，找到 ${results.length} 个匹配文件`);
    
    return results;
  }

  /**
   * 替换文件内容
   */
  async replace(
    pattern: string,
    replacement: string,
    options: SearchReplaceOptions = {}
  ): Promise<{
    filesModified: number;
    replacements: number;
    errors: string[];
  }> {
    const results = await this.search(pattern, options);
    
    const fs = await import('fs/promises');
    let filesModified = 0;
    let replacements = 0;
    const errors: string[] = [];
    
    for (const result of results) {
      try {
        const content = await fs.readFile(result.file, 'utf-8');
        let newContent = content;
        
        // 构建正则
        let regex: RegExp;
        try {
          const flags = (options.caseSensitive ? '' : 'i') + 'g';
          const patternStr = options.wholeWord ? `\\b${pattern}\\b` : pattern;
          regex = options.useRegex ? new RegExp(pattern, flags) : new RegExp(patternStr, flags);
        } catch {
          errors.push(`无效正则: ${result.file}`);
          continue;
        }
        
        const matches = content.match(regex);
        if (matches) {
          replacements += matches.length;
          newContent = content.replace(regex, replacement);
          
          await fs.writeFile(result.file, newContent);
          filesModified++;
        }
      } catch (error) {
        errors.push(`处理失败: ${result.file} - ${error}`);
      }
    }
    
    this.logger.info(`替换完成，修改 ${filesModified} 个文件，${replacements} 处`);
    
    return { filesModified, replacements, errors };
  }

  /**
   * 扫描目录
   */
  private async scanDirectory(
    dir: string,
    extensions: string[],
    exclude: string[],
    callback: (file: string) => Promise<void>
  ): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // 排除
        if (exclude.includes(entry.name)) continue;
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, extensions, exclude, callback);
        } else {
          const ext = path.extname(entry.name).slice(1);
          if (extensions.includes(ext)) {
            await callback(fullPath);
          }
        }
      }
    } catch {
      // 忽略无法访问的目录
    }
  }
}

export default SearchReplaceTool;
