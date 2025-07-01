/**
 * 性能测试设置文件
 */

// 扩展全局对象以支持垃圾回收
declare global {
  var gc: (() => void) | undefined;
}

// 设置测试超时
jest.setTimeout(30000);

// 性能测试前的全局设置
beforeAll(() => {
  console.log('开始性能基准测试...');
  console.log(`Node.js版本: ${process.version}`);
  console.log(`平台: ${process.platform}`);
  console.log(`架构: ${process.arch}`);
  
  const memoryUsage = process.memoryUsage();
  console.log(`初始内存使用:`);
  console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`);
});

// 性能测试后的全局清理
afterAll(() => {
  console.log('性能基准测试完成');
  
  const memoryUsage = process.memoryUsage();
  console.log(`最终内存使用:`);
  console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`);
});

// 性能测试工具函数
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const startTime = performance.now();
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`${name} 耗时: ${duration.toFixed(2)}ms`);
      
      resolve({ result, duration });
    } catch (error) {
      reject(error);
    }
  });
}

export function measureMemoryUsage<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; memoryDelta: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage().heapUsed;
      const result = await fn();
      
      // 再次强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDelta = finalMemory - initialMemory;
      
      console.log(`${name} 内存变化: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      
      resolve({ result, memoryDelta });
    } catch (error) {
      reject(error);
    }
  });
}
