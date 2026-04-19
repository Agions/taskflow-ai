/**
 * GitHub Actions 集成
 * CI/CD 流水线集成实现
 */

import {
  CIProvider,
  PipelineConfig,
  GitHubActionsConfig,
  ValidationResult,
  WorkflowTemplate,
  BuildReport,
} from '../types';
import { GitHubConfigValidator } from './validator';
import { GitHubWorkflowGenerator } from './workflow-generator';
import { GitHubApiClient } from './api-client';
import { GitHubFileManager } from './file-manager';

export * from './validator';
export * from './workflow-generator';
export * from './api-client';
export * from './file-manager';

export class GitHubActionsIntegration {
  private validator: GitHubConfigValidator;
  private generator: GitHubWorkflowGenerator;
  private apiClient: GitHubApiClient;
  private fileManager: GitHubFileManager;

  constructor(
    private token: string,
    private repository: string
  ) {
    this.validator = new GitHubConfigValidator();
    this.generator = new GitHubWorkflowGenerator();
    this.apiClient = new GitHubApiClient(token, repository);
    this.fileManager = new GitHubFileManager();
  }

  get name(): string {
    return 'github-actions';
  }

  async validateConfig(config: PipelineConfig): Promise<ValidationResult> {
    return this.validator.validate(config);
  }

  async generateWorkflow(config: GitHubActionsConfig): Promise<string> {
    return this.generator.generate(config);
  }

  async deployWorkflow(name: string, content: string): Promise<void> {
    await this.fileManager.writeWorkflow(name, content);
  }

  async triggerPipeline(
    workflowId: string,
    ref: string,
    inputs?: Record<string, string>
  ): Promise<void> {
    await this.apiClient.triggerWorkflow(workflowId, ref, inputs);
  }

  async getPipelineStatus(runId: string): Promise<BuildReport> {
    return this.apiClient.getBuildReport(runId);
  }

  async createPRComment(prNumber: number, comment: string): Promise<void> {
    await this.apiClient.createPRComment(prNumber, comment);
  }

  async setPRStatus(
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    context: string,
    description: string,
    targetUrl?: string
  ): Promise<void> {
    await this.apiClient.setPRStatus(sha, state, context, description, targetUrl);
  }

  async listSecrets(): Promise<string[]> {
    return this.apiClient.listSecrets();
  }

  async createOrUpdateSecret(name: string, value: string): Promise<void> {
    await this.apiClient.createOrUpdateSecret(name, value);
  }

  generateFromTemplate(template: WorkflowTemplate, variables: Record<string, string>): string {
    return this.generator.generateFromTemplate(template, variables);
  }
}
