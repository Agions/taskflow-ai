/**
 * 增强类型定义
 * 提供更严格和完整的类型定义，消除any类型使用
 */

import { TaskStatus, TaskPriority, TaskType } from './task';
import { JSONValue, JSONObject } from './strict-types';

/**
 * 严格的函数类型定义
 */
export type StrictFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> = 
  (...args: TArgs) => TReturn;

export type AsyncStrictFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> = 
  (...args: TArgs) => Promise<TReturn>;

/**
 * 事件处理器类型
 */
export type EventHandler<TEvent = unknown> = (event: TEvent) => void | Promise<void>;

/**
 * 错误处理器类型
 */
export type ErrorHandler<TError = Error> = (error: TError) => void | Promise<void>;

/**
 * 验证函数类型
 */
export type Validator<T> = (value: T) => boolean | string;

/**
 * 转换函数类型
 */
export type Transformer<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * 过滤器函数类型
 */
export type Filter<T> = (item: T) => boolean;

/**
 * 比较函数类型
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * 映射函数类型
 */
export type Mapper<TInput, TOutput> = (input: TInput, index?: number) => TOutput;

/**
 * 归约函数类型
 */
export type Reducer<TItem, TAccumulator> = (accumulator: TAccumulator, item: TItem, index?: number) => TAccumulator;

/**
 * 配置对象类型
 */
export interface ConfigObject extends JSONObject {
  readonly [key: string]: JSONValue;
}

/**
 * 严格的选项接口
 */
export interface StrictOptions {
  readonly [key: string]: JSONValue;
}

/**
 * 命令选项类型
 */
export interface CommandOptions {
  readonly [key: string]: JSONValue | undefined;
  readonly verbose?: boolean;
  readonly debug?: boolean;
  readonly force?: boolean;
  readonly dryRun?: boolean;
  readonly output?: string;
  readonly format?: 'json' | 'yaml' | 'table' | 'csv';
}

/**
 * 解析选项类型
 */
export interface ParseOptions {
  readonly [key: string]: JSONValue | undefined;
  readonly modelType?: string;
  readonly extractSections?: boolean;
  readonly extractFeatures?: boolean;
  readonly prioritize?: boolean;
  readonly multiModel?: JSONObject;
}

/**
 * 多模型选项类型
 */
export interface MultiModelOptions {
  readonly [key: string]: JSONValue | undefined;
  readonly enabled: boolean;
  readonly primary: string;
  readonly fallback: string[];
  readonly loadBalancing?: boolean;
  readonly costOptimization?: boolean;
}

/**
 * 任务过滤器类型
 */
export interface TaskFilter {
  readonly status?: TaskStatus | readonly TaskStatus[];
  readonly priority?: TaskPriority | readonly TaskPriority[];
  readonly type?: TaskType | readonly TaskType[];
  readonly assignee?: string | readonly string[];
  readonly tags?: string | readonly string[];
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly dueAfter?: Date;
  readonly dueBefore?: Date;
}

/**
 * 排序选项类型
 */
export interface SortOptions<T = unknown> {
  readonly field: keyof T;
  readonly direction: 'asc' | 'desc';
}

/**
 * 分页选项类型
 */
export interface PaginationOptions {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
}

/**
 * 搜索选项类型
 */
export interface SearchOptions {
  readonly query: string;
  readonly fields?: readonly string[];
  readonly caseSensitive?: boolean;
  readonly exactMatch?: boolean;
  readonly fuzzy?: boolean;
}

/**
 * 导出选项类型
 */
export interface ExportOptions {
  readonly [key: string]: JSONValue | undefined;
  readonly format: 'json' | 'csv' | 'xlsx' | 'pdf';
  readonly filename?: string;
  readonly includeMetadata?: boolean;
  readonly compress?: boolean;
}

/**
 * 导入选项类型
 */
