/**
 * Agent 状态机核心
 * 使用 XState v5 实现完整的 Agent 生命周期管理
 */

import { createActor } from 'xstate';
import { AgentContext, AgentConfig, AgentState } from '../types';
import { PlanningEngine } from '../planning';
import { ExecutionEngine } from '../execution';
import { VerificationEngine } from '../verification/engine';
import { createAgentMachine } from './machine';
import { MachineContext } from './types';

export * from './types';
export * from './machine';

export class AgentStateMachine {
  private actor: unknown;
  private stateChangeCallbacks: Array<(state: AgentState) => void> = [];

  constructor(
    context: AgentContext,
    config: AgentConfig,
    planningEngine: PlanningEngine,
    executionEngine: ExecutionEngine,
    verificationEngine: VerificationEngine
  ) {
    const machineContext: MachineContext = {
      ...context,
      config,
    };

    const machine = createAgentMachine(
      machineContext,
      config,
      planningEngine,
      executionEngine,
      verificationEngine
    );

    this.actor = createActor(machine);

    this.actor.subscribe((state: unknown) => {
      this.stateChangeCallbacks.forEach(cb => cb(state.value as AgentState));
    });
  }

  start(): void {
    this.actor.start();
  }

  send(event: unknown): void {
    this.actor.send(event);
  }

  getState(): AgentState {
    return this.actor.getSnapshot().value as AgentState;
  }

  getContext(): MachineContext {
    return this.actor.getSnapshot().context as MachineContext;
  }

  onStateChange(callback: (state: AgentState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  stop(): void {
    this.actor.stop();
  }
}

export default AgentStateMachine;
