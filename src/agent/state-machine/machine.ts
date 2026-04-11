import { getLogger } from '../../utils/logger';
/**
 * 状态机定义
 */

import { createMachine, fromPromise, assign } from 'xstate';
import { MachineContext } from './types';
import { PlanningEngine } from '../planning';
import { ExecutionEngine } from '../execution';
import { VerificationEngine } from '../verification/engine';
import { AgentConfig } from '../types';
import type { TaskPlan } from '../types';
import type { ExecutionResult } from '../types';
import type { VerificationResult } from '../types';
const logger = getLogger('agent/state-machine/machine');

export const createAgentMachine = (
  context: MachineContext,
  agentConfig: AgentConfig,
  planningEngine: PlanningEngine,
  executionEngine: ExecutionEngine,
  verificationEngine: VerificationEngine
) => {
  return createMachine(
    {
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
            onDone: {
              target: 'executing',
              actions: { type: 'setTaskPlan' },
            },
            onError: {
              target: 'failed',
              actions: { type: 'setError' },
            },
          },
        },

        executing: {
          invoke: {
            src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
              return executionEngine.execute(input.context.currentPlan!);
            }),
            input: ({ context }: { context: MachineContext }) => ({ context }),
            onDone: {
              target: 'verifying',
              actions: { type: 'setExecutionResult' },
            },
            onError: {
              target: 'failed',
              actions: { type: 'setError' },
            },
          },
        },

        verifying: {
          invoke: {
            src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
              return verificationEngine.verify(input.context.executionResult!);
            }),
            input: ({ context }: { context: MachineContext }) => ({ context }),
            // 先把验证结果写入 context，再进 decision 节点评估
            onDone: {
              target: 'verificationDecision',
              actions: { type: 'setVerificationResult' },
            },
            onError: { target: 'failed', actions: { type: 'setError' } },
          },
        },

        /**
         * 中转决策节点 — verificationResult 已填充，可安全读取
         *
         *   allPassed=true  → completed
         *   allPassed=false + 重试耗尽 → awaitingApproval
         *   allPassed=false + 有重试机会 → planning（递增 retryCount）
         */
        verificationDecision: {
          always: [
            {
              target: 'completed',
              guard: ({ context }: { context: MachineContext }) =>
                context.verificationResult?.allPassed === true,
            },
            {
              target: 'awaitingApproval',
              guard: ({ context }: { context: MachineContext }) =>
                (context.retryCount ?? 0) >= (agentConfig.maxRetries ?? 3),
            },
            {
              target: 'planning',
              actions: { type: 'incrementRetry' },
            },
          ],
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
    },
    {
      actions: {
        /** 将 planning 的输出 (TaskPlan) 写入 context.currentPlan */
        setTaskPlan: assign({
          currentPlan: ({ event }) => (event as { output?: TaskPlan }).output,
        }),

        /** 将 executing 的输出 (ExecutionResult) 写入 context.executionResult */
        setExecutionResult: assign({
          executionResult: ({ event }) => (event as { output?: ExecutionResult }).output,
        }),

        /** 将验证结果写入 context.verificationResult */
        setVerificationResult: assign({
          verificationResult: ({ event }) => (event as { output?: VerificationResult }).output,
        }),

        /** 递增重试计数 */
        incrementRetry: assign({
          retryCount: ({ context }) => (context.retryCount ?? 0) + 1,
        }),

        /** 记录错误 */
        setError: assign({
          error: ({ event }) => (event as { error?: Error }).error,
        }),
      },
    }
  );
};
