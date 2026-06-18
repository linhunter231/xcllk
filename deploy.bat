@echo off
chcp 65001 >nul
echo ========================================
echo     行草连连看 - 一键部署脚本
echo ========================================
echo.

REM 检查是否有 Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Git，请先安装 Git: https://git-scm.com/
    pause
    exit /b 1
)

echo [1/5] 检查 Git 状态...
git status
echo.

REM 检查是否已有远程仓库
for /f "tokens=*" %%i in ('git remote 2^>nul') do set HAS_REMOTE=1
if "%HAS_REMOTE%"=="1" (
    echo [检测] 发现已配置远程仓库
    git remote -v
    echo.

    echo [2/5] 添加所有文件到暂存区...
    git add -A
    echo.

    echo [3/5] 提交更改...
    git commit -m "update: 提交最新代码 %date% %time%"
    echo.

    echo [4/5] 推送到远程仓库...
    git push
    echo.

    echo [5/5] 完成！
    echo.
    echo ========================================
    echo  部署成功！现在可以在 GitHub Pages 访问
    echo ========================================
) else (
    echo [检测] 未发现远程仓库，需要先初始化
    echo.
    echo 请按以下步骤操作：
    echo.
    echo 步骤 1: 在 GitHub 上创建一个新仓库 (https://github.com/new)
    echo 步骤 2: 复制仓库地址 (如: https://github.com/你的用户名/仓库名.git)
    echo 步骤 3: 在下面粘贴仓库地址
    echo.

    set /p REPO_URL=请输入你的 GitHub 仓库地址:

    if "%REPO_URL%"=="" (
        echo [错误] 未输入仓库地址
        pause
        exit /b 1
    )

    echo.
    echo [2/5] 初始化 Git 仓库...
    git init
    echo.

    echo [3/5] 添加所有文件...
    git add -A
    echo.

    echo [4/5] 创建首次提交...
    git commit -m "feat: 初始化行草连连看游戏项目"
    echo.

    echo [5/5] 添加远程仓库并推送...
    git branch -M main
    git remote add origin %REPO_URL%
    git push -u origin main
    echo.

    echo ========================================
    echo  部署成功！
    echo ========================================
    echo.
    echo 下一步: 启用 GitHub Pages
    echo 1. 打开你的 GitHub 仓库页面
    echo 2. 点击 Settings (设置)
    echo 3. 找到 Pages (页面) 设置
    echo 4. Source (来源) 选择 "Deploy from a branch"
    echo 5. Branch (分支) 选择 "main"，目录选择 "/ (root)"
    echo 6. 点击 Save (保存)
    echo 7. 等待几分钟，即可通过 https://你的用户名.github.io/仓库名/ 访问游戏
    echo.
)

pause
