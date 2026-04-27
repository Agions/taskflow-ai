/**
 * CI/CD Types Tests
 * TaskFlow AI v4.0.1
 *
 * Tests for CI/CD type definitions and interfaces used across
 * different CI/CD providers (GitHub, GitLab, Jenkins, etc.)
 */

import {
  CIProvider,
  PipelineConfig,
  PipelineTrigger,
  PipelineStage,
  PipelineJob,
  PipelineStep,
  CacheConfig,
  NotificationConfig,
  GitHubActionsConfig,
  GitHubPermissions,
  GitHubConcurrency,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PipelineStatus,
} from '../types';

describe('CIProvider Type', () => {
  it('should have all provider values', () => {
    const providers: CIProvider[] = ['github', 'gitlab', 'jenkins', 'azure', 'circleci', 'travis'];
    expect(providers).toHaveLength(6);
  });

  it('should be string literal type', () => {
    const github: CIProvider = 'github';
    const gitlab: CIProvider = 'gitlab';
    expect(github).toBe('github');
    expect(gitlab).toBe('gitlab');
  });
});

describe('PipelineTrigger', () => {
  it('should support all trigger types', () => {
    const types: PipelineTrigger['type'][] = ['push', 'pr', 'schedule', 'manual', 'webhook'];
    expect(types).toHaveLength(5);
  });

  it('should create push trigger with branches', () => {
    const trigger: PipelineTrigger = {
      type: 'push',
      branches: ['main', 'develop'],
    };

    expect(trigger.type).toBe('push');
    expect(trigger.branches).toEqual(['main', 'develop']);
  });

  it('should create push trigger with paths', () => {
    const trigger: PipelineTrigger = {
      type: 'push',
      paths: ['src/**', 'tests/**'],
    };

    expect(trigger.paths).toEqual(['src/**', 'tests/**']);
  });

  it('should create pr trigger', () => {
    const trigger: PipelineTrigger = {
      type: 'pr',
      branches: ['main'],
    };

    expect(trigger.type).toBe('pr');
  });

  it('should create schedule trigger with cron', () => {
    const trigger: PipelineTrigger = {
      type: 'schedule',
      cron: '0 0 * * *',
    };

    expect(trigger.type).toBe('schedule');
    expect(trigger.cron).toBe('0 0 * * *');
  });

  it('should create manual trigger', () => {
    const trigger: PipelineTrigger = {
      type: 'manual',
    };

    expect(trigger.type).toBe('manual');
  });

  it('should create webhook trigger', () => {
    const trigger: PipelineTrigger = {
      type: 'webhook',
    };

    expect(trigger.type).toBe('webhook');
  });
});

describe('PipelineStep', () => {
  it('should create complete step', () => {
    const step: PipelineStep = {
      name: 'Install dependencies',
      command: 'npm install',
      workingDirectory: '/app',
      condition: 'success()',
      continueOnError: false,
    };

    expect(step.name).toBe('Install dependencies');
    expect(step.command).toBe('npm install');
  });

  it('should create minimal step', () => {
    const step: PipelineStep = {
      name: 'Build',
      command: 'npm run build',
    };

    expect(step.command).toBe('npm run build');
  });

  it('should support continueOnError', () => {
    const step: PipelineStep = {
      name: 'Optional step',
      command: 'echo "skip on error"',
      continueOnError: true,
    };

    expect(step.continueOnError).toBe(true);
  });
});

describe('PipelineJob', () => {
  it('should create job with steps', () => {
    const job: PipelineJob = {
      name: 'Test Job',
      steps: [
        { name: 'Setup', command: 'npm install' },
        { name: 'Test', command: 'npm test' },
      ],
    };

    expect(job.name).toBe('Test Job');
    expect(job.steps).toHaveLength(2);
  });

  it('should create job with runner', () => {
    const job: PipelineJob = {
      name: 'Docker Job',
      steps: [{ name: 'Build', command: 'docker build .' }],
      runner: 'ubuntu-latest',
    };

    expect(job.runner).toBe('ubuntu-latest');
  });

  it('should create job with timeout', () => {
    const job: PipelineJob = {
      name: 'Long-running Job',
      steps: [{ name: 'Deploy', command: 'npm deploy' }],
      timeout: 3600,
    };

    expect(job.timeout).toBe(3600);
  });

  it('should create job with artifacts', () => {
    const job: PipelineJob = {
      name: 'Build Job',
      steps: [{ name: 'Compile', command: 'make' }],
      artifacts: ['dist/*.js', 'coverage/*.json'],
    };

    expect(job.artifacts).toContain('dist/*.js');
  });

  it('should create job with cache', () => {
    const cache: CacheConfig = {
      paths: ['node_modules'],
      key: 'npm-${{ hashFiles("package-lock.json") }}',
    };

    const job: PipelineJob = {
      name: 'Cached Job',
      steps: [{ name: 'Build', command: 'npm build' }],
      cache,
    };

    expect(job.cache?.key).toContain('npm');
  });
});

