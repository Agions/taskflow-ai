/**
 * GitHub Workflow Generator Tests
 * TaskFlow AI v4.0.1
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - This test file uses generator-specific format that differs from PipelineStep types

import { GitHubWorkflowGenerator } from '../workflow-generator';
import { GitHubActionsConfig } from '../../types';

describe('GitHubWorkflowGenerator', () => {
  let generator: GitHubWorkflowGenerator;

  beforeEach(() => {
    generator = new GitHubWorkflowGenerator();
  });

  describe('Basic Generation', () => {
    it('should create generator instance', () => {
      expect(generator).toBeDefined();
      expect(generator).toBeInstanceOf(GitHubWorkflowGenerator);
    });

    it('should generate simple workflow', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Simple Workflow',
        triggers: [{ type: 'push', branches: ['main'] }],
        stages: [
          {
            name: 'Build',
            jobs: [
              {
                name: 'Build',
                steps: [{ name: 'Build', run: 'npm run build' }],
              },
            ],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'simple.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toBeDefined();
      expect(typeof workflow).toBe('string');
    });
  });

  describe('Trigger Generation', () => {
    it('should generate push trigger', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Push Workflow',
        triggers: [{ type: 'push', branches: ['main', 'develop'] }],
        stages: [
          {
            name: 'Test',
            jobs: [{ name: 'Test', steps: [{ name: 'Test', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'push.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('push:');
      expect(workflow).toContain('branches:');
    });

    it('should generate PR trigger', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'PR Workflow',
        triggers: [{ type: 'pr', branches: ['main'] }],
        stages: [
          {
            name: 'Test',
            jobs: [{ name: 'Test', steps: [{ name: 'Test', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'pr.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('pull_request:');
    });

    it('should generate schedule trigger', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Scheduled Workflow',
        triggers: [{ type: 'schedule', cron: '0 0 * * *' }],
        stages: [
          {
            name: 'Job',
            jobs: [{ name: 'Job', steps: [{ name: 'Job', run: 'npm run job' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'schedule.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('schedule:');
      expect(workflow).toContain('cron:');
    });

    it('should generate manual trigger', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Manual Workflow',
        triggers: [{ type: 'manual' }],
        stages: [
          {
            name: 'Job',
            jobs: [{ name: 'Job', steps: [{ name: 'Job', run: 'npm run job' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'manual.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('workflow_dispatch:');
    });
  });

  describe('Step Features', () => {
    it('should generate step with run command', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Step Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            jobs: [
              {
                name: 'Job',
                steps: [{ name: 'Install', run: 'npm install' }],
              },
            ],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'steps.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toBeDefined();
    });

    it('should generate step with uses', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Action Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            jobs: [
              {
                name: 'Job',
                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
              },
            ],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'actions.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toBeDefined();
    });

    it('should generate step with condition', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Conditional Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            jobs: [
              {
                name: 'Job',
                steps: [
                  { name: 'Notify', run: 'echo "complete"', if: 'always()' },
                ],
              },
            ],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'conditional.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toBeDefined();
    });
  });

  describe('Job Features', () => {
    it('should generate job with custom runner', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Runner Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            runsOn: 'ubuntu-20.04',
            jobs: [{ name: 'Job', steps: [{ name: 'Step', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'runner.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('runs-on:');
    });

    it('should generate job with dependencies', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Dependent Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'First',
            jobs: [{ name: 'FirstJob', steps: [{ name: 'Build', run: 'npm build' }] }],
          },
          {
            name: 'Second',
            needs: ['First'],
            jobs: [{ name: 'SecondJob', steps: [{ name: 'Test', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'dependent.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('needs:');
    });

    it('should generate job with condition', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Conditional Job Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            if: 'success()',
            jobs: [{ name: 'Job', steps: [{ name: 'Step', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'conditional-job.yml',
        permissions: { contents: 'read' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toBeDefined();
    });
  });

  describe('Permissions', () => {
    it('should generate workflow with permissions', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Permissions Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            jobs: [{ name: 'Job', steps: [{ name: 'Test', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'perms.yml',
        permissions: { contents: 'write', pullRequests: 'write' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('permissions:');
    });
  });

  describe('Concurrency', () => {
    it('should generate workflow with concurrency', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Concurrency Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            jobs: [{ name: 'Job', steps: [{ name: 'Test', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'concurrency.yml',
        permissions: { contents: 'read' },
        concurrency: {
          group: 'ci-group',
          cancelInProgress: true,
        },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('concurrency:');
      expect(workflow).toContain('cancel-in-progress: true');
    });
  });

  describe('Environment Variables', () => {
    it('should generate workflow with env vars', () => {
      const config: GitHubActionsConfig = {
        provider: 'github',
        name: 'Env Workflow',
        triggers: [{ type: 'push' }],
        stages: [
          {
            name: 'Stage',
            jobs: [{ name: 'Job', steps: [{ name: 'Test', run: 'npm test' }] }],
          },
        ],
        environment: {},
        secrets: [],
        notifications: [],
        workflowFile: 'env.yml',
        permissions: { contents: 'read' },
        env: { NODE_ENV: 'production' },
      } as GitHubActionsConfig;

      const workflow = generator.generate(config);
      expect(workflow).toContain('env:');
    });
  });
});

describe('Complex Workflows', () => {
  let generator: GitHubWorkflowGenerator;

  beforeEach(() => {
    generator = new GitHubWorkflowGenerator();
  });

  it('should handle multi-trigger workflow', () => {
    const config: GitHubActionsConfig = {
      provider: 'github',
      name: 'Multi-trigger Workflow',
      triggers: [
        { type: 'push', branches: ['main'] },
        { type: 'pr', branches: ['main'] },
        { type: 'schedule', cron: '0 0 * * *' },
      ],
      stages: [
        {
          name: 'Test',
          jobs: [{ name: 'Test', steps: [{ name: 'Test', run: 'npm test' }] }],
        },
      ],
      environment: {},
      secrets: [],
      notifications: [],
      workflowFile: 'multi.yml',
      permissions: { contents: 'read' },
    } as GitHubActionsConfig;

    const workflow = generator.generate(config);
    expect(workflow).toContain('push:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('schedule:');
  });

  it('should handle multi-stage workflow', () => {
    const config: GitHubActionsConfig = {
      provider: 'github',
      name: 'Multi-stage Workflow',
      triggers: [{ type: 'push' }],
      stages: [
        {
          name: 'Lint',
          jobs: [{ name: 'Lint', steps: [{ name: 'Lint', run: 'npm run lint' }] }],
        },
        {
          name: 'Test',
          jobs: [{ name: 'Test', steps: [{ name: 'Test', run: 'npm test' }] }],
        },
        {
          name: 'Build',
          jobs: [{ name: 'Build', steps: [{ name: 'Build', run: 'npm build' }] }],
        },
      ],
      environment: {},
      secrets: [],
      notifications: [],
      workflowFile: 'multistage.yml',
      permissions: { contents: 'read' },
    } as GitHubActionsConfig;

    const workflow = generator.generate(config);
    expect(workflow).toContain('Lint:');
    expect(workflow).toContain('Test:');
    expect(workflow).toContain('Build:');
  });

  it('should handle complete workflow with all features', () => {
    const config = {
      provider: 'github' as const,
      name: 'Complete Workflow',
      triggers: [
        { type: 'push' as const, branches: ['main', 'develop'] },
        { type: 'pr' as const, branches: ['main'] },
      ],
      stages: [
        {
          name: 'CI',
          jobs: [
            {
              name: 'Test',
              steps: [
                { name: 'Checkout', uses: 'actions/checkout@v4' },
                { name: 'Test', run: 'npm test' },
              ],
            },
          ],
        },
      ],
      environment: { NODE_ENV: 'test' },
      secrets: ['GITHUB_TOKEN'],
      notifications: [{ type: 'github' as const, target: '', events: ['failure'] }],
      workflowFile: 'complete.yml',
      permissions: {
        contents: 'write' as const,
        actions: 'write' as const,
        issues: 'write' as const,
        pullRequests: 'write' as const,
      },
      concurrency: {
        group: 'ci',
        cancelInProgress: true,
      },
      env: { NODE_VERSION: '20', CI: 'true' },
    };

    const workflow = generator.generate(config as unknown as GitHubActionsConfig);
    expect(workflow).toBeDefined();
    expect(workflow.length).toBeGreaterThan(0);
  });
});
