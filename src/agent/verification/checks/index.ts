import { getLogger } from '../../../utils/logger';
/**
 * 验证检查集合
 */

export { verifyTaskCompletion } from './task-completion';
export { verifyGeneratedFiles } from './generated-files';
const logger = getLogger('agent/verification/checks/index');

