/**
 * GitHub Actions 工作流生成器
 */

import { GitHubActionsConfig, WorkflowTemplate } from '../types';

export class GitHubWorkflowGenerator {
  generate(config: GitHubActionsConfig): string {
    const workflow: any = {
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
      workflow.jobs[stage.name] = this.generateJob(stage, config);
    }

    return this.toYaml(workflow);
  }

  private generateTriggers(triggers: unknown): any {
    const result: any = {};

    for (const trigger of triggers) {
      if (trigger.type === 'push') {
        result.push = {
          branches: trigger.branches || ['main'],
          paths: trigger.paths,
        };
      } else if (trigger.type === 'pull_request') {
        result.pull_request = {
          branches: trigger.branches || ['main'],
          types: trigger.types || ['opened', 'synchronize', 'reopened'],
        };
      } else if (trigger.type === 'schedule') {
        result.schedule = [{ cron: trigger.cron }];
      } else if (trigger.type === 'workflow_dispatch') {
        result.workflow_dispatch = {
          inputs: trigger.inputs,
        };
      }
    }

    return result;
  }

  private generatePermissions(permissions?: unknown): any {
    if (!permissions) {
      return {
        contents: 'read',
        actions: 'read',
        checks: 'write',
      };
    }
    return permissions;
  }

  private generateJob(stage: unknown, config: GitHubActionsConfig): any {
    const job: any = {
      name: stage.name,
      'runs-on': stage.runsOn || 'ubuntu-latest',
      steps: [],
    };

    if (stage.needs) {
      job.needs = stage.needs;
    }

    if (stage.if) {
      job.if = stage.if;
    }

    for (const step of stage.steps) {
      job.steps.push(this.generateStep(step, config));
    }

    return job;
  }

  private generateStep(step: unknown, config: GitHubActionsConfig): any {
    const stepConfig: any = {};

    if (step.name) {
      stepConfig.name = step.name;
    }

    if (step.uses) {
      stepConfig.uses = step.uses;
      if (step.with) {
        stepConfig.with = step.with;
      }
    } else if (step.run) {
      stepConfig.run = step.run;
      if (step['working-directory']) {
        stepConfig['working-directory'] = step['working-directory'];
      }
      if (step.shell) {
        stepConfig.shell = step.shell;
      }
    }

    if (step.env) {
      stepConfig.env = step.env;
    }

    if (step.if) {
      stepConfig.if = step.if;
    }

    return stepConfig;
  }

  private toYaml(obj: unknown, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}- `;
            const lines = this.toYaml(item, 0).trim().split('\n');
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
