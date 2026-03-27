/**
 * 内置模板集合
 */

import { CodeTemplate } from '../../types';
import { reactFunctionalTemplate, reactHookTemplate } from './react';

export const builtInTemplates: Record<string, CodeTemplate> = {
  'react-functional': reactFunctionalTemplate,
  'react-hook': reactHookTemplate,
  // 其他模板可以在这里添加
};

export * from './react';
