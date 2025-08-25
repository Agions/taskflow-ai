/**
 * Jest 测试环境类型定义
 */

declare global {
  var testUtils: {
    sleep: (ms: number) => Promise<void>;
    createTempFile: (content: string, extension?: string) => Promise<string>;
    createTempDir: () => Promise<string>;
    randomString: (length?: number) => string;
    waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<boolean>;
  };
}

export {};