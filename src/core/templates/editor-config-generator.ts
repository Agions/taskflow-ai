import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { AIRulesGenerator, ProgrammingLanguage, ProjectType, AIRulesConfig } from './ai-rules-generator';

/**
 * 编辑器配置变量接口
 */
export interface EditorVariables {
  PROJECT_NAME: string;
  PROJECT_TYPE: string;
  PROJECT_DESCRIPTION?: string;
  DATE: string;
  VERSION: string;
  TYPESCRIPT?: boolean;
  JAVASCRIPT?: boolean;
  REACT?: boolean;
  VUE?: boolean;
  NODE_API?: boolean;
  PYTHON?: boolean;
  RUST?: boolean;
  GO?: boolean;
  JEST?: boolean;
  DOCKERFILE?: boolean;
  YAML?: boolean;
  BASH?: boolean;
  PORT?: number;
  PROJECT_SPECIFIC_NOTES?: string;
}

/**
 * AI编辑器配置生成器
 * 负责生成各种AI编辑器的配置文件
 */
export class EditorConfigGenerator {
  private templatesDir: string;
  private aiRulesGenerator: AIRulesGenerator;

  constructor() {
    this.templatesDir = path.join(__dirname, '../../../templates/editors');
    this.aiRulesGenerator = new AIRulesGenerator();
  }

  /**
   * 生成所有编辑器配置
   */
  public async generateAllConfigs(
    targetDir: string,
    variables: EditorVariables,
    editors: string[] = ['windsurf', 'trae', 'cursor', 'vscode']
  ): Promise<void> {
    for (const editor of editors) {
      try {
        await this.generateEditorConfig(targetDir, editor, variables);
      } catch (error) {
        console.warn(chalk.yellow(`生成 ${editor} 配置失败: ${error}`));
      }
    }
  }

  /**
   * 生成基于语言的AI规则
   */
  public async generateLanguageSpecificAIRules(
    targetDir: string,
    language: ProgrammingLanguage,
    projectType: ProjectType,
    projectName: string,
    features: string[] = []
  ): Promise<void> {
    const aiConfig: AIRulesConfig = {
      projectName,
      projectType,
      language,
      features
    };

    await this.aiRulesGenerator.generateAllAIRules(targetDir, aiConfig);
  }

  /**
   * 生成指定编辑器配置
   */
  public async generateEditorConfig(
    targetDir: string,
    editor: string,
    variables: EditorVariables
  ): Promise<void> {
    switch (editor.toLowerCase()) {
      case 'cursor':
        await this.generateCursorConfig(targetDir, variables);
        break;
      case 'vscode':
        await this.generateVSCodeConfig(targetDir, variables);
        break;
      case 'windsurf':
        await this.generateWindsurfConfig(targetDir, variables);
        break;
      case 'trae':
        await this.generateTraeConfig(targetDir, variables);
        break;
      default:
        throw new Error(`不支持的编辑器类型: ${editor}。支持的编辑器: windsurf, trae, cursor, vscode`);
    }
  }

  /**
   * 生成Cursor配置
   */
  private async generateCursorConfig(targetDir: string, variables: EditorVariables): Promise<void> {
    const cursorDir = path.join(targetDir, '.cursor');
    await fs.ensureDir(cursorDir);

    // 生成.cursor-rules文件
    const rulesTemplate = await this.loadTemplate('cursor/.cursor-rules');
    const rulesContent = this.processTemplate(rulesTemplate, variables);
    await fs.writeFile(path.join(targetDir, '.cursor-rules'), rulesContent);

    console.log(chalk.green('✅ Cursor配置已生成'));
  }

