/**
 * 统一类型系统索引
 * TaskFlow AI v4.0 - All type definitions in one place
 */

// Task types
export * from './task';

// Workflow types
export * from './workflow';

// Tool types
export * from './tool';

// Plugin types
export * from './plugin';

// Event types
export * from './event';

// Message types
export * from './message';

// Config types
export * from './config';

// Extensions types - 使用plugin.ts中的ExtensionType，避免冲突
export type { ExtensionDefinition, ExtensionRegistry, ExtensionLifecycle, ExtensionLoader, ExtensionContext, ExtensionLogger, ExtensionAPI } from './extensions';
export { ExtensionStatus } from './extensions';

// Cache types
// Cache types exported via config

// Re-export PRD types from prd.ts to resolve compatibility issues
export type { PRDDocument, PRDSection, PRDMetadata, SectionType, Requirement, RequirementType, Priority, Complexity, AcceptanceCriteria } from './prd';

// Error types
export interface TaskFlowError extends Error {
  type: string;
  code?: number;
  context?: Record<string, unknown>;
}

export type ErrorType = 'validation' | 'runtime' | 'config' | 'network';
