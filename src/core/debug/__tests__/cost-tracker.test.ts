/**
 * 成本跟踪器测试
 */

import { CostTracker } from '../cost-tracker';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker({ budgetThreshold: 5, decimalPlaces: 2 });
  });

  describe('record', () => {
    it('should record a single API call', () => {
      const entry = tracker.record('gpt-4o', 1000, 500, 1500, true);

      expect(entry.modelId).toBe('gpt-4o');
      expect(entry.inputTokens).toBe(1000);
      expect(entry.outputTokens).toBe(500);
      expect(entry.success).toBe(true);
    });

    it('should calculate cost correctly', () => {
      // GPT-4o: $5/1M input, $15/1M output
      const entry = tracker.record('gpt-4o', 1_000_000, 1_000_000, 1000);

      expect(entry.inputCost).toBe(5);
      expect(entry.outputCost).toBe(15);
      expect(entry.totalCost).toBe(20);
    });

    it('should use zero cost for unknown models', () => {
      const entry = tracker.record('unknown-model', 1000, 500, 1000);

      expect(entry.inputCost).toBe(0);
      expect(entry.outputCost).toBe(0);
      expect(entry.totalCost).toBe(0);
    });
  });

  describe('recordReasoning', () => {
    it('should handle reasoning tokens with discount', () => {
      // o1-mini: $3/1M input, $12/1M output
      const entry = tracker.recordReasoning(
        'o1-mini',
        1000,
        500,
        2000, // reasoning tokens
        2000,
        true
      );

      // reasoning tokens get 50% discount on output
      expect(entry.outputTokens).toBe(2500); // 500 + 2000
    });
  });

  describe('getStats', () => {
    it('should aggregate statistics correctly', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);
      tracker.record('gpt-4o', 2000, 1000, 1500);
      tracker.record('gpt-4o-mini', 500, 250, 800, false);

      const stats = tracker.getStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.successRequests).toBe(2);
      expect(stats.failedRequests).toBe(1);
      expect(stats.byModel['gpt-4o'].count).toBe(2);
      expect(stats.byModel['gpt-4o-mini'].count).toBe(1);
    });
  });

  describe('renderPanel', () => {
    it('should render cost panel correctly', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);

      const panel = tracker.renderPanel();

      expect(panel).toContain('💰 成本分析面板');
      expect(panel).toContain('GPT-4o');
    });
  });

  describe('renderCompact', () => {
    it('should render compact format', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);

      const compact = tracker.renderCompact();

      expect(compact).toContain('💰');
      expect(compact).toContain('请求');
      expect(compact).toContain('tokens');
    });
  });

  describe('toCSV', () => {
    it('should export to CSV format', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);

      const csv = tracker.toCSV();

      expect(csv).toContain('ID,时间,模型,输入tokens,输出tokens,输入成本,输出成本,总成本,耗时,成功');
      expect(csv).toContain('GPT-4o');
    });
  });

  describe('toJSON', () => {
    it('should export to JSON format', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);

      const json = tracker.toJSON();
      const data = JSON.parse(json);

      expect(data.stats).toBeDefined();
      expect(data.entries).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('should clear all entries', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);
      tracker.reset();

      const stats = tracker.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('should return all entries by default', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);
      tracker.record('gpt-4o', 2000, 1000, 1500);

      const history = tracker.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      tracker.record('gpt-4o', 1000, 500, 1000);
      tracker.record('gpt-4o', 2000, 1000, 1500);
      tracker.record('gpt-4o', 3000, 1500, 2000);

      const history = tracker.getHistory(2);
      expect(history).toHaveLength(2);
    });
  });
});
