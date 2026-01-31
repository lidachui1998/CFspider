#!/usr/bin/env node

/**
 * CFspider Browser CLI
 * 
 * 用法:
 *   npx cfspider-browser        # 启动开发服务器
 *   npx cfspider-browser build  # 构建生产版本
 *   npx cfspider-browser --help # 显示帮助
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0] || 'dev';

// 获取包的根目录
const packageRoot = path.resolve(__dirname, '..');

// 检查是否在正确的目录
const packageJsonPath = path.join(packageRoot, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found');
  process.exit(1);
}

// 帮助信息
function showHelp() {
  console.log(`
CFspider Browser - AI驱动的智能浏览器

用法:
  npx cfspider-browser [command]

命令:
  dev       启动开发服务器 (默认)
  build     构建 Electron 应用
  install   安装依赖
  help      显示帮助信息

示例:
  npx cfspider-browser           # 启动开发模式
  npx cfspider-browser build     # 构建应用

更多信息: https://www.cfspider.com
`);
}

// 运行 npm 脚本
function runNpmScript(script) {
  console.log(`\n🚀 CFspider Browser - Running: npm run ${script}\n`);
  
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  
  const child = spawn(npmCmd, ['run', script], {
    cwd: packageRoot,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
  
  child.on('close', (code) => {
    process.exit(code || 0);
  });
}

// 安装依赖
function installDeps() {
  console.log('\n📦 Installing dependencies...\n');
  
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  
  try {
    execSync(`${npmCmd} install`, {
      cwd: packageRoot,
      stdio: 'inherit'
    });
    console.log('\n✅ Dependencies installed successfully!\n');
    console.log('Run: npx cfspider-browser dev');
  } catch (err) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }
}

// 主逻辑
switch (command) {
  case 'dev':
  case 'start':
    runNpmScript('electron:dev');
    break;
    
  case 'build':
    runNpmScript('electron:build');
    break;
    
  case 'build-win':
    runNpmScript('electron:build-win');
    break;
    
  case 'build-mac':
    runNpmScript('electron:build-mac');
    break;
    
  case 'build-linux':
    runNpmScript('electron:build-linux');
    break;
    
  case 'install':
    installDeps();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
