const pkg = require('./package.json');

// 动态加载插件，避免缺失依赖导致构建失败
function loadPlugin(name, fallback = null) {
  try {
    return require(name);
  } catch (error) {
    console.warn(`⚠️ 插件 ${name} 未找到，使用备用方案`);
    return fallback;
  }
}

const typescript = loadPlugin('@rollup/plugin-typescript');
const resolve = loadPlugin('@rollup/plugin-node-resolve');
const commonjs = loadPlugin('@rollup/plugin-commonjs');
const json = loadPlugin('@rollup/plugin-json');
const terser = loadPlugin('@rollup/plugin-terser');
const dts = loadPlugin('rollup-plugin-dts')?.default;
const analyzer = loadPlugin('rollup-plugin-analyzer');

// 优化的terser配置
const terserConfig = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.debug'],
    passes: 2,
  },
  mangle: {
    properties: {
      regex: /^_/,
    },
  },
  format: {
    comments: false,
  },
};

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'fs',
  'path',
  'os',
  'child_process',
  'util',
  'events',
  'stream',
  'crypto',
  'http',
  'https',
  'url',
  'querystring',
  'zlib',
];

// 优化的resolve配置
const resolveConfig = {
  preferBuiltins: true,
  browser: false,
  exportConditions: ['node'],
};

// 优化的commonjs配置
const commonjsConfig = {
  ignoreDynamicRequires: true,
  transformMixedEsModules: true,
};

module.exports = [
  // 主库打包配置
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: pkg.main.replace('.js', '.min.js'),
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
        plugins: terser ? [terser(terserConfig)] : [],
      },
      {
        file: pkg.module || pkg.main.replace('.js', '.mjs'),
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
    ],
    external,
    plugins: [
      resolve && resolve(resolveConfig),
      commonjs && commonjs(commonjsConfig),
      json && json(),
      typescript && typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: false,
      }),
      process.env.ANALYZE && analyzer && analyzer({
        summaryOnly: true,
        limit: 10,
      }),
    ].filter(Boolean),
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  },
  // CLI 打包配置
  {
    input: 'src/cli.ts',
    output: {
      file: 'bin/index.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve && resolve(resolveConfig),
      commonjs && commonjs(commonjsConfig),
      json && json(),
      typescript && typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: false,
      }),
    ].filter(Boolean),
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  },
  // 类型声明文件打包配置（仅在dts插件可用时）
  ...(dts ? [{
    input: 'src/index.ts',
    output: {
      file: pkg.types || pkg.main.replace('.js', '.d.ts'),
      format: 'es',
    },
    external,
    plugins: [dts()],
  }] : []),
];
