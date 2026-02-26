/**
 * 思维链模块导出
 */

export * from './types';
export * from './chain';
export * from './renderer';

import { ThoughtChainManager } from './chain';
import { createRenderer } from './renderer';

export function createThoughtChainManager() {
  return new ThoughtChainManager();
}
