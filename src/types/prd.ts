/**
 * PRD 文档相关类型
 */

/**
 * PRD 文档
 */
export interface PRDDocument {
  id: string;
  title: string;
  version: string;
  filePath: string;
  content: string;
  metadata: PRDMetadata;
  sections: PRDSection[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PRD 元数据
 */
export interface PRDMetadata {
  author: string;
  createDate: Date;
  lastModified: Date;
  tags: string[];
  priority: Priority;
  complexity: Complexity;
  estimatedHours: number;
}

/**
 * PRD 章节
 */
export interface PRDSection {
  id: string;
  title: string;
  type: SectionType;
  content: string;
  requirements: Requirement[];
  dependencies: string[];
  order: number;
}

/**
 * 章节类型
 */
export type SectionType =
  | 'overview'
  | 'requirements'
  | 'functional'
  | 'non-functional'
  | 'technical'
  | 'ui-ux'
  | 'acceptance';

/**
 * 需求
 */
export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: Priority;
  complexity: Complexity;
  estimatedHours: number;
  tags: string[];
  acceptance: AcceptanceCriteria[];
}

/**
 * 需求类型
 */
export type RequirementType = 'functional' | 'non-functional' | 'technical' | 'ui-ux';

/**
 * 优先级
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 复杂度
 */
export type Complexity = 'simple' | 'medium' | 'complex' | 'epic';

/**
 * 验收标准
 */
export interface AcceptanceCriteria {
  id: string;
  description: string;
  type: 'given-when-then' | 'checklist' | 'scenario';
  testable: boolean;
}