describe('PipelineStage', () => {
  it('should create stage with parallel jobs', () => {
    const stage: PipelineStage = {
      name: 'Test Stage',
      parallel: true,
      jobs: [
        { name: 'Unit Tests', steps: [{ name: 'Test', command: 'npm test' }] },
        { name: 'Integration Tests', steps: [{ name: 'Integrate', command: 'npm run int' }] },
      ],
    };

    expect(stage.name).toBe('Test Stage');
    expect(stage.parallel).toBe(true);
    expect(stage.jobs).toHaveLength(2);
  });

  it('should create stage with dependencies', () => {
    const stage: PipelineStage = {
      name: 'Deploy Stage',
      jobs: [{ name: 'Deploy', steps: [{ name: 'Release', command: 'npm publish' }] }],
      needs: ['build', 'test'],
    };

    expect(stage.needs).toEqual(['build', 'test']);
  });

  it('should create stage with condition', () => {
    const stage: PipelineStage = {
      name: 'Production',
      jobs: [{ name: 'Prod Deploy', steps: [{ name: 'Deploy', command: 'kubectl apply' }] }],
      condition: 'github.ref == "refs/heads/main"',
    };

    expect(stage.condition).toBeDefined();
  });
});

describe('CacheConfig', () => {
  it('should create cache with paths and key', () => {
    const cache: CacheConfig = {
      paths: ['node_modules', '.next'],
      key: 'deps-${{ hashFiles("**/package-lock.json") }}',
    };

    expect(cache.paths).toHaveLength(2);
    expect(cache.key).toMatch(/^deps-/);
  });

  it('should create simple cache', () => {
    const cache: CacheConfig = {
      paths: ['target'],
      key: 'rust-cache',
    };

    expect(cache.paths).toContain('target');
  });
});

describe('NotificationConfig', () => {
  it('should have all notification types', () => {
    const types: NotificationConfig['type'][] = ['slack', 'email', 'webhook', 'github'];
    expect(types).toHaveLength(4);
  });

  it('should create slack notification', () => {
    const notif: NotificationConfig = {
      type: 'slack',
      target: '#ci-notifications',
      events: ['failure', 'always'],
    };

    expect(notif.type).toBe('slack');
    expect(notif.target).toContain('#');
  });

  it('should create email notification', () => {
    const notif: NotificationConfig = {
      type: 'email',
      target: 'dev@example.com',
      events: ['success', 'failure'],
    };

    expect(notif.type).toBe('email');
    expect(notif.target).toContain('@');
  });

  it('should create webhook notification', () => {
    const notif: NotificationConfig = {
      type: 'webhook',
      target: 'https://hooks.example.com/ci',
      events: ['start', 'success', 'failure'],
    };

    expect(notif.type).toBe('webhook');
    expect(notif.target).toMatch(/^https?:/);
  });

  it('should support all event types', () => {
    const events: NonNullable<NotificationConfig['events']> = ['start', 'success', 'failure', 'always'];
    expect(events).toHaveLength(4);
  });
});

describe('PipelineConfig', () => {
  it('should create complete pipeline config', () => {
    const config: PipelineConfig = {
      provider: 'github',
      name: 'CI Pipeline',
      triggers: [{ type: 'push', branches: ['main'] }],
      stages: [
        {
          name: 'Build',
          jobs: [{ name: 'Build', steps: [{ name: 'Build', command: 'npm run build' }] }],
        },
      ],
      environment: { NODE_ENV: 'production' },
      secrets: ['API_KEY'],
      notifications: [{ type: 'slack', target: '#ci', events: ['failure'] }],
    };

    expect(config.provider).toBe('github');
    expect(config.triggers).toHaveLength(1);
    expect(config.stages).toHaveLength(1);
  });

  it('should support all providers', () => {
    const providers: CIProvider[] = ['github', 'gitlab', 'jenkins', 'azure', 'circleci', 'travis'];
    
    providers.forEach(provider => {
      const config: PipelineConfig = {
        provider,
        name: `${provider} Pipeline`,
        triggers: [{ type: 'push' }],
        stages: [{ name: 'Default', jobs: [{ name: 'Job', steps: [{ name: 'Step', command: 'echo' }] }] }],
        environment: {},
        secrets: [],
        notifications: [],
      };
      expect(config.provider).toBe(provider);
    });
  });

  it('should handle multiple environments', () => {
    const config: PipelineConfig = {
      provider: 'gitlab',
      name: 'Multi-env Pipeline',
      triggers: [{ type: 'push' }],
      stages: [{ name: 'Test', jobs: [{ name: 'Test', steps: [{ name: 'Test', command: 'npm test' }] }] }],
      environment: {
        ENV: 'production',
        REGION: 'us-west-2',
        NODE_VERSION: '20',
      },
      secrets: [],
      notifications: [],
    };

    expect(Object.keys(config.environment)).toHaveLength(3);
  });

  it('should handle multiple notifications', () => {
    const config: PipelineConfig = {
      provider: 'circleci',
      name: 'Notified Pipeline',
      triggers: [{ type: 'push' }],
      stages: [{ name: 'Test', jobs: [{ name: 'Test', steps: [{ name: 'Test', command: 'npm test' }] }] }],
      environment: {},
      secrets: [],
      notifications: [
        { type: 'slack', target: '#ci', events: ['failure'] },
        { type: 'email', target: 'team@example.com', events: ['success', 'failure'] },
      ],
    };

    expect(config.notifications).toHaveLength(2);
  });
});