export interface ImportOptions {
  readonly [key: string]: JSONValue | undefined;
  readonly format?: 'json' | 'csv' | 'xlsx';
  readonly validate?: boolean;
  readonly merge?: boolean;
  readonly overwrite?: boolean;
}

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  readonly executionTime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly cacheHitRate: number;
  readonly errorRate: number;
  readonly throughput: number;
}

/**
 * 缓存选项类型
 */
export interface CacheOptions {
  readonly ttl?: number;
  readonly maxSize?: number;
  readonly strategy?: 'lru' | 'fifo' | 'lfu';
}

/**
 * 重试选项类型
 */
export interface RetryOptions {
  readonly maxAttempts: number;
  readonly delay: number;
  readonly backoff?: 'linear' | 'exponential';
  readonly maxDelay?: number;
  readonly retryCondition?: (error: Error) => boolean;
}

/**
 * 超时选项类型
 */
export interface TimeoutOptions {
  readonly timeout: number;
  readonly abortSignal?: AbortSignal;
}

/**
 * 日志选项类型
 */
export interface LogOptions {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly format?: 'json' | 'text';
  readonly timestamp?: boolean;
  readonly colorize?: boolean;
}

/**
 * 验证结果类型
 */
export interface ValidationResult<T = unknown> {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly data?: T;
}

/**
 * 操作结果类型
 */
export interface OperationResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly metadata?: JSONObject;
}

/**
 * 异步操作结果类型
 */
export type AsyncOperationResult<T = unknown> = Promise<OperationResult<T>>;

/**
 * 回调函数类型
 */
export type Callback<T = unknown> = (error: Error | null, result?: T) => void;

/**
 * 异步回调函数类型
 */
export type AsyncCallback<T = unknown> = (error: Error | null, result?: T) => Promise<void>;

/**
 * 事件监听器类型
 */
export interface EventListener<T = unknown> {
  readonly event: string;
  readonly handler: EventHandler<T>;
  readonly once?: boolean;
}

/**
 * 中间件函数类型
 */
export type Middleware<TContext = unknown> = (
  context: TContext,
  next: () => Promise<void>
) => Promise<void>;

/**
 * 插件接口
 */
export interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly dependencies?: readonly string[];
  readonly initialize: () => Promise<void>;
  readonly cleanup?: () => Promise<void>;
}

/**
 * 服务接口
 */
export interface Service {
  readonly name: string;
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
  readonly isRunning: () => boolean;
  readonly getStatus: () => ServiceStatus;
}

/**
 * 服务状态类型
 */
export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * 资源接口
 */
export interface Resource {
  readonly id: string;
  readonly type: string;
  readonly metadata: JSONObject;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 可序列化类型
 */
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | readonly Serializable[]
  | { readonly [key: string]: Serializable };

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 部分必需类型
 */
export type PartialRequired<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

/**
 * 可选键类型
 */
export type OptionalKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * 必需键类型
 */
export type RequiredKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * 非空类型
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 提取数组元素类型
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 提取Promise类型
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never;

/**
 * 函数参数类型
 */
export type FunctionArgs<T> = T extends (...args: infer A) => unknown ? A : never;

/**
 * 函数返回类型
 */
export type FunctionReturn<T> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * 键值对类型
 */
export type KeyValuePair<K extends string | number | symbol = string, V = unknown> = {
  readonly key: K;
  readonly value: V;
};

/**
 * 字典类型
 */
export type Dictionary<T = unknown> = Record<string, T>;

/**
 * 只读字典类型
 */
export type ReadonlyDictionary<T = unknown> = Readonly<Record<string, T>>;

/**
 * 类构造函数类型
 */
export type Constructor<T = unknown> = new (...args: readonly unknown[]) => T;

/**
 * 抽象构造函数类型
 */
export type AbstractConstructor<T = unknown> = abstract new (...args: readonly unknown[]) => T;

/**
 * 混入类型
 */
export type Mixin<T extends Constructor> = T & Constructor;

/**
 * 类型守卫函数
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * 断言函数类型
 */
export type AssertionFunction<T> = (value: unknown) => asserts value is T;
