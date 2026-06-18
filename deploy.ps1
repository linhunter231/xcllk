# 行草连连看 - Git 部署脚本
# 使用方法: 在项目目录中右键点击 "使用 PowerShell 运行" 此脚本

param(
    [string]$RemoteUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   行草连连看 - Git 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
try {
    $null = git --version
    Write-Host "[OK] 检测到 Git 已安装" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Git，请先安装: https://git-scm.com/" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}
Write-Host ""

# 检查当前目录是否已有 git 仓库
$hasGit = Test-Path ".git"
if ($hasGit) {
    Write-Host "[信息] 已存在 Git 仓库" -ForegroundColor Yellow
    $remotes = git remote
    if ($remotes) {
        Write-Host "[信息] 已配置远程仓库:" -ForegroundColor Yellow
        git remote -v
        Write-Host ""

        # 已有远程仓库，直接提交并推送
        Write-Host "[1/3] 添加文件..." -ForegroundColor Cyan
        git add -A

        Write-Host "[2/3] 提交更改..." -ForegroundColor Cyan
        $commitMsg = "update: 提交最新代码 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git commit -m $commitMsg

        Write-Host "[3/3] 推送到远程仓库..." -ForegroundColor Cyan
        git push

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  成功！代码已推送到远程仓库" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "[信息] 未配置远程仓库" -ForegroundColor Yellow
        Write-Host ""

        if ([string]::IsNullOrEmpty($RemoteUrl)) {
            Write-Host "请先在 GitHub 上创建新仓库:" -ForegroundColor Yellow
            Write-Host "  1. 访问 https://github.com/new"
            Write-Host "  2. 创建新仓库"
            Write-Host "  3. 复制仓库地址 (如: https://github.com/username/repo.git)"
            Write-Host ""
            $RemoteUrl = Read-Host "请输入 GitHub 仓库地址"
        }

        if ([string]::IsNullOrEmpty($RemoteUrl)) {
            Write-Host "[错误] 未输入仓库地址" -ForegroundColor Red
            Read-Host "按回车键退出"
            exit 1
        }

        Write-Host ""
        Write-Host "[1/4] 添加所有文件..." -ForegroundColor Cyan
        git add -A

        Write-Host "[2/4] 创建提交..." -ForegroundColor Cyan
        git commit -m "feat: 初始化行草连连看游戏项目"

        Write-Host "[3/4] 设置主分支..." -ForegroundColor Cyan
        git branch -M main

        Write-Host "[4/4] 推送到远程仓库..." -ForegroundColor Cyan
        git remote add origin $RemoteUrl
        git push -u origin main

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  部署成功！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "现在需要在 GitHub 启用 Pages:" -ForegroundColor Yellow
        Write-Host "  1. 打开你的 GitHub 仓库页面"
        Write-Host "  2. 点击 Settings (设置)"
        Write-Host "  3. 找到 Pages (页面) 设置"
        Write-Host "  4. Source (来源) 选择 'Deploy from a branch'"
        Write-Host "  5. Branch (分支) 选择 'main'，目录选择 '/ (root)'"
        Write-Host "  6. 点击 Save (保存)"
        Write-Host "  7. 等待几分钟，即可访问游戏"
        Write-Host ""
    }
} else {
    Write-Host "[信息] 未初始化 Git 仓库" -ForegroundColor Yellow
    Write-Host ""

    if ([string]::IsNullOrEmpty($RemoteUrl)) {
        Write-Host "请先在 GitHub 上创建新仓库:" -ForegroundColor Yellow
        Write-Host "  1. 访问 https://github.com/new"
        Write-Host "  2. 创建新仓库"
        Write-Host "  3. 复制仓库地址 (如: https://github.com/username/repo.git)"
        Write-Host ""
        $RemoteUrl = Read-Host "请输入 GitHub 仓库地址"
    }

    if ([string]::IsNullOrEmpty($RemoteUrl)) {
        Write-Host "[错误] 未输入仓库地址" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }

    Write-Host ""
    Write-Host "[1/5] 初始化 Git 仓库..." -ForegroundColor Cyan
    git init

    Write-Host "[2/5] 添加所有文件..." -ForegroundColor Cyan
    git add -A

    Write-Host "[3/5] 创建首次提交..." -ForegroundColor Cyan
    git commit -m "feat: 初始化行草连连看游戏项目"

    Write-Host "[4/5] 设置主分支..." -ForegroundColor Cyan
    git branch -M main

    Write-Host "[5/5] 添加远程仓库并推送..." -ForegroundColor Cyan
    git remote add origin $RemoteUrl
    git push -u origin main

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  部署成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在需要在 GitHub 启用 Pages:" -ForegroundColor Yellow
    Write-Host "  1. 打开你的 GitHub 仓库页面"
    Write-Host "  2. 点击 Settings (设置)"
    Write-Host "  3. 找到 Pages (页面) 设置"
    Write-Host "  4. Source (来源) 选择 'Deploy from a branch'"
    Write-Host "  5. Branch (分支) 选择 'main'，目录选择 '/ (root)'"
    Write-Host "  6. 点击 Save (保存)"
    Write-Host "  7. 等待几分钟，即可访问游戏"
    Write-Host ""
}

Read-Host "按回车键退出"
