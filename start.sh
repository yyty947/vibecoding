#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}============================================${NC}"
echo "  诺曼底登陆 (D-Day Defense) - 启动脚本"
echo -e "${BLUE}============================================${NC}"
echo ""

# 检测 Python 命令（python3 或 python）
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}[错误] 未检测到 Python，请先安装 Python 3.x${NC}"
    echo ""
    echo "安装方法:"
    echo "  Ubuntu/Debian: sudo apt-get install python3"
    echo "  CentOS/RHEL:   sudo yum install python3"
    echo "  macOS:         brew install python3"
    echo ""
    exit 1
fi

echo -e "${GREEN}[1/3]${NC} 检查 Python 版本..."
$PYTHON_CMD --version
echo ""

echo -e "${GREEN}[2/3]${NC} 切换到项目目录..."
cd "$(dirname "$0")"
echo "当前目录: $(pwd)"
echo ""

# 清理可能占用的端口 8001
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "清理端口 8001..."
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}[3/3]${NC} 启动 HTTP 服务器..."
echo ""
echo -e "${BLUE}============================================${NC}"
echo "  游戏服务器已启动！"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "  ${GREEN}访问地址: http://localhost:8001${NC}"
echo ""
echo "  按 Ctrl + C 停止服务器"
echo ""
echo -e "${BLUE}============================================${NC}"
echo ""

# 启动服务器
$PYTHON_CMD -m http.server 8001
