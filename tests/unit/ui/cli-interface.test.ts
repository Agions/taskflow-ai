/**
 * CLI界面单元测试
 */

import { CLIInterface, defaultTheme } from '../../../src/ui/cli-interface';
import chalk from 'chalk';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

// Mock process.stdout
const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation();

describe('CLIInterface Unit Tests', () => {
  let cli: CLIInterface;

  beforeEach(() => {
    cli = new CLIInterface();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockStdoutWrite.mockRestore();
  });

  describe('构造函数和主题', () => {
    it('应该使用默认主题初始化', () => {
      const defaultCli = new CLIInterface();
      expect(defaultCli).toBeDefined();
    });

    it('应该使用自定义主题初始化', () => {
      const customTheme = {
        primary: '#FF0000',
        secondary: '#00FF00',
        success: '#0000FF',
        warning: '#FFFF00',
        error: '#FF00FF',
        info: '#00FFFF',
        muted: '#808080'
      };

      const customCli = new CLIInterface(customTheme);
      expect(customCli).toBeDefined();
    });
  });

  describe('欢迎横幅', () => {
    it('应该显示欢迎横幅', () => {
      cli.showWelcomeBanner();
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      const bannerCall = calls.find(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('████')
      );
      expect(bannerCall).toBeDefined();
    });
  });

  describe('帮助信息', () => {
    it('应该显示帮助信息', () => {
      cli.showHelp();
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const helpText = mockConsoleLog.mock.calls[0][0];
      expect(helpText).toContain('快速开始');
      expect(helpText).toContain('taskflow init');
      expect(helpText).toContain('taskflow interactive');
    });
  });

  describe('消息显示方法', () => {
    it('应该显示成功消息', () => {
      cli.showSuccess('操作成功', '详细信息');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const successCall = mockConsoleLog.mock.calls[0][0];
      const detailCall = mockConsoleLog.mock.calls[1][0];
      
      expect(successCall).toContain('✅');
      expect(successCall).toContain('操作成功');
      expect(detailCall).toContain('详细信息');
    });

    it('应该显示成功消息（无详细信息）', () => {
      cli.showSuccess('简单成功');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const successCall = mockConsoleLog.mock.calls[0][0];
      expect(successCall).toContain('✅');
      expect(successCall).toContain('简单成功');
    });

    it('应该显示错误消息', () => {
      cli.showError('操作失败', '错误详情');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const errorCall = mockConsoleLog.mock.calls[0][0];
      const detailCall = mockConsoleLog.mock.calls[1][0];
      
      expect(errorCall).toContain('❌');
      expect(errorCall).toContain('操作失败');
      expect(detailCall).toContain('错误详情');
    });

    it('应该显示警告消息', () => {
      cli.showWarning('警告信息', '警告详情');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const warningCall = mockConsoleLog.mock.calls[0][0];
      expect(warningCall).toContain('⚠️');
      expect(warningCall).toContain('警告信息');
    });

    it('应该显示信息消息', () => {
      cli.showInfo('信息内容', '信息详情');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const infoCall = mockConsoleLog.mock.calls[0][0];
      expect(infoCall).toContain('ℹ️');
      expect(infoCall).toContain('信息内容');
    });
  });

  describe('进度条', () => {
    beforeEach(() => {
      // Mock process.stdout.columns
      Object.defineProperty(process.stdout, 'columns', {
        value: 80,
        writable: true
      });
    });

    it('应该显示进度条', () => {
      const config = {
        total: 100,
        current: 50,
        label: '处理中',
        showPercentage: true,
        showETA: false
      };

      cli.showProgress(config);
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const progressText = mockStdoutWrite.mock.calls[0][0];
      expect(progressText).toContain('处理中');
      expect(progressText).toContain('50%');
    });

    it('应该显示带ETA的进度条', () => {
      const config = {
        total: 100,
        current: 25,
        label: '下载中',
        showPercentage: true,
        showETA: true
      };

      cli.showProgress(config);
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const progressText = mockStdoutWrite.mock.calls[0][0];
      expect(progressText).toContain('下载中');
      expect(progressText).toContain('25%');
      expect(progressText).toContain('ETA:');
    });

    it('应该在完成时换行', () => {
      const config = {
        total: 100,
        current: 100,
        label: '完成',
        showPercentage: true,
        showETA: false
      };

      cli.showProgress(config);
      
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('表格显示', () => {
    it('应该显示表格', () => {
      const headers = ['名称', '状态', '进度'];
      const rows = [
        ['任务1', '进行中', '50%'],
        ['任务2', '完成', '100%'],
        ['任务3', '待开始', '0%']
      ];

      cli.showTable(headers, rows);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      
      // 检查表头
      const headerCall = mockConsoleLog.mock.calls[0][0];
      expect(headerCall).toContain('名称');
      expect(headerCall).toContain('状态');
      expect(headerCall).toContain('进度');
      
      // 检查数据行
      const dataRows = mockConsoleLog.mock.calls.slice(2); // 跳过表头和分隔线
      expect(dataRows).toHaveLength(3);
      expect(dataRows[0][0]).toContain('任务1');
      expect(dataRows[1][0]).toContain('任务2');
      expect(dataRows[2][0]).toContain('任务3');
    });

    it('应该处理空表格', () => {
      cli.showTable([], []);
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('统计信息显示', () => {
    it('应该显示统计信息', () => {
      const stats = {
        '总任务数': 10,
        '已完成': 7,
        '进行中': 2,
        '待开始': 1,
        '成功率': '70%'
      };

      cli.showStats(stats);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const statsBox = mockConsoleLog.mock.calls[0][0];
      expect(statsBox).toContain('统计信息');
      expect(statsBox).toContain('总任务数');
      expect(statsBox).toContain('10');
      expect(statsBox).toContain('70%');
    });
  });

  describe('代码块显示', () => {
    it('应该显示代码块', () => {
      const code = 'console.log("Hello, World!");';
      const language = 'javascript';

      cli.showCodeBlock(code, language);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const codeBox = mockConsoleLog.mock.calls[0][0];
      expect(codeBox).toContain('JAVASCRIPT');
      expect(codeBox).toContain(code);
    });

    it('应该显示无语言标识的代码块', () => {
      const code = 'some code here';

      cli.showCodeBlock(code);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const codeBox = mockConsoleLog.mock.calls[0][0];
      expect(codeBox).toContain('代码');
      expect(codeBox).toContain(code);
    });
  });

  describe('分隔线', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 80,
        writable: true
      });
    });

    it('应该显示简单分隔线', () => {
      cli.showSeparator();
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const separator = mockConsoleLog.mock.calls[0][0];
      expect(separator).toContain('─');
    });

    it('应该显示带文本的分隔线', () => {
      cli.showSeparator('分节标题');
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const separator = mockConsoleLog.mock.calls[0][0];
      expect(separator).toContain('分节标题');
      expect(separator).toContain('─');
    });
  });

  describe('Spinner管理', () => {
    it('应该创建spinner', () => {
      const spinner = cli.createSpinner('加载中...');
      
      expect(spinner).toBeDefined();
      expect(spinner.text).toContain('加载中...');
    });

    it('应该停止当前spinner', () => {
      const spinner = cli.createSpinner('测试spinner');
      const stopSpy = jest.spyOn(spinner, 'stop');
      
      cli.stopSpinner();
      
      expect(stopSpy).toHaveBeenCalled();
    });

    it('应该在创建新spinner时停止旧的', () => {
      const spinner1 = cli.createSpinner('第一个spinner');
      const stopSpy = jest.spyOn(spinner1, 'stop');
      
      cli.createSpinner('第二个spinner');
      
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('执行时间显示', () => {
    it('应该显示执行时间', () => {
      // 等待一小段时间以确保有执行时间
      setTimeout(() => {
        cli.showExecutionTime();
        
        expect(mockConsoleLog).toHaveBeenCalled();
        const timeCall = mockConsoleLog.mock.calls.find(call => 
          call[0] && call[0].includes && call[0].includes('ℹ️')
        );
        expect(timeCall).toBeDefined();
      }, 10);
    });
  });

  describe('清屏功能', () => {
    it('应该清屏', () => {
      const clearSpy = jest.spyOn(console, 'clear').mockImplementation();
      
      cli.clear();
      
      expect(clearSpy).toHaveBeenCalled();
      
      clearSpy.mockRestore();
    });
  });

  describe('默认主题', () => {
    it('应该有正确的默认主题配置', () => {
      expect(defaultTheme.primary).toBe('#00D2FF');
      expect(defaultTheme.secondary).toBe('#3A7BD5');
      expect(defaultTheme.success).toBe('#00C851');
      expect(defaultTheme.warning).toBe('#FF8800');
      expect(defaultTheme.error).toBe('#FF4444');
      expect(defaultTheme.info).toBe('#33B5E5');
      expect(defaultTheme.muted).toBe('#757575');
    });
  });

  describe('边界情况', () => {
    it('应该处理空消息', () => {
      cli.showSuccess('');
      cli.showError('');
      cli.showWarning('');
      cli.showInfo('');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(4);
    });

    it('应该处理undefined详细信息', () => {
      cli.showSuccess('成功', undefined);
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('应该处理零进度', () => {
      const config = {
        total: 100,
        current: 0,
        label: '开始',
        showPercentage: true,
        showETA: true
      };

      cli.showProgress(config);
      
      expect(mockStdoutWrite).toHaveBeenCalled();
      const progressText = mockStdoutWrite.mock.calls[0][0];
      expect(progressText).toContain('0%');
    });
  });
});
