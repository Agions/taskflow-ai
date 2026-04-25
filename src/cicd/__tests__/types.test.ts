/**
 * CI/CD Types Tests
 * TaskFlow AI v4.0
 */

import type {
  CIProvider,
  PipelineConfig,
  PipelineTrigger,
  PipelineStage,
  PipelineJob,
  PipelineStep
} from '../types';

describe('CI/CD Types', () => {
  describe('CIProvider', () => {
    it('should support github provider', () => {
      const provider: CIProvider = 'github';
      expect(provider).toBe('github');
    });

    it('should support gitlab provider', () => {
      const provider: CIProvider = 'gitlab';
      expect(provider).toBe('gitlab');
    });

    it('should support jenkins provider', () => {
      const provider: CIProvider = 'jenkins';
      expect(provider).toBe('jenkins');
    });
  });

  describe('PipelineTrigger', () => {
    it('should create push trigger', () => {
      const trigger: PipelineTrigger = {
        type: 'push',
        branches: ['main', 'develop']
      };
      expect(trigger.type).toBe('push');
      expect(trigger.branches).toContain('main');
    });

    it('should create pull request trigger', () => {
      const trigger: PipelineTrigger = {
        type: 'pr'
      };
      expect(trigger.type).toBe('pr');
    });

    it('should create schedule trigger', () => {
      const trigger: PipelineTrigger = {
        type: 'schedule',
        cron: '0 0 * * *'
      };
      expect(trigger.type).toBe('schedule');
      expect(trigger.cron).toBeDefined();
    });
  });

  describe('PipelineStep', () => {
    it('should create basic step', () => {
      const step: PipelineStep = {
        name: 'Install dependencies',
        command: 'npm install'
      };
      expect(step.name).toBe('Install dependencies');
      expect(step.command).toBe('npm install');
    });

    it('should create step with working directory', () => {
      const step: PipelineStep = {
        name: 'Build',
        command: 'npm run build',
        workingDirectory: './frontend'
      };
      expect(step.workingDirectory).toBe('./frontend');
    });

    it('should create step that continues on error', () => {
      const step: PipelineStep = {
        name: 'Cleanup',
        command: 'rm -rf .*',
        continueOnError: true
      };
      expect(step.continueOnError).toBe(true);
    });
  });

  describe('PipelineJob', () => {
    it('should create job with steps', () => {
      const steps: PipelineStep[] = [
        { name: 'Setup', command: 'node -v' },
        { name: 'Install', command: 'npm ci' },
        { name: 'Test', command: 'npm test' }
      ];

      const job: PipelineJob = {
        name: 'test-job',
        steps
      };

      expect(job.name).toBe('test-job');
      expect(job.steps).toHaveLength(3);
    });

    it('should create job with runner specification', () => {
      const job: PipelineJob = {
        name: 'build-job',
        steps: [{ name: 'Build', command: 'npm run build' }],
        runner: 'ubuntu-latest',
        timeout: 3600
      };

      expect(job.runner).toBe('ubuntu-latest');
      expect(job.timeout).toBe(3600);
    });
  });

  describe('PipelineStage', () => {
    it('should create sequential stage', () => {
      const stage: PipelineStage = {
        name: 'test',
        jobs: [
          {
            name: 'unit-tests',
            steps: [{ name: 'Run tests', command: 'npm test' }]
          }
        ]
      };

      expect(stage.name).toBe('test');
      expect(stage.parallel).toBeUndefined();
    });

    it('should create parallel stage', () => {
      const stage: PipelineStage = {
        name: 'test-parallel',
        parallel: true,
        jobs: [
          {
            name: 'unit-tests',
            steps: [{ name: 'Run unit tests', command: 'npm test:unit' }]
          },
          {
            name: 'integration-tests',
            steps: [{ name: 'Run integration tests', command: 'npm test:integration' }]
          }
        ]
      };

      expect(stage.parallel).toBe(true);
      expect(stage.jobs).toHaveLength(2);
    });

    it('should create stage with dependencies', () => {
      const stage: PipelineStage = {
        name: 'deploy',
        jobs: [
          {
            name: 'deploy-to-staging',
            steps: [{ name: 'Deploy', command: 'npm run deploy:staging' }]
          }
        ],
        needs: ['build', 'test']
      };

      expect(stage.needs).toContain('build');
      expect(stage.needs).toContain('test');
    });
  });

  describe('PipelineConfig', () => {
    it('should create complete pipeline configuration', () => {
      const config: PipelineConfig = {
        provider: 'github',
        name: 'my-pipeline',
        triggers: [
          { type: 'push', branches: ['main'] },
          { type: 'pr' }
        ],
        stages: [
          {
            name: 'test',
            jobs: [
              {
                name: 'test-job',
                steps: [{ name: 'Test', command: 'npm test' }]
              }
            ]
          }
        ],
        environment: {
          NODE_VERSION: '18'
        },
        secrets: ['API_KEY', 'DB_PASSWORD'],
        notifications: []
      };

      expect(config.provider).toBe('github');
      expect(config.triggers).toHaveLength(2);
      expect(config.stages).toHaveLength(1);
      expect(config.environment.NODE_VERSION).toBe('18');
      expect(config.secrets).toContain('API_KEY');
    });
  });
});
