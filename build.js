#!/usr/bin/env node

/**
 * 简化构建脚本
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 开始构建 TaskFlow AI...');

try {
  // 设置更宽松的TypeScript配置
  const tsconfigContent = {
    "compilerOptions": {
      "target": "ES2020",
      "module": "CommonJS",
      "lib": ["ES2020"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": false,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "declaration": true,
      "sourceMap": true,
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "allowSyntheticDefaultImports": true,
      "noImplicitAny": false,
      "strictNullChecks": false,
      "noImplicitReturns": false,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
  };

  require('fs').writeFileSync('./tsconfig.build.json', JSON.stringify(tsconfigContent, null, 2));

  // 使用宽松配置编译
  execSync('npx tsc --project tsconfig.build.json', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ 构建完成！');
  
  // 设置CLI入口权限
  const cliPath = path.join(__dirname, 'dist', 'cli', 'index.js');
  if (require('fs').existsSync(cliPath)) {
    require('fs').chmodSync(cliPath, 0o755);
    console.log('✅ CLI入口权限设置完成');
  }

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}