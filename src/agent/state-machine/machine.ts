/**
 * 状态机定义
 */

import { createMachine, fromPromise } from 'xstate';
import { MachineContext, MachineEvent } from './types';
import { PlanningEngine } from '../planning/engine';
import { ExecutionEngine } from '../execution/engine';
import { VerificationEngine } from '../verification/engine';
import { AgentConfig } from '../types';

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
        on: { START: 'planning' }
      },

      planning: {
        invoke: {
          src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
            return planningEngine.createPlan(input.context.requirements);
          }),
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: { target: 'executing', actions: { type: 'setTaskPlan' } },
          onError: { target: 'failed', actions: { type: 'setError' } }
        }
      },

      executing: {
        invoke: {
          src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
            return executionEngine.execute(input.context.currentPlan!);
          }),
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: { target: 'verifying', actions: { type: 'setExecutionResult' } },
          onError: { target: 'failed', actions: { type: 'setError' } }
        }
      },

      verifying: {
        invoke: {
          src: fromPromise(async ({ input }: { input: { context: MachineContext } }) => {
            return verificationEngine.verify(input.context.executionResult!);
          }),
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: [
            { target: 'completed', guard: ({ context }: any) => context.verificationResult?.allPassed },
            { target: 'planning', guard: ({ context }: any) => context.retryCount < agentConfig.maxRetries }
          ],
          onError: { target: 'failed', actions: { type: 'setError' } }
        }
      },

      awaitingApproval: {
        on: {
          APPROVED: 'executing',
          REJECTED: 'failed'
        }
      },

      completed: {
        type: 'final'
      },

      failed: {
        type: 'final'
      }
    }
  });
};