describe('GitHubActionsConfig', () => {
  it('should extend PipelineConfig', () => {
    const githubConfig: GitHubActionsConfig = {
      provider: 'github',
      name: 'GitHub Actions Pipeline',
      triggers: [{ type: 'push', branches: ['main'] }],
      stages: [{ name: 'Build', jobs: [{ name: 'Build', steps: [{ name: 'Build', command: 'npm run build' }] }] }],
      environment: {},
      secrets: [],
      notifications: [],
      workflowFile: 'ci.yml',
      permissions: {
        contents: 'write',
        actions: 'read',
      },
    };

    expect(githubConfig.provider).toBe('github');
    expect(githubConfig.workflowFile).toBe('ci.yml');
    expect(githubConfig.permissions?.contents).toBe('write');
  });

  it('should include permissions', () => {
    const permissions: GitHubPermissions = {
      contents: 'write',
      issues: 'write',
      pullRequests: 'write',
      actions: 'read',
    };

    expect(permissions.contents).toBe('write');
    expect(permissions.actions).toBe('read');
  });

  it('should include concurrency settings', () => {
    const concurrency: GitHubConcurrency = {
      group: '${{ github.workflow }}-${{ github.ref }}',
      cancelInProgress: true,
    };

    expect(concurrency.group).toBe('${{ github.workflow }}-${{ github.ref }}');
    expect(concurrency.cancelInProgress).toBe(true);
  });

  it('should create config with concurrency', () => {
    const config: GitHubActionsConfig = {
      provider: 'github',
      name: 'Concurrency Pipeline',
      triggers: [{ type: 'pr' }],
      stages: [{ name: 'Test', jobs: [{ name: 'Test', steps: [{ name: 'Test', command: 'npm test' }] }] }],
      environment: {},
      secrets: [],
      notifications: [],
      workflowFile: 'test.yml',
      permissions: { contents: 'read' },
      concurrency: {
        group: 'tests',
        cancelInProgress: true,
      },
    };

    expect(config.concurrency?.cancelInProgress).toBe(true);
  });
});

describe('Validation Interfaces', () => {
  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error: ValidationError = {
        field: 'triggers',
        message: 'At least one trigger is required',
        code: 'MISSING_TRIGGERS',
      };

      expect(error.field).toBe('triggers');
      expect(error.code).toBe('MISSING_TRIGGERS');
    });

    it('should handle any field name', () => {
      const error: ValidationError = {
        field: 'environment.API_KEY',
        message: 'API_KEY is required',
        code: 'MISSING_ENV_VAR',
      };

      expect(error.field).toContain('.');
    });
  });

  describe('ValidationWarning', () => {
    it('should create warning with suggestion', () => {
      const warning: ValidationWarning = {
        field: 'cache',
        message: 'Cache key may not be optimal',
        suggestion: 'Use hashFiles() for dynamic cache keys',
      };

      expect(warning.field).toBe('cache');
      expect(warning.suggestion).toBeDefined();
    });

    it('should create warning without suggestion', () => {
      const warning: ValidationWarning = {
        field: 'timeout',
        message: 'Timeout is very long',
      };

      expect(warning.suggestion).toBeUndefined();
    });
  });

  describe('ValidationResult', () => {
    it('should create valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should create invalid result with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          { field: 'triggers', message: 'No triggers', code: 'NO_TRIGGERS' },
          { field: 'stages', message: 'No stages', code: 'NO_STAGES' },
        ],
        warnings: [
          { field: 'env', message: 'Check environment' },
        ],
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
    });

    it('should create result with only warnings', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [
          {
            field: 'secrets',
            message: 'Consider using secret scanning',
            suggestion: 'Enable secret scanning in repository settings',
          },
        ],
      };

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });
  });
});

