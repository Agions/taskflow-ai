/**
 * Agent 状态机核心
 * 使用 XState 实现完整的 Agent 生命周期管理
 */

import { createMachine, interpret, EventObject, StateMachine, Interpreter } from 'xstate';
import {
  AgentContext,
  AgentEvent,
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
  planningEngine: PlanningEngine,
  executionEngine: ExecutionEngine,
  verificationEngine: VerificationEngine
) => {
  return createMachine<MachineContext, MachineEvent>(
    {
      id: 'taskflow-agent',
      initial: 'idle',
      context: {
        ...context,
        error: undefined
      },
      states: {
        idle: {
          on: {
            START: {
              target: 'planning',
              actions: ['logStart', 'recordStartTime']
            }
          }
        },

        planning: {
          entry: ['logPlanning', 'setPlanningStatus'],
          invoke: {
            src: 'planTasks',
            onDone: {
              target: 'executing',
              actions: [
                'setTaskPlan',
                'logPlanComplete'
              ]
            },
            onError: {
              target: 'failed',
              actions: [
                'setError',
                'logPlanFailed'
              ]
            }
          }
        },

        executing: {
          entry: ['logExecution', 'setExecutingStatus'],
          invoke: {
            src: 'executeTasks',
            onDone: {
              target: 'verifying',
              actions: [
                'setExecutionResult',
                'logExecutionComplete'
              ]
            },
            onError: {
              target: 'failed',
              actions: [
                'setError',
                'logExecutionFailed'
              ]
            }
          }
        },

        verifying: {
          entry: ['logVerification', 'setVerifyingStatus'],
          invoke: {
            src: 'verifyResults',
            onDone: [
              {
                target: 'completed',
                cond: 'allTasksVerified',
                actions: [
                  'setVerificationResult',
                  'logVerificationPass'
                ]
              },
              {
                target: 'planning',
                cond: 'canRetry',
                actions: [
                  'createFixTasks',
                  'logVerificationFail'
                ]
              },
              {
                target: 'failed',
                actions: [
                  'setError',
                  'logVerificationFailed'
                ]
              }
            ],
            onError: {
              target: 'failed',
              actions: [
                'setError',
                'logVerificationError'
              ]
            }
          }
        },

        awaitingApproval: {
          entry: ['logAwaitingApproval', 'setAwaitingApprovalStatus'],
          on: {
            APPROVED: {
              target: 'executing',
              actions: ['logApproved']
            },
            REJECTED: {
              target: 'failed',
              actions: ['logRejected']
            }
          }
        },

        completed: {
          type: 'final',
          entry: [
            'logCompleted',
            'generateReport',
            'recordEndTime',
            'cleanup'
          ]
        },

        failed: {
          type: 'final',
          entry: [
            'logFailed',
            'recordEndTime',
            'cleanup'
          ]
        }
      }
    },
    {
      actions: {
        // 日志动作
        logStart: (ctx) => {
          console.log('🚀 Agent started');
          console.log(`📋 PRD: ${ctx.prd.title}`);
          console.log(`⚙️  Mode: ${ctx.config.mode}`);
        },

        logPlanning: () => {
          console.log('📋 Analyzing PRD and planning tasks...');
        },

        logPlanComplete: (ctx, event: any) => {
          const plan = event.data as TaskPlan;
          console.log(`✅ Planning complete: ${plan.tasks.length} tasks`);
          console.log(`⏱️  Total estimate: ${plan.totalEstimate} hours`);
        },

        logPlanFailed: (ctx, event: any) => {
          console.error('❌ Planning failed:', event.data?.message);
        },

        logExecution: () => {
          console.log('🔄 Executing tasks...');
        },

        logExecutionComplete: (ctx, event: any) => {
          const result = event.data as ExecutionResult;
          console.log(`✅ Execution complete: ${result.summary.completedTasks}/${result.summary.totalTasks} tasks`);
        },

        logExecutionFailed: (ctx, event: any) => {
          console.error('❌ Execution failed:', event.data?.message);
        },

        logVerification: () => {
          console.log('🔍 Verifying results...');
        },

        logVerificationPass: () => {
          console.log('✅ All verifications passed!');
        },

        logVerificationFail: (ctx, event: any) => {
          const result = event.data as VerificationResult;
          const failedChecks = result.checks.filter(c => !c.passed);
          console.log(`⚠️ Verification failed: ${failedChecks.length} checks failed`);
          console.log('🔄 Creating fix tasks...');
        },

        logVerificationFailed: (ctx, event: any) => {
          console.error('❌ Verification failed permanently');
        },

        logVerificationError: (ctx, event: any) => {
          console.error('❌ Verification error:', event.data?.message);
        },

        logAwaitingApproval: (ctx) => {
          console.log('⏸️  Awaiting user approval...');
          console.log('📋 Actions requiring approval:', ctx.config.approvalRequired);
        },

        logApproved: () => {
          console.log('✅ User approved, continuing...');
        },

        logRejected: () => {
          console.log('❌ User rejected, aborting...');
        },

        logCompleted: (ctx) => {
          console.log('🎉 Agent execution completed successfully!');
        },

        logFailed: (ctx) => {
          console.error('💥 Agent execution failed');
          if (ctx.error) {
            console.error('Error:', ctx.error.message);
          }
        },

        // 状态设置
        setPlanningStatus: (ctx) => {
          // 更新状态
        },

        setExecutingStatus: (ctx) => {
          // 更新状态
        },

        setVerifyingStatus: (ctx) => {
          // 更新状态
        },

        setAwaitingApprovalStatus: (ctx) => {
          // 更新状态
        },

        // 数据设置
        setTaskPlan: (ctx, event: any) => {
          ctx.taskPlan = event.data as TaskPlan;
        },

        setExecutionResult: (ctx, event: any) => {
          ctx.executionResult = event.data as ExecutionResult;
        },

        setVerificationResult: (ctx, event: any) => {
          ctx.verificationResult = event.data as VerificationResult;
        },

        setError: (ctx, event: any) => {
          ctx.error = event.data as Error;
        },

        // 任务管理
        createFixTasks: (ctx, event: any) => {
          const result = event.data as VerificationResult;
          // 根据验证失败创建修复任务
          if (result.fixTasks) {
            // 更新任务计划
          }
        },

        // 时间记录
        recordStartTime: (ctx) => {
          // 记录开始时间
        },

        recordEndTime: (ctx) => {
          // 记录结束时间
        },

        // 报告生成
        generateReport: (ctx) => {
          console.log('\n📊 Execution Report:');
          console.log('===================');
          if (ctx.taskPlan) {
            console.log(`Tasks: ${ctx.taskPlan.tasks.length}`);
          }
          if (ctx.executionResult) {
            console.log(`Completed: ${ctx.executionResult.summary.completedTasks}`);
            console.log(`Failed: ${ctx.executionResult.summary.failedTasks}`);
          }
        },

        // 清理
        cleanup: (ctx) => {
          console.log('🧹 Cleaning up...');
          // 清理临时文件等
        }
      },

      services: {
        planTasks: async (ctx) => {
          return await planningEngine.plan(ctx.prd);
        },

        executeTasks: async (ctx) => {
          if (!ctx.taskPlan) {
            throw new Error('No task plan available');
          }
          return await executionEngine.execute(ctx.taskPlan);
        },

        verifyResults: async (ctx) => {
          if (!ctx.executionResult) {
            throw new Error('No execution result available');
          }
          return await verificationEngine.verify(ctx.executionResult);
        }
      },

      guards: {
        allTasksVerified: (ctx, event: any) => {
          const result = event.data as VerificationResult;
          return result.allPassed;
        },

        canRetry: (ctx) => {
          // 检查是否可以重试（未达到最大迭代次数）
          return true; // 简化实现
        }
      }
    }
  );
};

