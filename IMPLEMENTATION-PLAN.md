# TaskFlow AI v3.0 实施计划

## 迭代一：Agent 核心（第 1-2 周）

### Week 1: 基础架构搭建

#### Day 1-2: 项目结构初始化

```bash
# 创建新的目录结构
mkdir -p src/agent/{core,state-machine,planning,execution,verification}
mkdir -p src/codegen/{templates,engines,validators}
mkdir -p src/web/{client,server,components}
mkdir -p src/marketplace/{registry,installer,publisher}
mkdir -p src/knowledge/{embedding,storage,retrieval}

# 安装核心依赖
npm install xstate zustand socket.io @xstate/fsm
npm install -D @types/socket.io
```

#### Day 3-4: 状态机实现

```typescript
// src/agent/state-machine/index.ts
import { createMachine, interpret, EventObject } from 'xstate';
import { AgentContext, AgentState, AgentEvent } from '../types';

export const createAgentMachine = (context: AgentContext) => {
  return createMachine<AgentContext, AgentEvent>({
    id: 'taskflow-agent',
    initial: 'idle',
    context,
    states: {
      idle: {
        on: {
          START: {
            target: 'planning',
            actions: ['logStart']
          }
        }
      },
      planning: {
        entry: ['startPlanning'],
        invoke: {
          src: 'planTasks',
          onDone: {
            target: 'executing',
            actions: ['setTaskPlan']
          },
          onError: {
            target: 'failed',
            actions: ['setError']
          }
        }
      },
      executing: {
        entry: ['startExecution'],
        invoke: {
          src: 'executeTasks',
          onDone: {
            target: 'verifying',
            actions: ['setExecutionResult']
          },
          onError: {
            target: 'failed',
            actions: ['setError']
          }
        }
      },
      verifying: {
        entry: ['startVerification'],
        invoke: {
          src: 'verifyResults',
          onDone: [
            {
              target: 'completed',
              cond: 'allTasksVerified',
              actions: ['setVerificationResult']
            },
            {
              target: 'executing',
              actions: ['createFixTasks']
            }
          ],
          onError: {
            target: 'failed',
            actions: ['setError']
          }
        }
      },
      completed: {
        type: 'final',
        entry: ['generateReport', 'cleanup']
      },
      failed: {
        type: 'final',
        entry: ['logFailure', 'cleanup']
      }
    }
  }, {
    actions: {
      logStart: (ctx, event) => {
        console.log('🚀 Agent started');
      },
      startPlanning: (ctx) => {
        console.log('📋 Planning tasks...');
      },
      setTaskPlan: (ctx, event) => {
        ctx.taskPlan = event.data;
      },
      // ... more actions
    },
    services: {
      planTasks: async (ctx) => {
        // 调用 AI 规划任务
        return await ctx.planningEngine.plan(ctx.prd);
      },
      executeTasks: async (ctx) => {
        // 执行任务
        return await ctx.executionEngine.execute(ctx.taskPlan);
      },
      verifyResults: async (ctx) => {
        // 验证结果
        return await ctx.verificationEngine.verify(ctx.executionResult);
      }
    },
    guards: {
      allTasksVerified: (ctx, event) => {
        return event.data.allPassed;
      }
    }
  });
};
```

#### Day 5-7: 规划引擎实现

