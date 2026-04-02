/**
 * GitHub Actions 工作流生成器
 */

import { GitHubActionsConfig, PipelineTrigger, WorkflowTemplate } from '../types';

/** GitHub Actions trigger YAML 输出 */
interface GitHubTriggerOutput {
  push?: { branches?: string[]; paths?: string[] };
  pull_request?: { branches?: string[]; types?: string[] };
  schedule?: Array<{ cron: string }>;
  workflow_dispatch?: { inputs?: unknown };
}

/** GitHub Actions job YAML 节点 */
interface GitHubJobOutput {
  name: string;
  'runs-on': string;
  steps: GitHubStepOutput[];
  needs?: string[];
  if?: string;
}

/** GitHub Actions step YAML 节点 */
interface GitHubStepOutput {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string | number | boolean>;
  if?: string;
  'working-directory'?: string;
  shell?: string;
}

/** 工作流 YAML 节点 */
interface WorkflowYamlNode {
  name: string;
  on?: GitHubTriggerOutput;
  permissions?: Record<string, string>;
  jobs: Record<string, GitHubJobOutput>;
  concurrency?: Record<string, unknown>;
  env?: Record<string, string>;
}

export class GitHubWorkflowGenerator {
  generate(config: GitHubActionsConfig): string {
    const workflow: WorkflowYamlNode = {
      name: config.name,
      on: this.generateTriggers(config.triggers),
      permissions: this.generatePermissions(config.permissions),
      jobs: {},
    };

    if (config.concurrency) {
      workflow.concurrency = {
        group: config.concurrency.group,
        'cancel-in-progress': config.concurrency.cancelInProgress,
      };
    }

    if (config.env) {
      workflow.env = config.env;
    }

    for (const stage of config.stages) {
      workflow.jobs[stage.name] = this.generateJob(
        stage as unknown as Record<string, unknown>,
        config
      );
    }

    return this.toYaml(workflow as unknown as Record<string, unknown>);
  }

  private generateTriggers(triggers: PipelineTrigger[]): GitHubTriggerOutput {
    const result: GitHubTriggerOutput = {};

    for (const trigger of triggers) {
      if (trigger.type === 'push') {
        result.push = {
          branches: trigger.branches || ['main'],
          paths: trigger.paths,
        };
      } else if (trigger.type === 'pr') {
        result.pull_request = {
          branches: trigger.branches || ['main'],
          types: ['opened', 'synchronize', 'reopened'],
        };
      } else if (trigger.type === 'schedule') {
        result.schedule = [{ cron: trigger.cron || '' }];
      } else if (trigger.type === 'manual') {
        result.workflow_dispatch = {};
      }
    }

    return result;
  }

  private generatePermissions(permissions?: unknown): Record<string, string> {
    if (!permissions) {
      return {
        contents: 'read',
        actions: 'read',
        checks: 'write',
      };
    }
    return permissions as Record<string, string>;
  }

  private generateJob(
    stage: Record<string, unknown>,
    _config: GitHubActionsConfig
  ): GitHubJobOutput {
    const job: GitHubJobOutput = {
      name: (stage.name as string) || 'unnamed',
      'runs-on': (stage.runsOn as string) || 'ubuntu-latest',
      steps: [],
    };

    if (stage.needs) {
      job.needs = stage.needs as string[];
    }

    if (stage.if) {
      job.if = stage.if as string;
    }

    const steps = stage.steps as Array<Record<string, string>>;
    if (Array.isArray(steps)) {
      for (const step of steps) {
        job.steps.push(this.generateStep(step));
      }
    }

    return job;
  }

  private generateStep(step: Record<string, unknown>): GitHubStepOutput {
    const stepConfig: GitHubStepOutput = {};

    if (step.name) {
      stepConfig.name = step.name as string;
    }

    if (step.uses) {
      stepConfig.uses = step.uses as string;
      if (step.with) {
        stepConfig.with = step.with as unknown as Record<string, unknown>;
      }
    } else if (step.run) {
      stepConfig.run = step.run as string;
      if (step['working-directory']) {
        stepConfig['working-directory'] = step['working-directory'] as string;
      }
      if (step.shell) {
        stepConfig.shell = step.shell as string;
      }
    }

    if (step.env) {
      stepConfig.env = step.env as Record<string, string | number | boolean>;
    }

    if (step.if) {
      stepConfig.if = step.if as string;
    }

    return stepConfig;
  }

  private toYaml(obj: Record<string, unknown>, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYaml(value as Record<string, unknown>, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            yaml += `${spaces}- `;
            const lines = this.toYaml(item as Record<string, unknown>, 0)
              .trim()
              .split('\n');
            yaml += lines.join(`\n${spaces}  `) + '\n';
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  generateFromTemplate(template: WorkflowTemplate, variables: Record<string, string>): string {
    let content = template.content;

    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return content;
  }
}
