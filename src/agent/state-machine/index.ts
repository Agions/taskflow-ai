/**
 * Agent 状态机核心
 * 使用 XState v5 实现完整的 Agent 生命周期管理
 */

import { createMachine, createActor, fromPromise } from 'xstate';
import {
  AgentContext,
  AgentState,
  TaskPlan,
  ExecutionResult,
  VerificationResult,
  AgentConfig
} from '../types';
import { PlanningEngine } from '../planning/engine';
import { ExecutionEngine } from '../execution/engine';
import { VerificationEngine } from '../verification/engine';

// 状态机上下文
interface MachineContext extends AgentContext {
  error?: Error;
  config: AgentConfig;
}

// 状态机事件类型
type MachineEvent =
  | { type: 'START' }
  | { type: 'PLAN_COMPLETE'; data: TaskPlan }
  | { type: 'PLAN_FAILED'; error: Error }
  | { type: 'EXECUTION_COMPLETE'; data: ExecutionResult }
  | { type: 'EXECUTION_FAILED'; error: Error }
  | { type: 'VERIFICATION_PASS'; data: VerificationResult }
  | { type: 'VERIFICATION_FAIL'; data: VerificationResult; fixTasks?: TaskPlan }
  | { type: 'APPROVED' }
  | { type: 'REJECTED' };

// 创建 Agent 状态机
export const createAgentMachine = (
  context: AgentContext,
  agentConfig: AgentConfig,
  planningEngine: PlanningEngine,
  executionEngine: ExecutionEngine,
  verificationEngine: VerificationEngine
) => {
  return createMachine({
    id: 'taskflow-agent',
    initial: 'idle',
    context: {
      ...context,
      config: agentConfig,
      error: undefined
    } as MachineContext,
    states: {
      idle: {
        on: {
          START: {
            target: 'planning',
            actions: [
              { type: 'logStart' },
              { type: 'recordStartTime' }
            ]
          }
        }
      },

      planning: {
        entry: [
          { type: 'logPlanning' },
          { type: 'setPlanningStatus' }
        ],
        invoke: {
          src: 'planTasks',
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: {
            target: 'executing',
            actions: [
              { type: 'setTaskPlan' },
              { type: 'logPlanComplete' }
            ]
          },
          onError: {
            target: 'failed',
            actions: [
              { type: 'setError' },
              { type: 'logPlanFailed' }
            ]
          }
        }
      },

      executing: {
        entry: [
          { type: 'logExecution' },
          { type: 'setExecutingStatus' }
        ],
        invoke: {
          src: 'executeTasks',
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: {
            target: 'verifying',
            actions: [
              { type: 'setExecutionResult' },
              { type: 'logExecutionComplete' }
            ]
          },
          onError: {
            target: 'failed',
            actions: [
              { type: 'setError' },
              { type: 'logExecutionFailed' }
            ]
          }
        }
      },

      verifying: {
        entry: [
          { type: 'logVerification' },
          { type: 'setVerifyingStatus' }
        ],
        invoke: {
          src: 'verifyResults',
          input: ({ context }: { context: MachineContext }) => ({ context }),
          onDone: [
            {
              target: 'completed',
              guard: 'allTasksVerified',
              actions: [
                { type: 'setVerificationResult' },
                { type: 'logVerificationPass' }
              ]
            },
            {
              target: 'planning',
              guard: 'canRetry',
              actions: [
                { type: 'createFixTasks' },
                { type: 'logVerificationFail' }
              ]
            },
            {
              target: 'failed',
              actions: [
                { type: 'setError' },
                { type: 'logVerificationFailed' }
              ]
            }
          ],
          onError: {
            target: 'failed',
            actions: [
              { type: 'setError' },
              { type: 'logVerificationError' }
            ]
          }
        }
      },

      awaitingApproval: {
        entry: [
          { type: 'logAwaitingApproval' },
          { type: 'setAwaitingApprovalStatus' }
        ],
        on: {
          APPROVED: {
            target: 'executing',
            actions: [{ type: 'logApproved' }]
          },
          REJECTED: {
            target: 'failed',
            actions: [{ type: 'logRejected' }]
          }
        }
      },

      completed: {
        type: 'final',
        entry: [
          { type: 'logCompleted' },
          { type: 'generateReport' },
          { type: 'recordEndTime' },
          { type: 'cleanup' }
        ]
      },

      failed: {
        type: 'final',
        entry: [
          { type: 'logFailed' },
          { type: 'recordEndTime' },
          { type: 'cleanup' }
        ]
      }
    }
  }, {
    actions: {
      // 日志动作
      logStart: ({ context }: { context: MachineContext }) => {
        console.log('🚀 Agent started');
        console.log(`📋 PRD: ${context.prd.title}`);
        console.log(`⚙️  Mode: ${context.config.mode}`);
      },

      logPlanning: () => {
        console.log('📋 Analyzing PRD and planning tasks...');
      },

      logPlanComplete: ({ event }: { event: any }) => {
        const plan = event.output as TaskPlan;
        console.log(`✅ Planning complete: ${plan.tasks.length} tasks`);
        console.log(`⏱️  Total estimate: ${plan.totalEstimate} hours`);
      },

      logPlanFailed: ({ event }: { event: any }) => {
        console.error('❌ Planning failed:', event.error?.message);
      },

      logExecution: () => {
        console.log('🔄 Executing tasks...');
      },

      logExecutionComplete: ({ event }: { event: any }) => {
        const result = event.output as ExecutionResult;
        console.log(`✅ Execution complete: ${result.summary.completedTasks}/${result.summary.totalTasks} tasks`);
      },

      logExecutionFailed: ({ event }: { event: any }) => {
        console.error('❌ Execution failed:', event.error?.message);
      },

      logVerification: () => {
        console.log('🔍 Verifying results...');
      },

      logVerificationPass: () => {
        console.log('✅ All verifications passed!');
      },

      logVerificationFail: ({ event }: { event: any }) => {
        const result = event.output as VerificationResult;
        const failedChecks = result.checks.filter(c => !c.passed);
        console.log(`⚠️ Verification failed: ${failedChecks.length} checks failed`);
        console.log('🔄 Creating fix tasks...');
      },

      logVerificationFailed: ({ event }: { event: any }) => {
        console.error('❌ Verification failed permanently');
      },

      logVerificationError: ({ event }: { event: any }) => {
        console.error('❌ Verification error:', event.error?.message);
      },

      logAwaitingApproval: ({ context }: { context: MachineContext }) => {
        console.log('⏸️  Awaiting user approval...');
        console.log('📋 Actions requiring approval:', context.config.approvalRequired);
      },

      logApproved: () => {
        console.log('✅ User approved, continuing...');
      },

      logRejected: () => {
        console.log('❌ User rejected, aborting...');
      },

      logCompleted: () => {
        console.log('🎉 Agent execution completed successfully!');
      },

      logFailed: ({ context }: { context: MachineContext }) => {
        console.error('💥 Agent execution failed');
        if (context.error) {
          console.error('Error:', context.error.message);
        }
      },

      // 状态设置
      setPlanningStatus: () => {
        // 更新状态
      },

      setExecutingStatus: () => {
        // 更新状态
      },

      setVerifyingStatus: () => {
        // 更新状态
      },

      setAwaitingApprovalStatus: () => {
        // 更新状态
      },

      // 数据设置
      setTaskPlan: ({ context, event }: { context: MachineContext; event: any }) => {
        context.taskPlan = event.output as TaskPlan;
      },

      setExecutionResult: ({ context, event }: { context: MachineContext; event: any }) => {
        context.executionResult = event.output as ExecutionResult;
      },

      setVerificationResult: ({ context, event }: { context: MachineContext; event: any }) => {
        context.verificationResult = event.output as VerificationResult;
      },

      setError: ({ context, event }: { context: MachineContext; event: any }) => {
        context.error = event.error as Error;
      },

      // 任务管理
      createFixTasks: ({ context, event }: { context: MachineContext; event: any }) => {
        const result = event.output as VerificationResult;
        // 根据验证失败创建修复任务
        if (result.fixTasks) {
          // 更新任务计划
        }
      },

      // 时间记录
      recordStartTime: () => {
        // 记录开始时间
      },

      recordEndTime: () => {
        // 记录结束时间
      },

      // 报告生成
      generateReport: ({ context }: { context: MachineContext }) => {
        console.log('\n📊 Execution Report:');
        console.log('===================');
        if (context.taskPlan) {
          console.log(`Tasks: ${context.taskPlan.tasks.length}`);
        }
        if (context.executionResult) {
          console.log(`Completed: ${context.executionResult.summary.completedTasks}`);
          console.log(`Failed: ${context.executionResult.summary.failedTasks}`);
        }
      },

      // 清理
      cleanup: () => {
        console.log('🧹 Cleaning up...');
        // 清理临时文件等
      }
    },

    actors: {
      planTasks: fromPromise(({ input }: { input: { context: MachineContext } }) => {
        return planningEngine.plan(input.context.prd);
      }),

      executeTasks: fromPromise(({ input }: { input: { context: MachineContext } }) => {
        if (!input.context.taskPlan) {
          throw new Error('No task plan available');
        }
        return executionEngine.execute(input.context.taskPlan);
      }),

      verifyResults: fromPromise(({ input }: { input: { context: MachineContext } }) => {
        if (!input.context.executionResult) {
          throw new Error('No execution result available');
        }
        return verificationEngine.verify(input.context.executionResult);
      })
    },

    guards: {
      allTasksVerified: ({ event }: { event: any }) => {
        const result = event.output as VerificationResult;
        return result.allPassed;
      },

      canRetry: () => {
        // 检查是否可以重试（未达到最大迭代次数）
        return true; // 简化实现
      }
    }
  });
};

