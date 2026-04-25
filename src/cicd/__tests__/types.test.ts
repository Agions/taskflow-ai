/**
 * CI/CD Types Tests - TaskFlow AI v4.0
 */

import type {
  CIProvider, PipelineConfig, PipelineTrigger, PipelineStage,
  PipelineJob, PipelineStep, CacheConfig, NotificationConfig,
  GitHubActionsConfig, GitHubPermissions, GitHubConcurrency,
  ValidationResult, ValidationError, ValidationWarning, PipelineStatus,
  TaskSyncConfig, TaskFieldMapping, PRReviewConfig, DeployConfig,
  DeployEnvironment, DeployStrategy, DeployStep, HealthCheckConfig,
  CIIntegrationConfig,
} from '../types';

const ALL_CI_PROVIDERS: CIProvider[] = ['github','gitlab','jenkins','azure','circleci','travis'];
const ALL_TRIGGER_TYPES: PipelineTrigger['type'][] = ['push','pr','schedule','manual','webhook'];
const ALL_NOTIFY_TYPES: NotificationConfig['type'][] = ['slack','email','webhook','github'];
const ALL_DEPLOY_TYPES: DeployStrategy['type'][] = ['rolling','blue-green','canary'];
const ALL_SYNC_PROVIDERS: TaskSyncConfig['provider'][] = ['jira','linear','asana','trello','github'];

describe('CI/CD Types', () => {
  describe('CIProvider', () => {
    it('should support 6 providers', () => {
      expect(ALL_CI_PROVIDERS).toHaveLength(6);
    });
  });

  describe('PipelineConfig', () => {
    it('should create valid config', () => {
      const c: PipelineConfig = {
        provider: 'github', name: 'ci-pipeline',
        triggers: [{ type: 'push' }],
        stages: [{ name: 'test', jobs: [] }],
        environment: { NODE_ENV: 'test' },
        secrets: ['GITHUB_TOKEN'],
        notifications: [],
      };
      expect(c.provider).toBe('github');
    });
  });

  describe('PipelineTrigger', () => {
    it('should support 5 types', () => {
      expect(ALL_TRIGGER_TYPES).toHaveLength(5);
    });

    it('should have optional fields', () => {
      const t: PipelineTrigger = {
        type: 'push', branches: ['main'], paths: ['src/**'], cron: '0 0 * * *',
      };
      expect(t.branches).toHaveLength(1);
    });
  });

  describe('PipelineStage', () => {
    it('should create stage with optional parallel/needs', () => {
      const s: PipelineStage = {
        name: 'build', jobs: [], parallel: true, needs: ['test'],
        condition: 'success()',
      };
      expect(s.parallel).toBe(true);
    });
  });

  describe('PipelineJob', () => {
    it('should create job with steps', () => {
      const j: PipelineJob = {
        name: 'lint', steps: [{ name: 'run', command: 'npm run lint' }],
        runner: 'ubuntu-latest', timeout: 600, artifacts: ['dist/**'], cache: { key: 'npm', paths: ['node_modules'] },
      };
      expect(j.runner).toBe('ubuntu-latest');
    });
  });

  describe('NotificationConfig', () => {
    it('should support 4 types', () => {
      expect(ALL_NOTIFY_TYPES).toHaveLength(4);
    });
  });

  describe('GitHubActionsConfig', () => {
    it('should extend PipelineConfig', () => {
      const c: GitHubActionsConfig = {
        provider: 'github', name: 'gh-pipeline',
        triggers: [], stages: [],
        environment: {}, secrets: [], notifications: [],
        workflowFile: '.github/workflows/ci.yml',
        permissions: { contents: 'write', pullRequests: 'write' },
      };
      expect(c.permissions?.contents).toBe('write');
    });
  });

  describe('GitHubPermissions', () => {
    it('should support readable value', () => {
      const p: GitHubPermissions = { contents: 'read', issues: 'write', pullRequests: 'read' };
      expect(p.contents).toBe('read');
    });
  });

  describe('ValidationResult', () => {
    it('should create valid and invalid results', () => {
      const valid: ValidationResult = { valid: true, errors: [], warnings: [] };
      const invalid: ValidationResult = { valid: false, errors: [{ field: 'name', message: 'Required', code: 'REQUIRED' }], warnings: [] };
      expect(invalid.errors).toHaveLength(1);
    });
  });

  describe('PipelineStatus', () => {
    it('should support 6 statuses', () => {
      const s: PipelineStatus['status'][] = ['pending','running','success','failure','cancelled','skipped'];
      expect(s).toHaveLength(6);
    });
  });

  describe('TaskSyncConfig', () => {
    it('should support 5 providers', () => {
      expect(ALL_SYNC_PROVIDERS).toHaveLength(5);
    });

    it('should create sync config', () => {
      const c: TaskSyncConfig = {
        enabled: true, provider: 'jira', projectKey: 'TF',
        mappings: [], bidirectional: true, autoCreate: true, autoClose: false,
      };
      expect(c.projectKey).toBe('TF');
    });
  });

  describe('DeployStrategy', () => {
    it('should support 3 types', () => {
      expect(ALL_DEPLOY_TYPES).toHaveLength(3);
    });
  });

  describe('HealthCheckConfig', () => {
    it('should create health check', () => {
      const h: HealthCheckConfig = { endpoint: '/health', interval: 30, timeout: 5, retries: 3 };
      expect(h.interval).toBe(30);
    });
  });

  describe('CIIntegrationConfig', () => {
    it('should create full config with optional sections', () => {
      const c: CIIntegrationConfig = {
        provider: 'github', repository: 'taskflow-ai/taskflow', branch: 'main', token: 'ghp_xxx',
        pipeline: { provider: 'github', name: '', triggers: [], stages: [], environment: {}, secrets: [], notifications: [] },
        taskSync: { enabled: false, provider: 'github', projectKey: '', mappings: [], bidirectional: false, autoCreate: false, autoClose: false },
        prReview: { enabled: true, autoReview: false, reviewers: ['Agions'], requiredChecks: ['test'], aiReview: true },
      };
      expect(c.prReview?.aiReview).toBe(true);
    });
  });
});

describe('CI/CD Modules', () => {
  it('GitHubApiClient should be importable', async () => {
    const mod = await import('../github/api-client');
    expect(mod.GitHubApiClient).toBeDefined();
  });

  it('GitHubWorkflowGenerator should be importable', async () => {
    const mod = await import('../github/workflow-generator');
    expect(mod.GitHubWorkflowGenerator).toBeDefined();
  });

  it('GitHubConfigValidator should be importable', async () => {
    const mod = await import('../github/validator');
    expect(mod.GitHubConfigValidator).toBeDefined();
  });

  it('GitHubActionsIntegration should be importable', async () => {
    const mod = await import('../github');
    expect(mod.GitHubActionsIntegration).toBeDefined();
  });
});
