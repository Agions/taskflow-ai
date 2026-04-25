/**
 * CLI Utils Tests - TaskFlow AI v4.0
 */

import { log, format, table, confirm, Spinner, chalk } from '../utils';

describe('CLI Utils', () => {
  describe('log', () => {
    it('should have all log methods', () => {
      expect(log.info).toBeDefined();
      expect(log.success).toBeDefined();
      expect(log.error).toBeDefined();
      expect(log.warn).toBeDefined();
      expect(log.dim).toBeDefined();
    });
  });

  describe('format', () => {
    it('should have format methods', () => {
      expect(format.title).toBeDefined();
      expect(format.section).toBeDefined();
      expect(format.listItem).toBeDefined();
      expect(format.keyValue).toBeDefined();
    });
  });

  describe('table', () => {
    it('should have simple table method', () => {
      expect(table.simple).toBeDefined();
    });
  });

  describe('confirm', () => {
    it('should be a function', () => {
      expect(typeof confirm).toBe('function');
    });
  });

  describe('Spinner', () => {
    it('should be a class', () => {
      expect(typeof Spinner).toBe('function');
    });

    it('should have start and stop methods', () => {
      const s = new Spinner();
      expect(typeof s.start).toBe('function');
      expect(typeof s.stop).toBe('function');
    });
  });

  describe('chalk', () => {
    it('should be exported', () => {
      expect(chalk).toBeDefined();
    });
  });
});