  /**
   * 生成VSCode配置
   */
  private async generateVSCodeConfig(targetDir: string, variables: EditorVariables): Promise<void> {
    const vscodeDir = path.join(targetDir, '.vscode');
    await fs.ensureDir(vscodeDir);

    // 生成settings.json
    const settingsTemplate = await this.loadTemplate('vscode/.vscode/settings.json');
    const settingsContent = this.processTemplate(settingsTemplate, variables);
    await fs.writeFile(path.join(vscodeDir, 'settings.json'), settingsContent);

    // 生成extensions.json
    const extensionsTemplate = await this.loadTemplate('vscode/.vscode/extensions.json');
    const extensionsContent = this.processTemplate(extensionsTemplate, variables);
    await fs.writeFile(path.join(vscodeDir, 'extensions.json'), extensionsContent);

    // 生成tasks.json
    await this.generateVSCodeTasks(vscodeDir, variables);

    // 生成launch.json
    await this.generateVSCodeLaunch(vscodeDir, variables);

    console.log(chalk.green('✅ VSCode配置已生成'));
  }



  /**
   * 加载模板文件
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(this.templatesDir, templatePath);

    if (await fs.pathExists(fullPath)) {
      return await fs.readFile(fullPath, 'utf-8');
    }

    // 返回默认模板
    return this.getDefaultTemplate(templatePath);
  }

  /**
   * 处理模板变量替换
   */
  private processTemplate(content: string, variables: EditorVariables): string {
    let processed = content;

    // 替换简单变量 {{VARIABLE}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    // 处理条件语句 {{#if CONDITION}}...{{/if}}
    processed = processed.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition as keyof EditorVariables] ? content : '';
    });

    // 移除注释行（以 "// " 开头的行）
    processed = processed.replace(/^\s*"\/\/.*$/gm, '');

    // 清理多余的逗号
    processed = processed.replace(/,(\s*[}\]])/g, '$1');

    return processed;
  }

  /**
   * 生成VSCode任务配置
   */
  private async generateVSCodeTasks(vscodeDir: string, variables: EditorVariables): Promise<void> {
    const tasks = {
      version: '2.0.0',
      tasks: [
        {
          label: 'build',
          type: 'npm',
          script: 'build',
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'silent',
            focus: false,
            panel: 'shared'
          }
        },
        {
          label: 'test',
          type: 'npm',
          script: 'test',
          group: 'test',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'shared'
          }
        },
        {
          label: 'lint',
          type: 'npm',
          script: 'lint',
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'silent',
            focus: false,
            panel: 'shared'
          }
        }
      ]
    };

    if (variables.REACT) {
      tasks.tasks.push({
        label: 'dev',
        type: 'npm',
        script: 'dev',
        group: 'build',
        presentation: {
          echo: true,
          reveal: 'always',
          focus: true,
          panel: 'shared'
        }
      });
    }

    await fs.writeFile(
      path.join(vscodeDir, 'tasks.json'),
      JSON.stringify(tasks, null, 2)
    );
  }

  /**
   * 生成VSCode启动配置
   */
  private async generateVSCodeLaunch(vscodeDir: string, variables: EditorVariables): Promise<void> {
    const launch: { version: string; configurations: Record<string, unknown>[] } = {
      version: '0.2.0',
      configurations: [
        {
          name: `Debug ${variables.PROJECT_NAME}`,
          type: 'node',
          request: 'launch',
          program: '${workspaceFolder}/dist/index.js',
          outFiles: ['${workspaceFolder}/dist/**/*.js'],
          env: {
            NODE_ENV: 'development'
          },
          console: 'integratedTerminal',
          internalConsoleOptions: 'neverOpen'
        }
      ]
    };

    if (variables.JEST) {
      launch.configurations.push({
        name: 'Debug Tests',
        type: 'node',
        request: 'launch',
        program: '${workspaceFolder}/node_modules/.bin/jest',
        args: ['--runInBand'],
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        env: {
          NODE_ENV: 'test'
        },
        outFiles: ['${workspaceFolder}/dist/**/*.js']
      });
    }

    await fs.writeFile(
      path.join(vscodeDir, 'launch.json'),
      JSON.stringify(launch, null, 2)
    );
  }

  /**
   * 获取默认模板内容
   */
  private getDefaultTemplate(templatePath: string): string {
    const fileName = path.basename(templatePath);

    switch (fileName) {
      case '.cursor-rules':
        return this.getDefaultCursorRules();
      case 'settings.json':
        if (templatePath.includes('vscode')) {
          return this.getDefaultVSCodeSettings();
        }
        break;
      case 'extensions.json':
        return this.getDefaultVSCodeExtensions();
    }

    return '{}';
  }

  /**
   * 获取默认Cursor规则
   */
  private getDefaultCursorRules(): string {
    return `# Cursor AI Rules for {{PROJECT_NAME}}

## Project Context
You are working on {{PROJECT_NAME}}, a {{PROJECT_TYPE}} project.

## Core Principles
- Write clean, maintainable, and well-documented code
- Follow established patterns and conventions
- Prioritize code readability and performance
- Implement comprehensive error handling

## AI Assistant Behavior
- Always suggest the most maintainable solution
- Provide code examples with proper error handling
- Explain complex logic with inline comments
- Consider accessibility and security implications

Generated by TaskFlow AI v{{VERSION}} on {{DATE}}
`;
  }

  /**
   * 获取默认VSCode设置
   */
  private getDefaultVSCodeSettings(): string {
    return JSON.stringify({
      'editor.formatOnSave': true,
      'editor.codeActionsOnSave': {
        'source.fixAll': true,
        'source.organizeImports': true
      },
      'typescript.preferences.includePackageJsonAutoImports': 'auto',
      'typescript.suggest.autoImports': true,
      'files.exclude': {
        '**/node_modules': true,
        '**/dist': true,
        '**/.git': true
      }
    }, null, 2);
  }



  /**
   * 获取默认VSCode扩展
   */
  private getDefaultVSCodeExtensions(): string {
    return JSON.stringify({
      'recommendations': [
        'ms-vscode.vscode-typescript-next',
        'esbenp.prettier-vscode',
        'dbaeumer.vscode-eslint',
        'github.copilot',
        'github.copilot-chat'
      ]
    }, null, 2);
  }

  /**
   * 生成Windsurf编辑器配置
   */
  public async generateWindsurfConfig(targetDir: string, variables: EditorVariables): Promise<void> {
    const windsurfDir = path.join(targetDir, '.windsurf');
    await fs.ensureDir(windsurfDir);

    // 生成Windsurf主配置文件
    const configContent = this.generateWindsurfMainConfig(variables);
    await fs.writeFile(path.join(windsurfDir, 'settings.json'), configContent);

    // 生成MCP服务配置
    const mcpConfig = this.generateMCPConfig(variables);
    await fs.writeFile(path.join(windsurfDir, 'mcp.json'), mcpConfig);

    // 生成AI助手配置
    const aiConfig = this.generateWindsurfAIConfig(variables);
    await fs.writeFile(path.join(windsurfDir, 'ai-config.json'), aiConfig);

    console.log(chalk.green('✅ Windsurf配置已生成'));
  }

  /**
   * 生成Trae编辑器配置
   */
  public async generateTraeConfig(targetDir: string, variables: EditorVariables): Promise<void> {
    const traeDir = path.join(targetDir, '.trae');
    await fs.ensureDir(traeDir);

    // 生成Trae主配置文件
    const configContent = this.generateTraeMainConfig(variables);
    await fs.writeFile(path.join(traeDir, 'config.json'), configContent);

    // 生成MCP服务配置
    const mcpConfig = this.generateMCPConfig(variables);
    await fs.writeFile(path.join(traeDir, 'mcp.json'), mcpConfig);

    // 生成工作流配置
    const workflowConfig = this.generateTraeWorkflowConfig(variables);
    await fs.writeFile(path.join(traeDir, 'workflows.json'), workflowConfig);

    console.log(chalk.green('✅ Trae配置已生成'));
  }

  /**
   * 生成MCP服务配置（通用）
   */
  private generateMCPConfig(_variables: EditorVariables): string {
    const mcpConfig = {
      "mcpServers": {
        "taskflow-ai": {
          "command": "node",
          "args": [
            path.join(process.cwd(), "node_modules", "taskflow-ai", "dist", "mcp-server.js")
          ],
          "env": {
            "TASKFLOW_PROJECT_ROOT": process.cwd(),
            "TASKFLOW_CONFIG_PATH": path.join(process.cwd(), ".taskflow", "config.json")
          }
        }
      },
      "tools": [
        {
          "name": "taskflow_parse_prd",
          "description": "解析PRD文档并生成任务列表",
          "server": "taskflow-ai"
        },
        {
          "name": "taskflow_generate_tasks",
          "description": "基于需求生成详细任务分解",
          "server": "taskflow-ai"
        },
        {
          "name": "taskflow_update_task_status",
          "description": "更新任务状态和进度",
          "server": "taskflow-ai"
        },
        {
          "name": "taskflow_get_project_status",
          "description": "获取项目整体状态和进度",
          "server": "taskflow-ai"
        },
        {
          "name": "taskflow_multi_model_orchestration",
          "description": "多模型协作处理复杂任务",
          "server": "taskflow-ai"
        }
      ]
    };

    return JSON.stringify(mcpConfig, null, 2);
  }

  /**
   * 生成Windsurf主配置
   */
  private generateWindsurfMainConfig(variables: EditorVariables): string {
    const config = {
      "// Generated by TaskFlow AI": `v${variables.VERSION} for ${variables.PROJECT_NAME}`,
      "// Project Type": variables.PROJECT_TYPE,
      "// Date": variables.DATE,

      "editor": {
        "fontSize": 14,
        "fontFamily": "'Fira Code', 'Cascadia Code', monospace",
        "fontLigatures": true,
        "tabSize": 2,
        "insertSpaces": true,
        "formatOnSave": true,
        "formatOnPaste": true,
        "autoSave": "afterDelay",
        "autoSaveDelay": 1000
      },

      "ai": {
        "enabled": true,
        "provider": "taskflow-ai",
        "features": {
          "codeCompletion": true,
          "codeGeneration": true,
          "taskDecomposition": true,
          "projectAnalysis": true,
          "multiModelOrchestration": true
        },
        "models": {
          "primary": "qwen",
          "fallback": ["wenxin", "spark", "moonshot"],
          "taskSpecific": {
            "codeGeneration": "deepseek",
            "documentation": "qwen",
            "testing": "zhipu"
          }
        }
      },

      "taskflow": {
        "integration": {
          "enabled": true,
          "autoTaskTracking": true,
          "smartTaskDecomposition": true,
          "progressSync": true
        },
        "features": {
          "prdParsing": variables.PROJECT_TYPE?.includes('Web') || variables.PROJECT_TYPE?.includes('API'),
          "multiModelSupport": true,
          "realTimeCollaboration": true,
          "intelligentPlanning": true
        }
      },

      "workspace": {
        "name": variables.PROJECT_NAME,
        "type": variables.PROJECT_TYPE,
        "settings": {
          "typescript": variables.TYPESCRIPT || false,
          "react": variables.REACT || false,
          "vue": variables.VUE || false,
          "testing": variables.JEST || false,
          "port": variables.PORT || 3000
        }
      }
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 生成Windsurf AI配置
   */
  private generateWindsurfAIConfig(variables: EditorVariables): string {
    const aiConfig = {
      "// TaskFlow AI Integration": "Multi-model orchestration for intelligent development",

      "providers": {
        "taskflow": {
          "name": "TaskFlow AI",
          "type": "mcp",
          "enabled": true,
          "capabilities": [
            "task_decomposition",
            "multi_model_orchestration",
            "project_analysis",
            "code_generation",
            "documentation_generation"
          ]
        }
      },

      "orchestration": {
        "enabled": true,
        "strategy": "intelligent",
        "models": {
          "codeGeneration": {
            "primary": "deepseek",
            "fallback": ["qwen", "zhipu"]
          },
          "taskPlanning": {
            "primary": "qwen",
            "fallback": ["wenxin", "spark"]
          },
          "documentation": {
            "primary": "moonshot",
            "fallback": ["qwen", "zhipu"]
          },
          "testing": {
            "primary": "zhipu",
            "fallback": ["deepseek", "qwen"]
          }
        }
      },

      "features": {
        "smartTaskBreakdown": {
          "enabled": true,
          "maxDepth": 3,
          "autoAssignment": true,
          "dependencyTracking": true
        },
        "contextAwareAssistance": {
          "enabled": true,
          "projectContext": true,
          "taskContext": true,
          "codeContext": true
        },
        "realTimeSync": {
          "enabled": true,
          "taskStatus": true,
          "progress": true,
          "collaboration": true
        }
      },

      "rules": {
        "codeStyle": {
          "indentation": 2,
          "quotes": "single",
          "semicolons": true,
          "trailingComma": "es5"
        },
        "naming": {
          "variables": "camelCase",
          "functions": "camelCase",
          "classes": "PascalCase",
          "constants": "UPPER_SNAKE_CASE"
        },
        "typescript": variables.TYPESCRIPT ? {
          "strict": true,
          "noImplicitAny": true,
          "strictNullChecks": true,
          "noImplicitReturns": true
        } : null
      }
    };

    return JSON.stringify(aiConfig, null, 2);
  }

  /**
   * 生成Trae主配置
   */
  private generateTraeMainConfig(variables: EditorVariables): string {
    const config = {
      "// Generated by TaskFlow AI": `v${variables.VERSION} for ${variables.PROJECT_NAME}`,
      "// Project Type": variables.PROJECT_TYPE,
      "// Date": variables.DATE,

      "editor": {
        "theme": "dark",
        "fontSize": 14,
        "fontFamily": "Fira Code",
        "tabSize": 2,
        "autoSave": true,
        "formatOnSave": true
      },

      "ai": {
        "provider": "taskflow-ai",
        "enabled": true,
        "features": {
          "intelligentTaskDecomposition": true,
          "multiModelOrchestration": true,
          "contextAwareGeneration": true,
          "realTimeCollaboration": true
        }
      },

      "taskflow": {
        "integration": {
          "enabled": true,
          "mcpServer": "taskflow-ai",
          "autoSync": true,
          "smartPlanning": true
        },
        "workflow": {
          "autoTaskCreation": true,
          "dependencyTracking": true,
          "progressMonitoring": true,
          "statusSync": true
        }
      },

      "project": {
        "name": variables.PROJECT_NAME,
        "type": variables.PROJECT_TYPE,
        "technologies": {
          "typescript": variables.TYPESCRIPT || false,
          "react": variables.REACT || false,
          "vue": variables.VUE || false,
          "node": variables.NODE_API || false,
          "testing": variables.JEST || false
        }
      }
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 生成Trae工作流配置
   */
  private generateTraeWorkflowConfig(_variables: EditorVariables): string {
    const workflows = {
      "// TaskFlow AI Workflow Integration": "Intelligent task management and execution",

      "workflows": [
        {
          "name": "Smart Task Decomposition",
          "trigger": "on_prd_change",
          "actions": [
            {
              "type": "taskflow_parse_prd",
              "config": {
                "autoGenerate": true,
                "multiModel": true,
                "assignees": "auto"
              }
            },
            {
              "type": "taskflow_generate_tasks",
              "config": {
                "depth": 3,
                "dependencies": true,
                "estimates": true
              }
            }
          ]
        },
        {
          "name": "Multi-Model Code Generation",
          "trigger": "on_task_start",
          "actions": [
            {
              "type": "taskflow_multi_model_orchestration",
              "config": {
                "strategy": "best_for_task",
                "fallback": true,
                "quality_check": true
              }
            }
          ]
        },
        {
          "name": "Progress Sync",
          "trigger": "on_file_save",
          "actions": [
            {
              "type": "taskflow_update_task_status",
              "config": {
                "auto_detect": true,
                "sync_team": true
              }
            }
          ]
        }
      ],

      "triggers": {
        "on_prd_change": {
          "files": ["*.md", "requirements/**", "docs/prd/**"],
          "debounce": 2000
        },
        "on_task_start": {
          "events": ["task.assigned", "task.started"],
          "immediate": true
        },
        "on_file_save": {
          "files": ["src/**", "tests/**"],
          "debounce": 1000
        }
      }
    };

    return JSON.stringify(workflows, null, 2);
  }
}
