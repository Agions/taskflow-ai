/**
 * 项目相关类型
 */

import { PRDDocument, Priority, Complexity } from './prd';
import { Task } from './task';

/**
 * 项目
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  prdDocument?: PRDDocument;
  tasks: Task[];
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  team: TeamMember[];
  metadata: ProjectMetadata;
}

/**
 * 项目状态
 */
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

/**
 * 团队成员
 */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  skills: string[];
}

/**
 * 项目元数据
 */
export interface ProjectMetadata {
  createdBy: string;
  methodology: 'agile' | 'waterfall' | 'lean';
  sprintDuration?: number;
  currentSprint?: number;
  repository?: string;
  deploymentUrl?: string;
}