// Agent 服务类
export class AgentService {
  private machine: StateMachine<MachineContext, MachineEvent>;
  private service: Interpreter<MachineContext, MachineEvent>;
  private sessionId: string;

  constructor(
    context: AgentContext,
    planningEngine: PlanningEngine,
    executionEngine: ExecutionEngine,
    verificationEngine: VerificationEngine
  ) {
    this.sessionId = `agent-${Date.now()}`;
    this.machine = createAgentMachine(
      context,
      planningEngine,
      executionEngine,
      verificationEngine
    );
    this.service = interpret(this.machine);
  }

  start(): void {
    this.service.start();
    this.service.send({ type: 'START' });
  }

  stop(): void {
    this.service.stop();
  }

  approve(): void {
    this.service.send({ type: 'APPROVED' });
  }

  reject(): void {
    this.service.send({ type: 'REJECTED' });
  }

  getState(): AgentState {
    const state = this.service.state;
    return {
      status: state.value as AgentState['status'],
      currentTask: null, // 从上下文中获取
      iteration: 0,
      context: this.service.state.context as AgentContext,
      history: [],
      startTime: new Date()
    };
  }

  onTransition(callback: (state: AgentState) => void): void {
    this.service.onTransition((state) => {
      callback({
        status: state.value as AgentState['status'],
        currentTask: null,
        iteration: 0,
        context: state.context as AgentContext,
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
