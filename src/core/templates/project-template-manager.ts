import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { execSync } from 'child_process';

/**
 * 项目模板接口
 */
export interface ProjectTemplate {
  name: string;
  displayName: string;
  description: string;
  type: string;
  features: Record<string, boolean>;
  directories: string[];
  files: Array<{
    path: string;
    template: string;
    content?: string;
  }>;
  editorConfigs: Record<string, {
    variables: Record<string, unknown>;
  }>;
  dependencies: {
    production: string[];
    development: string[];
  };
  scripts: Record<string, string>;
}

/**
 * 项目模板管理器
 * 负责管理和生成不同类型的项目模板
 */
export class ProjectTemplateManager {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../../../templates/projects');
  }

  /**
   * 获取可用的项目模板列表
   */
  public getAvailableTemplates(): string[] {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        return ['web-app', 'api', 'mobile', 'ai-ml'];
      }
      
      return fs.readdirSync(this.templatesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch {
      console.warn(chalk.yellow('无法读取模板目录，使用默认模板列表'));
      return ['web-app', 'api', 'mobile', 'ai-ml'];
    }
  }

  /**
   * 加载项目模板配置
   */
  public async loadTemplate(templateName: string): Promise<ProjectTemplate> {
    const templatePath = path.join(this.templatesDir, templateName, 'structure.json');
    
    if (fs.existsSync(templatePath)) {
      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        return JSON.parse(templateContent) as ProjectTemplate;
      } catch {
        console.warn(chalk.yellow(`无法加载模板 ${templateName}，使用默认配置`));
      }
    }

    // 返回默认模板配置
    return this.getDefaultTemplate(templateName);
  }

  /**
   * 生成项目结构
   */
  public async generateProject(
    targetDir: string,
    templateName: string,
    projectName: string,
    options: {
      examples?: boolean;
      git?: boolean;
      install?: boolean;
    } = {}
  ): Promise<void> {
    const template = await this.loadTemplate(templateName);
    
    // 创建目录结构
    await this.createDirectories(targetDir, template.directories);
    
    // 生成文件
    await this.generateFiles(targetDir, template, projectName);
    
    // 生成package.json
    await this.generatePackageJson(targetDir, template, projectName);
    
    // 初始化Git仓库
    if (options.git !== false) {
      await this.initializeGit(targetDir);
    }
    
    // 安装依赖
    if (options.install !== false) {
      await this.installDependencies(targetDir);
    }
  }

  /**
   * 创建目录结构
   */
  private async createDirectories(targetDir: string, directories: string[]): Promise<void> {
    for (const dir of directories) {
      const dirPath = path.join(targetDir, dir);
      await fs.ensureDir(dirPath);
    }
  }

  /**
   * 生成项目文件
   */
  private async generateFiles(
    targetDir: string,
    template: ProjectTemplate,
    projectName: string
  ): Promise<void> {
    for (const file of template.files) {
      const filePath = path.join(targetDir, file.path);
      
      if (file.content) {
        // 使用内联内容
        const content = this.processTemplate(file.content, {
          PROJECT_NAME: projectName,
          PROJECT_TYPE: template.displayName,
          DATE: new Date().toISOString().split('T')[0],
          VERSION: '1.2.0'
        });
        
        await fs.writeFile(filePath, content);
      } else if (file.template) {
        // 从模板文件加载
        await this.generateFromTemplate(filePath, file.template, {
          PROJECT_NAME: projectName,
          PROJECT_TYPE: template.displayName,
          DATE: new Date().toISOString().split('T')[0],
          VERSION: '1.2.0'
        });
      }
    }
  }

  /**
   * 从模板文件生成内容
   */
  private async generateFromTemplate(
    targetPath: string,
    templatePath: string,
    variables: Record<string, unknown>
  ): Promise<void> {
    const fullTemplatePath = path.join(this.templatesDir, templatePath);
    
    if (fs.existsSync(fullTemplatePath)) {
      try {
        let content = await fs.readFile(fullTemplatePath, 'utf-8');
        content = this.processTemplate(content, variables);
        await fs.writeFile(targetPath, content);
        return;
      } catch {
        console.warn(chalk.yellow(`无法加载模板文件 ${templatePath}`));
      }
    }
    
    // 生成默认内容
    await this.generateDefaultFile(targetPath, variables);
  }

  /**
   * 处理模板变量替换
   */
  private processTemplate(content: string, variables: Record<string, unknown>): string {
    let processed = content;
    
    // 替换简单变量 {{VARIABLE}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value));
    }
    
    // 处理条件语句 {{#if CONDITION}}...{{/if}}
    processed = processed.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition] ? content : '';
    });
    
    return processed;
  }

  /**
   * 生成package.json文件
   */
  private async generatePackageJson(
    targetDir: string,
    template: ProjectTemplate,
    projectName: string
  ): Promise<void> {
    const packageJson = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `${template.displayName} project generated by TaskFlow AI`,
      main: 'dist/index.js',
      scripts: template.scripts,
      dependencies: this.arrayToObject(template.dependencies.production),
      devDependencies: this.arrayToObject(template.dependencies.development),
      keywords: ['taskflow-ai', template.type, 'typescript'],
      author: '',
      license: 'MIT'
    };

    const packagePath = path.join(targetDir, 'package.json');
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
  }

  /**
   * 将依赖数组转换为对象
   */
  private arrayToObject(dependencies: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const dep of dependencies) {
      const [name, version] = dep.split('@');
      result[name] = version || 'latest';
    }
    
    return result;
  }

  /**
   * 初始化Git仓库
   */
  private async initializeGit(targetDir: string): Promise<void> {
    try {
      // execSync 已在顶部导入
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from TaskFlow AI"', { 
        cwd: targetDir, 
        stdio: 'ignore' 
      });
    } catch {
      console.warn(chalk.yellow('Git初始化失败，请手动初始化'));
    }
  }

  /**
   * 安装依赖
   */
  private async installDependencies(targetDir: string): Promise<void> {
    try {
      // execSync 已在顶部导入
      console.log(chalk.blue('正在安装依赖...'));
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
    } catch {
      console.warn(chalk.yellow('依赖安装失败，请手动运行 npm install'));
    }
  }

  /**
   * 生成默认文件内容
   */
  private async generateDefaultFile(
    targetPath: string,
    variables: Record<string, unknown>
  ): Promise<void> {
    const fileName = path.basename(targetPath);
    let content = '';

    switch (fileName) {
      case 'README.md':
        content = this.getDefaultReadme(variables);
        break;
      case '.gitignore':
        content = this.getDefaultGitignore();
        break;
      case 'tsconfig.json':
        content = this.getDefaultTsConfig();
        break;
      default:
        content = `// ${fileName}\n// Generated by TaskFlow AI\n`;
    }

    await fs.writeFile(targetPath, content);
  }

  /**
   * 获取默认模板配置
   */
  private getDefaultTemplate(templateName: string): ProjectTemplate {
    const baseTemplate: ProjectTemplate = {
      name: templateName,
      displayName: templateName.charAt(0).toUpperCase() + templateName.slice(1),
      description: `${templateName} project template`,
      type: templateName,
      features: {
        typescript: true,
        testing: true,
        linting: true,
        formatting: true
      },
      directories: ['src', 'tests', 'docs', 'config'],
      files: [
        { path: 'README.md', template: '', content: '' },
        { path: '.gitignore', template: '', content: '' },
        { path: 'tsconfig.json', template: '', content: '' }
      ],
      editorConfigs: {
        cursor: { variables: { PROJECT_TYPE: templateName, TYPESCRIPT: true } },
        vscode: { variables: { PROJECT_TYPE: templateName, TYPESCRIPT: true } },
        vim: { variables: { PROJECT_TYPE: templateName, TYPESCRIPT: true } },
        zed: { variables: { PROJECT_TYPE: templateName, TYPESCRIPT: true } }
      },
      dependencies: {
        production: ['typescript@^4.9.0'],
        development: ['@types/node@^18.15.0', 'ts-node@^10.9.0']
      },
      scripts: {
        build: 'tsc',
        dev: 'ts-node src/index.ts',
        test: 'jest',
        lint: 'eslint src --ext .ts'
      }
    };

    return baseTemplate;
  }

  /**
   * 获取默认README内容
   */
  private getDefaultReadme(variables: Record<string, unknown>): string {
    return `# ${variables.PROJECT_NAME}

${variables.PROJECT_TYPE} project generated by TaskFlow AI.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Features

- TypeScript support
- ESLint and Prettier configuration
- AI editor configurations included
- Testing setup with Jest

## License

MIT
`;
  }

  /**
   * 获取默认.gitignore内容
   */
  private getDefaultGitignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Coverage directory
coverage/
*.lcov

# IDE files
.vscode/
.cursor/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
`;
  }

  /**
   * 获取默认TypeScript配置
   */
  private getDefaultTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests']
    }, null, 2);
  }
}
