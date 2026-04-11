import { getLogger } from '../../utils/logger';
/**
 * 状态机定义
 */

import { createMachine, fromPromise } from 'xstate';
import { MachineContext } from './types';
import { PlanningEngine } from '../planning';
import { ExecutionEngine } from '../execution';
import { VerificationEngine } from '../verification/engine';
import { AgentConfig } from '../types';
const logger = getLogger('agent/state-machine/machine');

export const createAgentMachine = (
  context: MachineContext,
  agentConfig: AgentConfig,
  planningEngine: PlanningEngine,
  executionEngine: ExecutionEngine,
  verificationEngine: VerificationEngine
) => {
  return createMachine({
    id: 'taskflow-agent',
    initial: 'idle',
    context,
    states: {
      idle: {
        on: { START: 'planning' },
      },

      planning: {
        invoke: {
          src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
            return planningEngine.createPlan(
              input.context.requirements?.map(r => r.description).join('\n') || ''
            );
          }),
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: { target: 'executing', actions: { type: 'setTaskPlan' } },
          onError: { target: 'failed', actions: { type: 'setError' } },
        },
      },

      executing: {
        invoke: {
          src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
            return executionEngine.execute(input.context.currentPlan!);
          }),
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: { target: 'verifying', actions: { type: 'setExecutionResult' } },
          onError: { target: 'failed', actions: { type: 'setError' } },
        },
      },

      verifying: {
        invoke: {
          src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
            return verificationEngine.verify(input.context.executionResult!);
          }),
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: [
            {
              target: 'completed',
              guard: ({ context }: { context: MachineContext }) =>
                context.verificationResult?.allPassed === true,
            },
            {
              target: 'awaitingApproval',
              guard: ({ context }: { context: MachineContext }) =>
                (context.retryCount ?? 0) >= (agentConfig.maxRetries ?? 3) &&
                context.verificationResult?.allPassed !== true,
            },
            {
              target: 'planning',
              guard: ({ context }: { context: MachineContext }) =>
                (context.retryCount ?? 0) < (agentConfig.maxRetries ?? 3),
            },
          ],
          onError: { target: 'failed', actions: { type: 'setError' } },
        },
      },

      /** 人工审批状态 — 验证重试耗尽后进入，等待人工确认后继续执行 */
      awaitingApproval: {
        on: {
          APPROVED: 'executing',
          REJECTED: 'failed',
        },
      },

      completed: {
        type: 'final',
      },

      failed: {
        type: 'final',
      },
    },
  });
};
