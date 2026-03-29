import { getLogger } from '../../../utils/logger';
/**
 * 内置模板集合
 */

import { CodeTemplate } from '../../types';
import { reactFunctionalTemplate, reactHookTemplate } from './react';
const logger = getLogger('codegen/templates/built-in/index');


export const builtInTemplates: Record<string, CodeTemplate> = {
  'react-functional': reactFunctionalTemplate,
  'react-hook': reactHookTemplate,
  // 其他模板可以在这里添加
};

export * from './react';
