/**
 * GitHub Actions 集成
 * CI/CD 流水线集成实现
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import {
  CIProvider,
  PipelineConfig,
  GitHubActionsConfig,
  ValidationResult,
  PipelineStatus,
  WorkflowTemplate,
  BuildReport
} from '../types';

export class GitHubActionsIntegration {
  private token: string;
  private repository: string;
  private baseUrl: string = 'https://api.github.com';

  constructor(token: string, repository: string) {
    this.token = token;
    this.repository = repository;
  }

  /**
   * 验证配置
   */
  async validateConfig(config: PipelineConfig): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // 验证触发器
    if (!config.triggers || config.triggers.length === 0) {
      errors.push({
        field: 'triggers',
        message: 'At least one trigger is required',
        code: 'MISSING_TRIGGERS'
      });
    }

    // 验证阶段
    if (!config.stages || config.stages.length === 0) {
      errors.push({
        field: 'stages',
        message: 'At least one stage is required',
        code: 'MISSING_STAGES'
      });
    }

    // 验证 secrets
    for (const secret of config.secrets || []) {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(secret)) {
        errors.push({
          field: `secrets.${secret}`,
          message: 'Secret names must be uppercase with underscores',
          code: 'INVALID_SECRET_NAME'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 生成 GitHub Actions 工作流文件
   */
  generateWorkflow(config: GitHubActionsConfig): string {
    const workflow: any = {
      name: config.name,
      on: this.generateTriggers(config.triggers),
      permissions: this.generatePermissions(config.permissions),
      jobs: {}
    };

    // 添加并发控制
    if (config.concurrency) {
      workflow.concurrency = {
        group: config.concurrency.group,
        'cancel-in-progress': config.concurrency.cancelInProgress
      };
    }

    // 添加环境变量
    if (config.environment && Object.keys(config.environment).length > 0) {
      workflow.env = config.environment;
    }

    // 生成任务
    for (const stage of config.stages) {
      for (const job of stage.jobs) {
        workflow.jobs[job.name] = this.generateJob(job, stage);
      }
    }

    return this.toYaml(workflow);
  }

  /**
   * 部署工作流
   */
  async deployWorkflow(config: GitHubActionsConfig): Promise<void> {
    const workflowContent = this.generateWorkflow(config);
    const workflowDir = path.join('.github', 'workflows');
    const workflowFile = path.join(workflowDir, config.workflowFile);

    await fs.ensureDir(workflowDir);
    await fs.writeFile(workflowFile, workflowContent, 'utf-8');

    console.log(`✅ GitHub Actions workflow deployed: ${workflowFile}`);
  }

  /**
   * 获取流水线状态
   */
  async getPipelineStatus(runId: string): Promise<PipelineStatus> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.repository}/actions/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const run = response.data;

      return {
        id: run.id.toString(),
        status: this.mapStatus(run.status, run.conclusion),
        stage: '', // GitHub Actions 不直接提供阶段信息
        job: '',
        startedAt: new Date(run.run_started_at || run.created_at),
        finishedAt: run.updated_at !== run.created_at ? new Date(run.updated_at) : undefined,
        duration: run.run_duration_ms,
        url: run.html_url
      };

    } catch (error) {
      throw new Error(`Failed to get pipeline status: ${error}`);
    }
  }

  /**
   * 触发流水线
   */
  async triggerPipeline(branch: string = 'main', inputs?: Record<string, string>): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${this.repository}/actions/workflows/taskflow.yml/dispatches`,
        {
          ref: branch,
          inputs
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      console.log(`✅ Pipeline triggered for ${branch}`);
      return response.data.id;

    } catch (error) {
      throw new Error(`Failed to trigger pipeline: ${error}`);
    }
  }

  /**
   * 获取构建报告
   */
  async getBuildReport(runId: string): Promise<BuildReport> {
    try {
      // 获取运行信息
      const runResponse = await axios.get(
        `${this.baseUrl}/repos/${this.repository}/actions/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const run = runResponse.data;

      // 获取任务信息
      const jobsResponse = await axios.get(
        `${this.baseUrl}/repos/${this.repository}/actions/runs/${runId}/jobs`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const jobs = jobsResponse.data.jobs;

      // 构建报告
      const report: BuildReport = {
        id: run.id.toString(),
        status: this.mapStatus(run.status, run.conclusion),
        stages: [],
        summary: {
          totalStages: jobs.length,
          successfulStages: jobs.filter((j: any) => j.conclusion === 'success').length,
          failedStages: jobs.filter((j: any) => j.conclusion === 'failure').length,
          totalDuration: jobs.reduce((sum: number, j: any) => sum + (j.duration || 0), 0),
          testsPassed: 0,
          testsFailed: 0,
          coverage: 0
        },
        artifacts: []
      };

      // 解析任务为阶段
      for (const job of jobs) {
        const stageReport: any = {
          name: job.name,
          status: this.mapStatus(job.status, job.conclusion),
          duration: job.duration || 0,
          jobs: [{
            name: job.name,
            status: this.mapStatus(job.status, job.conclusion),
            duration: job.duration || 0,
            steps: job.steps?.map((step: any) => ({
              name: step.name,
              status: this.mapStatus(step.status, step.conclusion),
              duration: 0 // GitHub API 不直接提供步骤持续时间
            })) || []
          }]
        };

        report.stages.push(stageReport);
      }

      return report;

    } catch (error) {
      throw new Error(`Failed to get build report: ${error}`);
    }
  }

  /**
   * 创建 PR 评论
   */
  async createPRComment(prNumber: number, comment: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/repos/${this.repository}/issues/${prNumber}/comments`,
        { body: comment },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      console.log(`✅ Comment added to PR #${prNumber}`);

    } catch (error) {
      throw new Error(`Failed to create PR comment: ${error}`);
    }
  }

  /**
   * 设置 PR 状态检查
   */
  async setPRStatus(
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    context: string,
    description: string,
    targetUrl?: string
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/repos/${this.repository}/statuses/${sha}`,
        {
          state,
          context,
          description,
          target_url: targetUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      console.log(`✅ PR status set: ${context} - ${state}`);

    } catch (error) {
      throw new Error(`Failed to set PR status: ${error}`);
    }
  }

  /**
   * 获取工作流模板
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'taskflow-basic',
        name: 'TaskFlow Basic',
        description: 'Basic TaskFlow AI workflow with PRD validation',
        provider: 'github',
        content: this.getBasicTemplate(),
        variables: [
          { name: 'NODE_VERSION', description: 'Node.js version', default: '20', required: false },
          { name: 'TASKFLOW_VERSION', description: 'TaskFlow AI version', default: 'latest', required: false }
        ]
      },
      {
        id: 'taskflow-full',
        name: 'TaskFlow Full',
        description: 'Full TaskFlow AI workflow with testing and deployment',
        provider: 'github',
        content: this.getFullTemplate(),
        variables: [
          { name: 'NODE_VERSION', description: 'Node.js version', default: '20', required: false },
          { name: 'DEPLOY_ENV', description: 'Deployment environment', default: 'staging', required: false }
        ]
      }
    ];
  }

  // 私有辅助方法

  private generateTriggers(triggers: any[]): any {
    const on: any = {};

    for (const trigger of triggers) {
      switch (trigger.type) {
        case 'push':
          on.push = {
            branches: trigger.branches || ['main'],
            paths: trigger.paths
          };
          break;
        case 'pr':
          on.pull_request = {
            branches: trigger.branches || ['main'],
            paths: trigger.paths,
            types: ['opened', 'synchronize', 'reopened']
          };
          break;
        case 'schedule':
          on.schedule = [{ cron: trigger.cron || '0 0 * * *' }];
          break;
        case 'manual':
          on.workflow_dispatch = {
            inputs: {}
          };
          break;
      }
    }

    return on;
  }

  private generatePermissions(permissions: any): any {
    const perms: any = {};

    if (permissions?.contents) perms.contents = permissions.contents;
    if (permissions?.issues) perms.issues = permissions.issues;
    if (permissions?.pullRequests) perms['pull-requests'] = permissions.pullRequests;
    if (permissions?.actions) perms.actions = permissions.actions;

    return perms;
  }

  private generateJob(job: any, stage: any): any {
    const jobConfig: any = {
      name: job.name,
      'runs-on': job.runner || 'ubuntu-latest',
      steps: job.steps.map((step: any) => ({
        name: step.name,
        run: step.command,
        ...(step.workingDirectory && { 'working-directory': step.workingDirectory }),
        ...(step.condition && { if: step.condition }),
        ...(step.continueOnError && { 'continue-on-error': true })
      }))
    };

    // 添加依赖
    if (stage.needs && stage.needs.length > 0) {
      jobConfig.needs = stage.needs;
    }

    // 添加超时
    if (job.timeout) {
      jobConfig['timeout-minutes'] = job.timeout;
    }

    // 添加产物
    if (job.artifacts && job.artifacts.length > 0) {
      jobConfig.steps.push({
        uses: 'actions/upload-artifact@v4',
        with: {
          name: `${job.name}-artifacts`,
          path: job.artifacts.join('\n')
        }
      });
    }

    // 添加缓存
    if (job.cache) {
      jobConfig.steps.unshift({
        uses: 'actions/cache@v4',
        with: {
          path: job.cache.paths.join('\n'),
          key: job.cache.key
        }
      });
    }

    return jobConfig;
  }

  private mapStatus(status: string, conclusion?: string): PipelineStatus['status'] {
    if (status === 'queued' || status === 'waiting' || status === 'pending') {
      return 'pending';
    }
    if (status === 'in_progress') {
      return 'running';
    }
    if (status === 'completed') {
      if (conclusion === 'success') return 'success';
      if (conclusion === 'failure') return 'failure';
      if (conclusion === 'cancelled') return 'cancelled';
      if (conclusion === 'skipped') return 'skipped';
    }
    return 'failure';
  }

  private toYaml(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            const itemYaml = this.toYaml(item, indent + 1);
            yaml += `${spaces}- ${itemYaml.trim()}\n`;
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        }
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYaml(value, indent + 1);
      } else if (typeof value === 'boolean') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  private getBasicTemplate(): string {
    return `name: TaskFlow CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'
      
      - name: Install TaskFlow
        run: npm install -g taskflow-ai@{{TASKFLOW_VERSION}}
      
      - name: Validate PRD
        run: taskflow parse ./**/*.prd.md --validate
      
      - name: Check Task Status
        run: taskflow status
`;
  }

  private getFullTemplate(): string {
    return `name: TaskFlow Full CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
      - run: npm install -g taskflow-ai
      - run: taskflow parse ./**/*.prd.md --validate

  test:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: {{DEPLOY_ENV}}
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/
      - run: echo "Deploying to {{DEPLOY_ENV}}..."
`;
  }
}

export default GitHubActionsIntegration;