```typescript
// src/agent/planning/engine.ts
import { OpenAI } from 'openai';
import { PRDDocument, TaskPlan, Task } from '../types';

export class PlanningEngine {
  private ai: OpenAI;
  
  constructor(apiKey: string) {
    this.ai = new OpenAI({ apiKey });
  }
  
  async plan(prd: PRDDocument): Promise<TaskPlan> {
    const prompt = this.buildPlanningPrompt(prd);
    
    const response = await this.ai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a task planning expert. Analyze the PRD and create a detailed task plan.
          
Rules:
1. Break down features into atomic tasks
2. Identify dependencies between tasks
3. Estimate effort for each task
4. Assign appropriate task types (frontend, backend, design, test)
5. Consider technical constraints

Output format: JSON with tasks array`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    const plan = JSON.parse(response.choices[0].message.content);
    return this.validateAndEnrichPlan(plan);
  }
  
  private buildPlanningPrompt(prd: PRDDocument): string {
    return `
PRD Title: ${prd.title}
Description: ${prd.description}

Requirements:
${prd.requirements.map(r => `- ${r}`).join('\n')}

Acceptance Criteria:
${prd.acceptanceCriteria.map(c => `- ${c}`).join('\n')}

Please create a detailed task plan with:
1. Task breakdown
2. Dependencies
3. Effort estimates
4. Task types
`;
  }
  
  private validateAndEnrichPlan(plan: any): TaskPlan {
    // 验证和丰富计划
    return {
      tasks: plan.tasks.map((t: any) => ({
        id: `T${String(Math.random()).slice(2, 5).padStart(3, '0')}`,
        ...t,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      dependencies: plan.dependencies || [],
      totalEstimate: plan.tasks.reduce((sum: number, t: any) => sum + (t.estimate || 0), 0)
    };
  }
}
```

### Week 2: 执行引擎与 CLI

#### Day 8-10: 执行引擎

```typescript
// src/agent/execution/engine.ts
import { TaskPlan, Task, ExecutionResult, ExecutionContext } from '../types';
import { MCPServer } from '../../mcp/server';

export class ExecutionEngine {
  private mcpServer: MCPServer;
  private context: ExecutionContext;
  
  constructor(mcpServer: MCPServer, context: ExecutionContext) {
    this.mcpServer = mcpServer;
    this.context = context;
  }
  
  async execute(plan: TaskPlan): Promise<ExecutionResult> {
    const results: TaskResult[] = [];
    
    // 拓扑排序，按依赖顺序执行
    const sortedTasks = this.topologicalSort(plan.tasks, plan.dependencies);
    
    for (const task of sortedTasks) {
      console.log(`🔄 Executing task: ${task.title}`);
      
      try {
        const result = await this.executeTask(task);
        results.push(result);
        
        if (!result.success && !this.context.config.continueOnError) {
          break;
        }
      } catch (error) {
        results.push({
          taskId: task.id,
          success: false,
          error: error.message
        });
        
        if (!this.context.config.continueOnError) {
          break;
        }
      }
    }
    
    return {
      results,
      completedAt: new Date(),
      success: results.every(r => r.success)
    };
  }
  
  private async executeTask(task: Task): Promise<TaskResult> {
    switch (task.type) {
      case 'code':
        return await this.executeCodeTask(task);
      case 'file':
        return await this.executeFileTask(task);
      case 'shell':
        return await this.executeShellTask(task);
      case 'analysis':
        return await this.executeAnalysisTask(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
  
  private async executeCodeTask(task: Task): Promise<TaskResult> {
    // 使用代码生成引擎
    const code = await this.generateCode(task);
    
    // 写入文件
    await this.mcpServer.callTool('file_write', {
      path: task.outputPath,
      content: code
    });
    
    return {
      taskId: task.id,
      success: true,
      output: code
    };
  }
  
  private async generateCode(task: Task): Promise<string> {
    // 调用 AI 生成代码
    // 使用模板引擎
    return generatedCode;
  }
  
  private topologicalSort(tasks: Task[], dependencies: Dependency[]): Task[] {
    // 实现拓扑排序
    return sortedTasks;
  }
}
```

#### Day 11-14: CLI 界面

```typescript
// src/cli/commands/agent.ts
import { Command } from 'commander';
import { createAgentMachine } from '../../agent/state-machine';
import { interpret } from 'xstate';
import chalk from 'chalk';
import ora from 'ora';

export const agentCommand = new Command('agent')
  .description('AI Agent autonomous execution mode')
  .option('-p, --prd <path>', 'PRD document path')
  .option('-m, --mode <mode>', 'Execution mode: assisted|autonomous|supervised', 'assisted')
  .option('-c, --constraint <constraints...>', 'Constraints')
  .option('--max-iterations <n>', 'Maximum iterations', '10')
  .option('--dry-run', 'Simulate execution without making changes')
  .action(async (options) => {
    const spinner = ora('Initializing AI Agent...').start();
    
    try {
      // 加载 PRD
      const prd = await loadPRD(options.prd);
      
      // 创建 Agent 上下文
      const context: AgentContext = {
        prd,
        config: {
          mode: options.mode,
          maxIterations: parseInt(options.maxIterations),
          autoFix: options.mode === 'autonomous',
          approvalRequired: options.mode === 'supervised' 
            ? ['file_write', 'shell_exec'] 
            : []
        },
        constraints: options.constraint || []
      };
      
      // 创建状态机
      const machine = createAgentMachine(context);
      const service = interpret(machine);
      
      // 监听状态变化
      service.onTransition((state) => {
        spinner.text = getStatusMessage(state.value as string);
        
        if (state.matches('completed')) {
          spinner.succeed('✅ Agent execution completed successfully!');
          console.log(chalk.green('\n📊 Execution Report:'));
          console.log(generateReport(state.context));
        } else if (state.matches('failed')) {
          spinner.fail('❌ Agent execution failed');
          console.log(chalk.red('\nError:'), state.context.error);
        }
      });
      
      // 启动 Agent
      service.start();
      service.send({ type: 'START' });
      
      // 等待完成
      await waitForCompletion(service);
      
    } catch (error) {
      spinner.fail(`Failed: ${error.message}`);
      process.exit(1);
    }
  });

function getStatusMessage(state: string): string {
  const messages: Record<string, string> = {
    'idle': 'Ready to start',
    'planning': '📋 Analyzing PRD and planning tasks...',
    'executing': '🔄 Executing tasks...',
    'verifying': '🔍 Verifying results...',
    'completed': '✅ Completed!',
    'failed': '❌ Failed'
  };
  return messages[state] || 'Processing...';
}
```

---

## 迭代二：代码生成（第 3-4 周）

### Week 3: 模板系统

```typescript
// src/codegen/templates/registry.ts
import Handlebars from 'handlebars';
import { CodeTemplate, TemplateContext } from './types';

export class TemplateRegistry {
  private templates: Map<string, CodeTemplate> = new Map();
  private helpers: Map<string, Function> = new Map();
  
  constructor() {
    this.registerDefaultHelpers();
    this.loadBuiltinTemplates();
  }
  
  register(template: CodeTemplate): void {
    this.templates.set(template.id, template);
  }
  
  get(id: string): CodeTemplate | undefined {
    return this.templates.get(id);
  }
  
  render(templateId: string, context: TemplateContext): string {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const compiled = Handlebars.compile(template.template);
    return compiled(context);
  }
  
  private registerDefaultHelpers(): void {
    // 类型转换 helper
    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
    });
    
    Handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });
    
    // 条件 helper
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('and', (...args: any[]) => 
      args.slice(0, -1).every(Boolean)
    );
  }
  
  private loadBuiltinTemplates(): void {
    // 加载内置模板
    this.register(reactComponentTemplate);
    this.register(vueComponentTemplate);
    this.register(apiEndpointTemplate);
    this.register(databaseModelTemplate);
  }
}

// 内置模板
const reactComponentTemplate: CodeTemplate = {
  id: 'react-functional-component',
  name: 'React Functional Component',
  framework: 'react',
  language: 'typescript',
  template: `import React{{#if hasState}}, { useState{{#if hasEffects}}, useEffect{{/if}} }{{else}}{{#if hasEffects}}, { useEffect }{{/if}}{{/if}} from 'react';
{{#if hasStyles}}
import styles from './{{pascalCase componentName}}.module.css';
{{/if}}

export interface {{pascalCase componentName}}Props {
  {{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
  {{/each}}
}

export const {{pascalCase componentName}}: React.FC<{{pascalCase componentName}}Props> = ({
  {{#each props}}
  {{name}}{{#if defaultValue}} = {{defaultValue}}{{/if}},
  {{/each}}
}) => {
  {{#if hasState}}
  {{#each state}}
  const [{{name}}, set{{pascalCase name}}] = useState<{{type}}>({{defaultValue}});
  {{/each}}
  {{/if}}

  {{#if hasEffects}}
  useEffect(() => {
    {{effectLogic}}
  }, [{{effectDependencies}}]);
  {{/if}}

  return (
    {{#if hasStyles}}
    <div className={styles.container}>
    {{else}}
    <div>
    {{/if}}
      {{componentContent}}
    </div>
  );
};

export default {{pascalCase componentName}};
`,
  variables: [
    { name: 'componentName', type: 'string', required: true },
    { name: 'props', type: 'array', required: false },
    { name: 'hasState', type: 'boolean', required: false },
    { name: 'hasEffects', type: 'boolean', required: false },
    { name: 'hasStyles', type: 'boolean', required: false }
  ]
};
```

### Week 4: 代码生成引擎

```typescript
// src/codegen/engines/component.ts
import { TemplateRegistry } from '../templates/registry';
import { AIEngine } from '../ai/engine';
import { ComponentSpec, GeneratedComponent } from './types';

export class ComponentEngine {
  private templates: TemplateRegistry;
  private ai: AIEngine;
  
  constructor(templates: TemplateRegistry, ai: AIEngine) {
    this.templates = templates;
    this.ai = ai;
  }
  
  async generate(spec: ComponentSpec): Promise<GeneratedComponent> {
    // 1. 分析需求
    const analysis = await this.analyzeRequirements(spec);
    
    // 2. 选择模板
    const templateId = this.selectTemplate(analysis);
    
    // 3. 准备上下文
    const context = await this.buildContext(spec, analysis);
    
    // 4. 生成代码
    const code = this.templates.render(templateId, context);
    
    // 5. 生成测试
    const tests = await this.generateTests(spec, code);
    
    // 6. 生成样式
    const styles = await this.generateStyles(spec, analysis);
    
    return {
      name: spec.name,
      framework: spec.framework,
      files: [
        { path: `${spec.name}.tsx`, content: code },
        { path: `${spec.name}.test.tsx`, content: tests },
        { path: `${spec.name}.module.css`, content: styles }
      ]
    };
  }
  
  private async analyzeRequirements(spec: ComponentSpec): Promise<ComponentAnalysis> {
    const prompt = `
Analyze this component requirement and extract:
1. Props needed
2. State needed
3. Effects needed
4. Styling approach
5. Accessibility requirements

Requirement: ${spec.description}
`;
    
    const response = await this.ai.complete(prompt);
    return JSON.parse(response);
  }
  
  private selectTemplate(analysis: ComponentAnalysis): string {
    // 根据分析结果选择最佳模板
    if (analysis.hasState || analysis.hasEffects) {
      return 'react-functional-component';
    }
    return 'react-simple-component';
  }
  
  private async buildContext(spec: ComponentSpec, analysis: ComponentAnalysis): Promise<any> {
    return {
      componentName: spec.name,
      props: analysis.props,
      hasState: analysis.hasState,
      hasEffects: analysis.hasEffects,
      hasStyles: analysis.hasStyles,
      state: analysis.state,
      effectLogic: analysis.effectLogic,
      effectDependencies: analysis.effectDependencies,
      componentContent: await this.generateContent(spec, analysis)
    };
  }
  
  private async generateContent(spec: ComponentSpec, analysis: ComponentAnalysis): Promise<string> {
    // 使用 AI 生成组件内容
    const prompt = `
Generate JSX content for a React component:
Name: ${spec.name}
Props: ${JSON.stringify(analysis.props)}
Description: ${spec.description}

Return only the JSX content, no wrapper elements.
`;
    
    return await this.ai.complete(prompt);
  }
  
  private async generateTests(spec: ComponentSpec, code: string): Promise<string> {
    // 生成单元测试
    const prompt = `
Generate Jest + React Testing Library tests for this component:

${code}

Include tests for:
1. Rendering
2. Props handling
3. User interactions
4. Edge cases
`;
    
    return await this.ai.complete(prompt);
  }
  
  private async generateStyles(spec: ComponentSpec, analysis: ComponentAnalysis): Promise<string> {
    // 生成 CSS 模块
    return `.container {
  /* Component styles */
}`;
  }
}
```

---

## 迭代三：Web 界面（第 5-6 周）

### Week 5: 后端 API

```typescript
// src/web/server/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { TaskManager } from './managers/task';
import { CollaborationManager } from './managers/collaboration';

export class WebServer {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: Server;
  private taskManager: TaskManager;
  private collaborationManager: CollaborationManager;
  
  constructor(port: number = 3000) {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: { origin: '*' }
    });
    
    this.taskManager = new TaskManager();
    this.collaborationManager = new CollaborationManager(this.io);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }
  
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }
  
  private setupRoutes(): void {
    // REST API
    this.app.get('/api/projects', this.listProjects.bind(this));
    this.app.get('/api/projects/:id/tasks', this.getTasks.bind(this));
    this.app.post('/api/projects/:id/tasks', this.createTask.bind(this));
    this.app.put('/api/tasks/:id', this.updateTask.bind(this));
    this.app.delete('/api/tasks/:id', this.deleteTask.bind(this));
    
    // 实时状态
    this.app.get('/api/sessions', this.getActiveSessions.bind(this));
  }
  
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // 加入项目房间
      socket.on('join-project', (projectId: string) => {
        socket.join(projectId);
        this.collaborationManager.addParticipant(projectId, socket.id);
      });
      
      // 任务操作
      socket.on('task:create', (data) => {
        this.handleTaskCreate(socket, data);
      });
      
      socket.on('task:update', (data) => {
        this.handleTaskUpdate(socket, data);
      });
      
      socket.on('task:move', (data) => {
        this.handleTaskMove(socket, data);
      });
      
      // 光标位置
      socket.on('cursor:move', (data) => {
        this.handleCursorMove(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.collaborationManager.removeParticipant(socket.id);
      });
    });
  }
  
  private async handleTaskCreate(socket: any, data: any): Promise<void> {
    const task = await this.taskManager.create(data);
    
    // 广播给房间内所有客户端
    socket.to(data.projectId).emit('task:created', task);
    
    // 记录操作历史
    this.collaborationManager.recordOperation({
      type: 'create',
      target: 'task',
      data: task,
      userId: socket.id,
      timestamp: Date.now()
    });
  }
  
  private async handleTaskUpdate(socket: any, data: any): Promise<void> {
    const task = await this.taskManager.update(data.id, data.updates);
    
    socket.to(data.projectId).emit('task:updated', {
      id: data.id,
      updates: data.updates
    });
  }
  
  private async handleTaskMove(socket: any, data: any): Promise<void> {
    const { taskId, from, to, projectId } = data;
    
    await this.taskManager.move(taskId, to);
    
    socket.to(projectId).emit('task:moved', {
      taskId,
      from,
      to
    });
  }
  
  private handleCursorMove(socket: any, data: any): void {
    socket.to(data.projectId).emit('cursor:moved', {
      userId: socket.id,
      position: data.position,
      timestamp: Date.now()
    });
  }
  
  start(): void {
    const port = process.env.PORT || 3000;
    this.httpServer.listen(port, () => {
      console.log(`🌐 Web server running on http://localhost:${port}`);
    });
  }
}
```

### Week 6: 前端界面

```typescript
// src/web/client/components/KanbanBoard.tsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Task, Column } from '../types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const socket = useSocket();
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: '待办', tasks: [] },
    { id: 'in-progress', title: '进行中', tasks: [] },
    { id: 'review', title: '审核中', tasks: [] },
    { id: 'done', title: '已完成', tasks: [] }
  ]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  
  useEffect(() => {
    socket.emit('join-project', projectId);
    
    // 监听任务更新
    socket.on('task:created', (task: Task) => {
      setColumns(prev => addTaskToColumn(prev, task));
    });
    
    socket.on('task:updated', ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      setColumns(prev => updateTaskInColumns(prev, id, updates));
    });
    
    socket.on('task:moved', ({ taskId, to }: { taskId: string; to: string }) => {
      setColumns(prev => moveTaskToColumn(prev, taskId, to));
    });
    
    // 监听光标位置
    socket.on('cursor:moved', ({ userId, position }: { userId: string; position: Position }) => {
      setCursors(prev => new Map(prev).set(userId, position));
    });
    
    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('cursor:moved');
    };
  }, [projectId, socket]);
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { draggableId, source, destination } = result;
    
    // 本地更新
    setColumns(prev => moveTaskToColumn(prev, draggableId, destination.droppableId));
    
    // 发送给服务器
    socket.emit('task:move', {
      taskId: draggableId,
      from: source.droppableId,
      to: destination.droppableId,
      projectId
    });
  };
  
  const handleCreateTask = (columnId: string) => {
    const newTask: Partial<Task> = {
      title: '新任务',
      status: columnId,
      projectId
    };
    
    socket.emit('task:create', newTask);
  };
  
  return (
    <div className="kanban-board">
      <DragDropContext onDragEnd={handleDragEnd}>
        {columns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="kanban-column"
              >
                <h3>{column.title}</h3>
                
                {column.tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="kanban-task"
                      >
                        <h4>{task.title}</h4>
                        <p>{task.description}</p>
                        <div className="task-meta">
                          <span className="task-assignee">{task.assignee}</span>
                          <span className="task-priority">{task.priority}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                
                {provided.placeholder}
                
                <button 
                  className="add-task-btn"
                  onClick={() => handleCreateTask(column.id)}
                >
                  + 添加任务
                </button>
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
      
      {/* 显示其他用户的光标 */}
      {Array.from(cursors.entries()).map(([userId, position]) => (
        <div
          key={userId}
          className="remote-cursor"
          style={{ left: position.x, top: position.y }}
        >
          <div className="cursor-pointer" />
          <span className="cursor-label">{userId.slice(0, 8)}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 开发规范

### 代码规范

```typescript
// 使用严格的类型定义
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 使用函数式编程
const processTasks = (tasks: Task[]): Task[] => 
  tasks
    .filter(t => t.status !== 'archived')
    .map(t => ({ ...t, title: t.title.trim() }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

// 错误处理
const safeExecute = async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
  try {
    return { success: true, data: await fn() };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};
```

### 测试规范

```typescript
// 每个模块都需要测试
describe('AgentEngine', () => {
  describe('planning', () => {
    it('should create task plan from PRD', async () => {
      // Arrange
      const prd = createMockPRD();
      const engine = new PlanningEngine(mockAI);
      
      // Act
      const plan = await engine.plan(prd);
      
      // Assert
      expect(plan.tasks).toHaveLength(3);
      expect(plan.totalEstimate).toBeGreaterThan(0);
    });
    
    it('should handle invalid PRD gracefully', async () => {
      // Test error handling
    });
  });
});
```

### 文档规范

每个功能都需要：
1. **README** - 功能说明
2. **API 文档** - 接口定义
3. **使用示例** - 代码示例
4. **测试覆盖** - > 80%

---

## 下一步行动

1. **立即开始**：创建 feature/v3.0 分支
2. **Week 1**：实现 Agent 状态机核心
3. **每日站会**：同步进度和阻塞
4. **每周评审**：代码审查和计划调整

要我立即开始编写第一行代码吗？