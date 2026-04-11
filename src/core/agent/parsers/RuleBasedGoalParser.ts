/**
 * 基于规则的目标解析器
 * 无 AI 依赖，使用关键词提取 + 模式匹配
 */

import { GoalParser, GoalParseResult } from '../types';

interface ParsedComponents {
  subgoals: string[];
  constraints: string[];
  successCriteria: string[];
  rawConfidence: number;
  reasoning: string[];
}

/**
 * RuleBasedGoalParser
 * 使用连接词分割子目标，提取约束和成功标准
 */
export class RuleBasedGoalParser implements GoalParser {
  private static readonly SUBGOAL_SEPARATORS = [
    '然后',
    '再',
    '接着',
    '之后',
    '并且',
    '同时',
    '接下来',
    'and',
    'then',
    'also',
    'plus',
    ',',
    '，',
    '、',
  ];

  private static readonly CONSTRAINT_PATTERNS = [
    /\[([^\]]+)\]/g, // [约束内容]
    /「([^」]+)」/g, // 「约束内容」
    /【([^】]+)】/g, // 【约束内容】
    /(?:约束|限制|条件|必须|应当|需要):?\s*([^。，,；；]+)/gi,
  ];

  private static readonly SUCCESS_CRITERIA_KEYWORDS = [
    '确保',
    '验证',
    '确认',
    '检查',
    'validate',
    'ensure',
    'verify',
    'confirm',
    'check',
    'assert',
    '证明',
    '保证',
  ];

  private static readonly SUCCESS_CRITERIA_PATTERNS = [
    /(确保|验证|确认|检查|validate|ensure|verify|confirm|check)[：:]\s*([^。，,；；]+)/gi,
    /([^。。，,；；]+(?=(确保|验证|确认|检查|validate|ensure|verify|confirm|check))[^。。，,；；]*)/gi,
  ];

  getStrategy(): 'rule' | 'ai' | 'hybrid' {
    return 'rule';
  }

  async parse(goal: string, context?: Record<string, unknown>): Promise<GoalParseResult> {
    const components = this.parseComponents(goal);

    const subgoals = this.splitSubgoals(goal);
    const constraints = components.constraints;
    const successCriteria = this.extractSuccessCriteria(goal);
    const estimatedSteps = this.estimateSteps(subgoals, goal);
    const confidence = this.calculateConfidence(components, subgoals, constraints, successCriteria);
    const reasoning = this.buildReasoning(components, subgoals.length);

    return {
      goal: goal.trim(),
      subgoals,
      constraints,
      successCriteria,
      estimatedSteps,
      confidence,
      reasoning: reasoning.join('; '),
    };
  }

  private parseComponents(goal: string): ParsedComponents {
    const constraints: string[] = [];
    const successCriteria: string[] = [];
    const reasoning: string[] = [];
    let rawConfidence = 0.5;

    // 提取约束
    for (const pattern of RuleBasedGoalParser.CONSTRAINT_PATTERNS) {
      const matches = goal.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !constraints.includes(match[1].trim())) {
          constraints.push(match[1].trim());
        }
      }
    }

    // 提取成功标准
    for (const keyword of RuleBasedGoalParser.SUCCESS_CRITERIA_KEYWORDS) {
      const regex = new RegExp(
        `(确保|验证|确认|检查|validate|ensure|verify|confirm|check)[：:]\\s*([^。，,；；]+)`,
        'gi'
      );
      let match;
      while ((match = regex.exec(goal)) !== null) {
        const criteria = match[2].trim();
        if (criteria && !successCriteria.includes(criteria)) {
          successCriteria.push(criteria);
        }
      }
    }

    // 基于约束数量提升 confidence
    if (constraints.length > 0) {
      rawConfidence += constraints.length * 0.05;
      reasoning.push(`发现 ${constraints.length} 个约束条件`);
    }

    // 基于成功标准提升 confidence
    if (successCriteria.length > 0) {
      rawConfidence += successCriteria.length * 0.05;
      reasoning.push(`发现 ${successCriteria.length} 个成功标准`);
    }

    // 基于目标长度和质量提升 confidence
    if (goal.length > 20) {
      rawConfidence += 0.05;
    }
    if (goal.includes('，') || goal.includes(',')) {
      rawConfidence += 0.05;
    }

    // 中英文混合目标
    const hasChinese = /[\\u4e00-\\u9fa5]/.test(goal);
    const hasEnglish = /[a-zA-Z]/.test(goal);
    if (hasChinese && hasEnglish) {
      rawConfidence += 0.05;
      reasoning.push('检测到中英文混合目标');
    }

    return {
      subgoals: [],
      constraints,
      successCriteria,
      rawConfidence: Math.min(rawConfidence, 0.95),
      reasoning,
    };
  }

  private splitSubgoals(goal: string): string[] {
    if (!goal || typeof goal !== 'string') {
      return [];
    }

    // 先移除约束部分避免干扰
    let cleanGoal = goal.replace(/\\[[^\\]]+\\]/g, '').trim();

    // 构建分割正则
    const sepPattern = RuleBasedGoalParser.SUBGOAL_SEPARATORS.map(s =>
      s === ',' ? '(?:,|，)' : s === '、' ? '(?:、|,|，)' : s
    ).join('|');

    const separatorRegex = new RegExp(`\\s*(?:${sepPattern})\\s*`, 'gi');

    const parts = cleanGoal
      .split(separatorRegex)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // 如果没有分割出子目标，返回原目标作为单一子目标
    if (parts.length === 0) {
      return [goal.trim()];
    }

    return parts;
  }

  private extractSuccessCriteria(goal: string): string[] {
    const criteria: string[] = [];

    // 模式1: 关键词 + 内容
    const pattern1 =
      /(?:(确保|验证|确认|检查|validate|ensure|verify|confirm|check)[：:]\s*)([^。，,；；]+)/gi;
    let match;
    while ((match = pattern1.exec(goal)) !== null) {
      const text = match[2].trim();
      if (text && !criteria.includes(text)) {
        criteria.push(text);
      }
    }

    // 模式2: 句末的成功标准（以"完成"、"成功"结尾）
    const pattern2 = /([^。。，,]+?(?:完成|成功|done|completed|finished))[。.。]?$/gi;
    while ((match = pattern2.exec(goal)) !== null) {
      const text = match[1].trim();
      if (text.length > 3 && !criteria.includes(text)) {
        criteria.push(text);
      }
    }

    // 如果没有找到明确的标准，返回默认值
    if (criteria.length === 0) {
      return ['任务完成'];
    }

    return criteria;
  }

  private estimateSteps(subgoals: string[], goal: string): number {
    if (subgoals.length === 0) {
      return 1;
    }

    // 每个子目标估算 2-3 步
    const baseSteps = subgoals.length * 2;

    // 根据目标复杂度调整
    const toolKeywords = ['搜索', '查找', '获取', '创建', '修改', '删除', '执行', 'run', 'get', 'create', 'update', 'delete'];
    const toolCount = toolKeywords.filter(k => goal.toLowerCase().includes(k.toLowerCase())).length;

    const complexityAdjustment = Math.min(toolCount, subgoals.length);

    return Math.max(subgoals.length, baseSteps + complexityAdjustment);
  }

  private calculateConfidence(
    components: ParsedComponents,
    subgoals: string[],
    constraints: string[],
    successCriteria: string[]
  ): number {
    let confidence = components.rawConfidence;

    // 子目标数量合理性
    if (subgoals.length >= 1 && subgoals.length <= 7) {
      confidence += 0.05;
    } else if (subgoals.length > 7) {
      confidence -= 0.1; // 过多子目标可能表示解析不准确
    }

    // 有约束但不过多
    if (constraints.length >= 1 && constraints.length <= 5) {
      confidence += 0.05;
    } else if (constraints.length > 5) {
      confidence -= 0.05;
    }

    // 有成功标准
    if (successCriteria.length > 0) {
      confidence += 0.05;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private buildReasoning(components: ParsedComponents, subgoalCount: number): string[] {
    const reasoning = [...components.reasoning];

    if (subgoalCount > 1) {
      reasoning.push(`将目标分解为 ${subgoalCount} 个子目标`);
    } else {
      reasoning.push('目标保持为单一子目标');
    }

    return reasoning;
  }
}

export default RuleBasedGoalParser;
