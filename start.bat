@echo off
setlocal enabledelayedexpansion

REM 设置 UTF-8 编码
chcp 65001 >nul 2>&1

echo.
echo ============================================
echo   诺曼底登陆 (D-Day Defense) - 启动脚本
echo ============================================
echo.

REM 检测 Python 命令（python 或 py）
set PYTHON_CMD=
where python >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
    goto :python_found
)

where py >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    goto :python_found
)

echo [错误] 未检测到 Python，请先安装 Python 3.x
echo.
echo 下载地址: https://www.python.org/downloads/
echo.
pause
exit /b 1

:python_found
echo [1/3] 检查 Python 版本...
%PYTHON_CMD% --version
echo.

echo [2/3] 切换到项目目录...
cd /d "%~dp0"
echo 当前目录: %CD%
echo.

echo [3/3] 启动 HTTP 服务器...
echo.
echo ============================================
echo   游戏服务器已启动！
echo ============================================
echo.
echo   访问地址: http://localhost:8001
echo.
echo   按 Ctrl + C 停止服务器
echo.
echo ============================================
echo.

REM 清理可能占用的端口
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 等待端口释放
timeout /t 1 /nobreak >nul 2>&1

REM 启动服务器
%PYTHON_CMD% -m http.server 8001
