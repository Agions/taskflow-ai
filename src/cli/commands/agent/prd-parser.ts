/**
 * PRD 解析器
 */

import { PRDDocument } from '../../../agent/types';

export function parsePRD(content: string, filePath: string): PRDDocument {
  const lines = content.split('\n');
  let title = 'Untitled PRD';
  let description = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('## ')) {
      description = trimmed.slice(3).trim();
      break;
    }
  }

  return {
    id: filePath,
    title,
    description,
    content,
    requirements: [],
    acceptanceCriteria: [],
    metadata: {
      author: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      tags: [],
    },
  };
}
