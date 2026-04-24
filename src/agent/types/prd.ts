import { getLogger } from '../../utils/logger';
const logger = getLogger('agent/types/prd');

/**
 * PRD 相关类型
 */

/**
 * PRD 文档
 */
export interface PRDDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  requirements: Requirement[];
  acceptanceCriteria: string[];
  metadata: PRDMetadata;
  version?: string;
  filePath?: string;
  sections?: PRDSection[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * PRD 章节
 */
export interface PRDSection {
  title: string;
  content: string;
  order?: number;
  level?: 'h1' | 'h2' | 'h3' | 'h4';
}

/**
 * 需求
 */
export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'functional' | 'non-functional';
}

/**
 * PRD 元数据
 */
export interface PRDMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
}

/**
 * 需求分析
 */
export interface RequirementAnalysis {
  features: Feature[];
  technicalConstraints: string[];
  risks: Risk[];
  complexity?: 'low' | 'medium' | 'high';
}

/**
 * 功能特性
 */
export interface Feature {
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
}

/**
 * 风险
 */
export interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}
