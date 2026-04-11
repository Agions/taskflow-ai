/**
 * RuleBasedGoalParser 测试
 */

import { describe, it, expect } from '@jest/globals';
import { RuleBasedGoalParser } from './RuleBasedGoalParser';

describe('RuleBasedGoalParser', () => {
  let parser: RuleBasedGoalParser;

  beforeEach(() => {
    parser = new RuleBasedGoalParser();
  });

  describe('getStrategy', () => {
    it('should return rule strategy', () => {
      expect(parser.getStrategy()).toBe('rule');
    });
  });

  describe('parse - basic', () => {
    it('should parse a simple goal', async () => {
      const result = await parser.parse('完成用户登录功能');

      expect(result.goal).toBe('完成用户登录功能');
      expect(result.subgoals.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.estimatedSteps).toBeGreaterThan(0);
    });

    it('should handle empty goal gracefully', async () => {
      const result = await parser.parse('');

      expect(result.goal).toBe('');
      expect(result.subgoals).toEqual([]);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('parse - subgoals', () => {
    it('should split by Chinese separator "然后"', async () => {
      const result = await parser.parse('先分析需求然后编写代码');

      expect(result.subgoals.length).toBe(2);
      expect(result.subgoals[0]).toContain('分析需求');
      expect(result.subgoals[1]).toContain('编写代码');
    });

    it('should split by "再"', async () => {
      const result = await parser.parse('先设计数据库再实现API');

      expect(result.subgoals.length).toBe(2);
    });

    it('should split by comma', async () => {
      const result = await parser.parse('完成登录,实现注册,找回密码');

      expect(result.subgoals.length).toBe(3);
    });

    it('should split by Chinese comma', async () => {
      const result = await parser.parse('完成登录，实现注册，找回密码');

      expect(result.subgoals.length).toBe(3);
    });

    it('should split by "and" keyword', async () => {
      const result = await parser.parse('design and implement');

      expect(result.subgoals.length).toBe(2);
    });

    it('should split by "then" keyword', async () => {
      const result = await parser.parse('analyze then code');

      expect(result.subgoals.length).toBe(2);
    });

    it('should handle single goal without separator', async () => {
      const result = await parser.parse('完成单一任务');

      expect(result.subgoals.length).toBe(1);
      expect(result.subgoals[0]).toBe('完成单一任务');
    });

    it('should handle multiple Chinese and English separators', async () => {
      const result = await parser.parse('分析需求，然后设计数据库，再编写代码');

      expect(result.subgoals.length).toBe(3);
    });
  });

  describe('parse - constraints', () => {
    it('should extract constraints in brackets', async () => {
      const result = await parser.parse('优化系统性能[使用缓存]同时保证代码质量');

      expect(result.constraints).toContain('使用缓存');
    });

    it('should extract multiple constraints in brackets', async () => {
      const result = await parser.parse('完成任务[高效][稳定][可维护]');

      expect(result.constraints.length).toBe(3);
    });

    it('should handle constraints with Chinese brackets', async () => {
      const result = await parser.parse('完成任务「必须通过测试」');

      expect(result.constraints).toContain('必须通过测试');
    });

    it('should extract constraints with keyword "约束"', async () => {
      const result = await parser.parse('完成任务约束：必须在3天内完成');

      expect(result.constraints.length).toBeGreaterThan(0);
    });

    it('should not extract constraint if empty', async () => {
      const result = await parser.parse('普通任务[]');

      expect(result.constraints).not.toContain('');
    });
  });

  describe('parse - success criteria', () => {
    it('should extract success criteria with keyword "确保"', async () => {
      const result = await parser.parse('完成任务确保：所有测试通过');

      expect(result.successCriteria).toContain('所有测试通过');
    });

    it('should extract success criteria with keyword "验证"', async () => {
      const result = await parser.parse('完成任务验证：功能正常运行');

      expect(result.successCriteria).toContain('功能正常运行');
    });

    it('should extract success criteria with keyword "确认"', async () => {
      const result = await parser.parse('完成任务确认：用户可以登录');

      expect(result.successCriteria).toContain('用户可以登录');
    });

    it('should extract English success criteria', async () => {
      const result = await parser.parse('完成任务 ensure: all tests pass');

      expect(result.successCriteria).toContain('all tests pass');
    });

    it('should return default criteria if none found', async () => {
      const result = await parser.parse('普通任务');

      expect(result.successCriteria).toContain('任务完成');
    });
  });

  describe('parse - confidence', () => {
    it('should return confidence between 0 and 1', async () => {
      const result = await parser.parse('完成一个任务');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should increase confidence when constraints present', async () => {
      const withoutConstraint = await parser.parse('完成任务');
      const withConstraint = await parser.parse('完成任务[必须通过测试]');

      expect(withConstraint.confidence).toBeGreaterThan(withoutConstraint.confidence);
    });

    it('should increase confidence when success criteria present', async () => {
      const withoutCriteria = await parser.parse('完成任务');
      const withCriteria = await parser.parse('完成任务确保：测试通过');

      expect(withCriteria.confidence).toBeGreaterThan(withoutCriteria.confidence);
    });

    it('should cap confidence at 0.95', async () => {
      // 构造一个有很多提升 confidence 因素的目标
      const goal =
        '任务A[约束1][约束2][约束3][约束4]确保：标准1验证：标准2确认：标准3检查：标准4，然后任务B，再任务C，然后任务D，再任务E，同时任务F，任务G，确保：测试通过';
      const result = await parser.parse(goal);

      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe('parse - estimated steps', () => {
    it('should return at least 1 step', async () => {
      const result = await parser.parse('任务');

      expect(result.estimatedSteps).toBeGreaterThanOrEqual(1);
    });

    it('should scale with subgoal count', async () => {
      const single = await parser.parse('任务A');
      const multiple = await parser.parse('任务A然后任务B然后任务C');

      expect(multiple.estimatedSteps).toBeGreaterThan(single.estimatedSteps);
    });
  });

  describe('parse - reasoning', () => {
    it('should include reasoning when subgoals split', async () => {
      const result = await parser.parse('任务A然后任务B然后任务C');

      expect(result.reasoning).toContain('3 个子目标');
    });

    it('should include constraint info in reasoning', async () => {
      const result = await parser.parse('任务[约束1][约束2]');

      expect(result.reasoning).toContain('约束条件');
    });
  });

  describe('parse - mixed Chinese and English', () => {
    it('should handle mixed language goal', async () => {
      const result = await parser.parse('create user, then validate email, 确保功能正常');

      expect(result.subgoals.length).toBe(3);
      expect(result.confidence).toBeGreaterThan(0.5); // Mixed language boost
    });
  });

  describe('parse - context parameter', () => {
    it('should accept context parameter without error', async () => {
      const result = await parser.parse('完成任务', {
        userId: '123',
        priority: 'high',
      });

      expect(result.goal).toBe('完成任务');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('parse - complex goal', () => {
    it('should parse complex goal with all elements', async () => {
      const result = await parser.parse(
        '完成用户模块的开发[使用TypeScript][遵循PEP8]然后编写单元测试确保：覆盖率超过80%验证：所有用例通过'
      );

      expect(result.goal).toBeTruthy();
      expect(result.subgoals.length).toBe(2);
      expect(result.constraints.length).toBe(2);
      expect(result.successCriteria.length).toBeGreaterThan(0);
      expect(result.estimatedSteps).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });
});
