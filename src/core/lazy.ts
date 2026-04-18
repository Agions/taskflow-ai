/**
 * Lazy Loader - 懒加载模块
 * 支持按需加载重型模块，减少冷启动时间
 */

interface LazyModule {
  loaded: boolean;
  loading: boolean;
  module: unknown;
  error: Error | null;
}

const lazyModules: Map<string, LazyModule> = new Map();

function getLogger(prefix: string) {
  return {
    debug: (msg: string, ...args: any[]) => console.debug(`[${prefix}]`, msg, ...args),
    info: (msg: string, ...args: any[]) => console.info(`[${prefix}]`, msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[${prefix}]`, msg, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[${prefix}]`, msg, ...args),
  };
}

const logger = getLogger('core/lazy');

/**
 * 创建懒加载模块
 */
export function createLazy<T>(
  name: string,
  loader: () => Promise<T>
): {
  get(): T;
  loaded: boolean;
  loading: boolean;
} {
  let lazyModule = lazyModules.get(name);
  
  if (!lazyModule) {
    lazyModule = {
      loaded: false,
      loading: false,
      module: null,
      error: null,
    };
    lazyModules.set(name, lazyModule);
  }
  
  return {
    get(): T {
      if (lazyModule!.loaded && lazyModule!.module) {
        return lazyModule!.module as T;
      }
      throw new Error(
        `Module ${name} not loaded. Use await loadModule('${name}') first.`
      );
    },
    get loaded() { return lazyModule!.loaded; },
    get loading() { return lazyModule!.loading; },
  };
}

/**
 * 加载懒加载模块
 */
export async function loadModule<T>(
  name: string,
  loader: () => Promise<T>
): Promise<T> {
  let lazyModule = lazyModules.get(name);
  
  if (!lazyModule) {
    lazyModule = {
      loaded: false,
      loading: false,
      module: null,
      error: null,
    };
    lazyModules.set(name, lazyModule);
  }
  
  if (lazyModule.loaded && lazyModule.module) {
    return lazyModule.module as T;
  }
  
  if (lazyModule.loading) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (lazyModule!.loaded) {
          clearInterval(checkInterval);
          if (lazyModule!.error) {
            reject(lazyModule!.error);
          } else {
            resolve(lazyModule!.module as T);
          }
        }
      }, 10);
    });
  }
  
  lazyModule.loading = true;
  
  try {
    logger.debug(`加载懒加载模块: ${name}`);
    const module = await loader();
    lazyModule.module = module;
    lazyModule.loaded = true;
    lazyModule.loading = false;
    logger.debug(`懒加载模块已就绪: ${name}`);
    return module;
  } catch (error) {
    lazyModule.error = error as Error;
    lazyModule.loading = false;
    logger.error(`懒加载模块加载失败: ${name}`, error);
    throw error;
  }
}

/**
 * 检查模块是否已加载
 */
export function isModuleLoaded(name: string): boolean {
  const lazyModule = lazyModules.get(name);
  return lazyModule?.loaded ?? false;
}

/**
 * 预加载模块 (不阻塞)
 */
export function preloadModule(name: string, loader: () => Promise<unknown>): void {
  loadModule(name, loader).catch(() => {
    // 静默处理预加载错误
  });
}

/**
 * 获取所有懒加载模块状态
 */
export function getLazyModulesStatus(): Array<{
  name: string;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}> {
  const result: Array<{
    name: string;
    loaded: boolean;
    loading: boolean;
    error: string | null;
  }> = [];
  
  for (const [name, lazyModule] of Array.from(lazyModules.entries())) {
    result.push({
      name,
      loaded: lazyModule.loaded,
      loading: lazyModule.loading,
      error: lazyModule.error?.message ?? null,
    });
  }
  
  return result;
}
