/**
 * TaskFlow Plugin System
 */

// Types
export {
  PluginManifest,
  PluginStatus,
  PluginInfo,
  PluginContext,
  PluginStorage,
  TaskFlowPlugin,
  HookHandler,
  HookContext,
  HookResult,
  BUILTIN_PLUGINS,
  type BuiltinPluginName,
} from './types';

// Plugin Manager
export { PluginManager, PluginManagerOptions, getPluginManager } from './plugin-manager';

// Built-in Plugins
export { LoggerPlugin, StoragePlugin, getBuiltInPlugins } from './built-in';