describe('PipelineStatus', () => {
  it('should have required fields', () => {
    const status: PipelineStatus = {
      id: 'workflow-123',
      status: 'running',
      stage: 'Build',
      job: 'Compile',
      startedAt: new Date('2024-01-01T00:00:00Z'),
    };

    expect(status.id).toBe('workflow-123');
    expect(status.status).toBe('running');
  });

  it('should be extensible for additional fields', () => {
    const status: PipelineStatus = {
      id: 'workflow-456',
      status: 'success',
      stage: 'Test',
      job: 'UnitTests',
      startedAt: new Date('2024-01-01T00:00:00Z'),
      finishedAt: new Date('2024-01-01T00:05:00Z'),
      duration: 300,
    };

    expect(status.duration).toBe(300);
  });
});

describe('Complex Pipeline Configurations', () => {
  it('should handle multi-stage pipeline', () => {
    const config: PipelineConfig = {
      provider: 'github',
      name: 'Multi-stage Pipeline',
      triggers: [{ type: 'push', branches: ['main', 'develop'] }],
      stages: [
        {
          name: 'Lint & Unit Tests',
          parallel: true,
          jobs: [
            { name: 'Lint', steps: [{ name: 'Lint', command: 'npm run lint' }] },
            { name: 'Unit', steps: [{ name: 'Test', command: 'npm run test:unit' }] },
          ],
        },
        {
          name: 'Build',
          jobs: [
            { name: 'Build', steps: [{ name: 'Build', command: 'npm run build' }] },
          ],
          needs: ['Lint & Unit Tests'],
        },
        {
          name: 'E2E Tests',
          jobs: [{ name: 'E2E', steps: [{ name: 'Test', command: 'npm run test:e2e' }] }],
          needs: ['Build'],
        },
      ],
      environment: { NODE_ENV: 'test' },
      secrets: ['TEST_TOKEN'],
      notifications: [{ type: 'slack', target: '#ci', events: ['failure'] }],
    };

    expect(config.stages).toHaveLength(3);
    expect(config.stages[2].needs).toContain('Build');
  });

  it('should handle pipeline with all notification events', () => {
    const config: PipelineConfig = {
      provider: 'travis',
      name: 'Full Notification Pipeline',
      triggers: [{ type: 'push', branches: ['main'] }],
      stages: [{ name: 'Test', jobs: [{ name: 'Test', steps: [{ name: 'Test', command: 'npm test' }] }] }],
      environment: {},
      secrets: [],
      notifications: [
        { type: 'email', target: 'team@example.com', events: ['start', 'success', 'failure', 'always'] },
      ],
    };

    expect(config.notifications[0].events).toHaveLength(4);
  });

  it('should handle pipeline with complex cache configuration', () => {
    const config: PipelineConfig = {
      provider: 'jenkins',
      name: 'Cached Pipeline',
      triggers: [{ type: 'push' }],
      stages: [
        {
          name: 'Build',
          jobs: [
            {
              name: 'Build with Cache',
              steps: [{ name: 'Build', command: 'make' }],
              cache: {
                paths: ['target', 'cache/ivy2'],
                key: 'build-${{ hashFiles("build.sbt") }}',
              },
            },
          ],
        },
      ],
      environment: {},
      secrets: [],
      notifications: [],
    };

    expect(config.stages[0].jobs[0].cache?.paths).toHaveLength(2);
  });
});

describe('GitHub Specific Features', () => {
  it('should handle all permission types', () => {
    const permissionValues: GitHubPermissions[keyof GitHubPermissions][] = ['read', 'write'];
    expect(permissionValues).toHaveLength(2);
  });

  it('should create complete GitHub workflow', () => {
    const workflow: GitHubActionsConfig = {
      provider: 'github',
      name: 'Complete Workflow',
      triggers: [
        { type: 'push', branches: ['main', 'release/*'] },
        { type: 'pr', branches: ['main'] },
      ],
      stages: [
        {
          name: 'CI',
          jobs: [
            {
              name: 'Test',
              steps: [
                { name: 'Checkout', command: 'actions/checkout@v4' },
                { name: 'Setup', command: 'actions/setup-node@v4' },
                { name: 'Test', command: 'npm test' },
              ],
              cache: { paths: ['node_modules'], key: 'npm' },
            },
          ],
        },
      ],
      environment: { NODE_VERSION: '20' },
      secrets: ['NPM_TOKEN', 'GITHUB_TOKEN'],
      notifications: [{ type: 'github', target: '', events: ['failure'] }],
      workflowFile: '.github/workflows/ci.yml',
      permissions: {
        contents: 'read',
        actions: 'write',
        issues: 'read',
        pullRequests: 'write',
      },
      concurrency: {
        group: '${{ github.workflow }}',
        cancelInProgress: true,
      },
      env: {
        NODE_ENV: 'production',
        CI: 'true',
      },
    };

    expect(workflow.permissions?.pullRequests).toBe('write');
    expect(workflow.env?.CI).toBe('true');
  });
});
