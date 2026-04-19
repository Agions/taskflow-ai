# TaskFlow AI - Windows PowerShell 一键安装脚本
# 版本: 2.2.1
# 运行方式: iwr -useb https://raw.githubusercontent.com/Agions/taskflow-ai/main/scripts/install.ps1 | iex

param(
    [switch]$Uninstall,
    [switch]$Check,
    [string]$Method = "npm"
)

$VERSION = "2.2.1"
$PACKAGE_NAME = "taskflow-ai"

# 颜色函数
function Write-Banner {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "   TaskFlow AI v$VERSION Windows 安装脚本                    " -ForegroundColor Cyan
    Write-Host "   智能 PRD 文档解析与任务管理助手                           " -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step { param($msg) Write-Host "➤ $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }

# 检查 Node.js
function Test-Node {
    Write-Step "检查 Node.js 环境..."
    
    try {
        $nodeVersion = node --version
        $nodeMajor = [int]($nodeVersion -replace 'v','' -split '\.')[0]
        
        if ($nodeMajor -lt 18) {
            Write-Err "Node.js 版本过低 (当前: $nodeVersion, 需要: >= 18.0.0)"
            Write-Host "请从 https://nodejs.org/ 安装 Node.js 18+"
            exit 1
        }
        
        Write-Success "Node.js $nodeVersion ✓"
        return $true
    }
    catch {
        Write-Err "Node.js 未安装"
        Write-Host "请从 https://nodejs.org/ 安装 Node.js 18+"
        exit 1
    }
}

# 检查 npm
function Test-Npm {
    Write-Step "检查 npm..."
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = npm --version
        Write-Success "npm v$npmVersion ✓"
        return $true
    }
    else {
        Write-Err "npm 未安装"
        return $false
    }
}

# 卸载
function Uninstall-Package {
    Write-Step "卸载 TaskFlow AI..."
    
    try {
        npm uninstall -g $PACKAGE_NAME -ErrorAction SilentlyContinue
        pnpm remove -g $PACKAGE_NAME -ErrorAction SilentlyContinue
        yarn global remove $PACKAGE_NAME -ErrorAction SilentlyContinue
        Write-Success "TaskFlow AI 已卸载"
    }
    catch {
        Write-Warning "卸载时出现一些警告（可忽略）"
    }
}

# 安装
function Install-Package {
    Write-Step "安装 TaskFlow AI..."
    
    switch ($Method.ToLower()) {
        "npm" {
            npm install -g $PACKAGE_NAME --registry https://registry.npmjs.org/
        }
        "pnpm" {
            if (Get-Command pnpm -ErrorAction SilentlyContinue) {
                pnpm add -g $PACKAGE_NAME
            } else {
                Write-Warning "pnpm 未安装，使用 npm"
                npm install -g $PACKAGE_NAME --registry https://registry.npmjs.org/
            }
        }
        "yarn" {
            if (Get-Command yarn -ErrorAction SilentlyContinue) {
                yarn global add $PACKAGE_NAME
            } else {
                Write-Warning "yarn 未安装，使用 npm"
                npm install -g $PACKAGE_NAME --registry https://registry.npmjs.org/
            }
        }
        default {
            npm install -g $PACKAGE_NAME --registry https://registry.npmjs.org/
        }
    }
}

# 验证
function Test-Installation {
    Write-Step "验证安装..."
    
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + $env:Path
    
    Start-Sleep -Seconds 2
    
    try {
        $result = taskflow --version 2>$null
        if ($result) {
            Write-Success "TaskFlow AI $result 安装成功！"
            return $true
        }
    }
    catch {}
    
    try {
        $result = taskflow-ai --version 2>$null
        if ($result) {
            Write-Success "TaskFlow AI $result 安装成功！"
            return $true
        }
    }
    catch {}
    
    Write-Warning "安装成功但命令未生效，请重新打开终端"
    return $true
}

# 主程序
function Main {
    Write-Banner
    
    if ($Uninstall) {
        Uninstall-Package
        return
    }
    
    if ($Check) {
        Test-Node
        Test-Npm
        Write-Success "环境检查通过！"
        return
    }
    
    Test-Node
    Test-Npm
    
    Uninstall-Package
    Install-Package
    Test-Installation
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "               安装成功！开始使用 TaskFlow AI" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "  快速开始:"
    Write-Host "    taskflow init              # 初始化项目"
    Write-Host "    taskflow --help            # 查看帮助"
    Write-Host ""
    Write-Host "  配置 AI 模型:"
    Write-Host '    taskflow config set models.deepseek.apiKey "your-key"'
    Write-Host ""
    Write-Host "  查看文档: https://agions.github.io/taskflow-ai/"
    Write-Host ""
}

Main
