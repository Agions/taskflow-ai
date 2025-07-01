const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { terser } = require('rollup-plugin-terser');
const dts = require('rollup-plugin-dts').default;
const analyzer = require('rollup-plugin-analyzer');
const pkg = require('./package.json');

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
        plugins: [terser(terserConfig)],
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
      resolve(resolveConfig),
      commonjs(commonjsConfig),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: false,
      }),
      process.env.ANALYZE &&
        analyzer({
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
      resolve(resolveConfig),
      commonjs(commonjsConfig),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: false,
      }),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  },
  // 类型声明文件打包配置
  {
    input: 'src/index.ts',
    output: {
      file: pkg.types || pkg.main.replace('.js', '.d.ts'),
      format: 'es',
    },
    external,
    plugins: [dts()],
  },
];
