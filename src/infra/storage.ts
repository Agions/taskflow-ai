import fs from 'fs-extra';
import path from 'path';
import { ConfigManager } from './config';
import { TaskPlan } from '../types/task';

/**
 * 存储服务，用于持久化数据
 */
export class StorageService {
  private configManager: ConfigManager;
  private basePath: string;

  /**
   * 创建存储服务实例
   * @param configManager 配置管理器实例
   */
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.basePath = this.configManager.get<string>('taskSettings.outputDir', './tasks');
    
    // 确保存储目录存在
    fs.ensureDirSync(this.basePath);
  }

  /**
   * 保存任务计划
   * @param plan 任务计划对象
   */
  public async saveTaskPlan(plan: TaskPlan): Promise<void> {
    const filePath = path.join(this.basePath, `${plan.id}.json`);
    await fs.writeJson(filePath, plan, { spaces: 2 });
  }

  /**
   * 获取任务计划
   * @param planId 计划ID
   */
  public async getTaskPlan(planId: string): Promise<TaskPlan | null> {
    const filePath = path.join(this.basePath, `${planId}.json`);
    
    if (!await fs.pathExists(filePath)) {
      return null;
    }

    return await fs.readJson(filePath) as TaskPlan;
  }

  /**
   * 获取所有任务计划
   */
  public async getAllTaskPlans(): Promise<TaskPlan[]> {
    const files = await fs.readdir(this.basePath);
    const planFiles = files.filter(file => file.endsWith('.json'));
    
    const plans: TaskPlan[] = [];
    
    for (const file of planFiles) {
      try {
        const plan = await fs.readJson(path.join(this.basePath, file)) as TaskPlan;
        plans.push(plan);
      } catch (error) {
        // 跳过无法解析的文件
        console.error(`Failed to parse plan file: ${file}`, error);
      }
    }
    
    return plans;
  }

  /**
   * 删除任务计划
   * @param planId 计划ID
   */
  public async deleteTaskPlan(planId: string): Promise<boolean> {
    const filePath = path.join(this.basePath, `${planId}.json`);
    
    if (!await fs.pathExists(filePath)) {
      return false;
    }
    
    await fs.remove(filePath);
    return true;
  }

  /**
   * 保存测试用例
   * @param taskId 任务ID
   * @param testContent 测试内容
   * @param fileName 文件名（不包含扩展名）
   */
  public async saveTestCase(taskId: string, testContent: string, fileName: string): Promise<string> {
    const testDir = this.configManager.get<string>('testSettings.outputDir', './tests');
    fs.ensureDirSync(testDir);
    
    const testFilePath = path.join(testDir, `${fileName}.test.ts`);
    await fs.writeFile(testFilePath, testContent);
    
    return testFilePath;
  }

  /**
   * 保存临时文件
   * @param content 文件内容
   * @param fileName 文件名
   */
  public async saveTempFile(content: string | Buffer, fileName: string): Promise<string> {
    const tempDir = path.join(this.basePath, 'temp');
    fs.ensureDirSync(tempDir);
    
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, content);
    
    return filePath;
  }

  /**
   * 获取临时文件
   * @param fileName 文件名
   */
  public async getTempFile(fileName: string): Promise<string | null> {
    const filePath = path.join(this.basePath, 'temp', fileName);
    
    if (!await fs.pathExists(filePath)) {
      return null;
    }
    
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * 保存解析结果
   * @param documentPath 文档路径
   * @param parsedContent 解析内容
   */
  public async saveParsedResult(documentPath: string, parsedContent: any): Promise<string> {
    const parsedDir = path.join(this.basePath, 'parsed');
    fs.ensureDirSync(parsedDir);
    
    const basename = path.basename(documentPath, path.extname(documentPath));
    const outputPath = path.join(parsedDir, `${basename}_parsed.json`);
    
    await fs.writeJson(outputPath, parsedContent, { spaces: 2 });
    
    return outputPath;
  }

  /**
   * 获取解析结果
   * @param documentName 文档名称（不包含扩展名）
   */
  public async getParsedResult(documentName: string): Promise<any | null> {
    const filePath = path.join(this.basePath, 'parsed', `${documentName}_parsed.json`);
    
    if (!await fs.pathExists(filePath)) {
      return null;
    }
    
    return await fs.readJson(filePath);
  }

  /**
   * 设置存储路径
   * @param basePath 基础路径
   */
  public setBasePath(basePath: string): void {
    this.basePath = basePath;
    fs.ensureDirSync(this.basePath);
  }

  /**
   * 获取存储路径
   */
  public getBasePath(): string {
    return this.basePath;
  }

  /**
   * 清理临时文件
   */
  public async cleanupTempFiles(): Promise<void> {
    const tempDir = path.join(this.basePath, 'temp');
    
    if (await fs.pathExists(tempDir)) {
      await fs.emptyDir(tempDir);
    }
  }
} 