// Agent 服务类
export class AgentService {
  private machine: any;
  private actor: any;
  private sessionId: string;

  constructor(
    context: AgentContext,
    agentConfig: AgentConfig,
    planningEngine: PlanningEngine,
    executionEngine: ExecutionEngine,
    verificationEngine: VerificationEngine
  ) {
    this.sessionId = `agent-${Date.now()}`;
    this.machine = createAgentMachine(
      context,
      agentConfig,
      planningEngine,
      executionEngine,
      verificationEngine
    );
    this.actor = createActor(this.machine);
  }

  start(): void {
    this.actor.start();
    this.actor.send({ type: 'START' });
  }

  stop(): void {
    this.actor.stop();
  }

  approve(): void {
    this.actor.send({ type: 'APPROVED' });
  }

  reject(): void {
    this.actor.send({ type: 'REJECTED' });
  }

  getState(): AgentState {
    const snapshot = this.actor.getSnapshot();
    return {
      status: snapshot.value as AgentState['status'],
      currentTask: null,
      iteration: 0,
      context: snapshot.context as AgentContext,
      history: [],
      startTime: new Date()
    };
  }

  onTransition(callback: (state: AgentState) => void): void {
    this.actor.subscribe((snapshot) => {
      callback({
        status: snapshot.value as AgentState['status'],
        currentTask: null,
        iteration: 0,
        context: snapshot.context as AgentContext,
        history: [],
        startTime: new Date()
      });
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export default createAgentMachine;
