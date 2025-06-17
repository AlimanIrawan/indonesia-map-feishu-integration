#!/bin/bash

echo "🗺️ 启动印尼地图应用"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 进入项目目录
cd "$(dirname "$0")"

echo -e "${BLUE}📂 当前目录: $(pwd)${NC}"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 首次运行，正在安装依赖...${NC}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        read -p "按任意键退出..."
        exit 1
    fi
fi

echo -e "${GREEN}🚀 启动开发服务器...${NC}"

# 启动开发服务器并在后台运行
npm start &
NPM_PID=$!

echo -e "${BLUE}⏰ 等待服务器启动...${NC}"

# 等待服务器启动
sleep 5

# 检查服务器是否启动成功
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ 服务器启动成功！${NC}"
    echo -e "${BLUE}🌐 正在打开浏览器...${NC}"
    
    # 在macOS上打开默认浏览器
    open http://localhost:3000
    
    echo ""
    echo -e "${GREEN}🎉 印尼地图应用已启动！${NC}"
    echo -e "${BLUE}📍 应用地址: http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}💡 使用说明：${NC}"
    echo "• 地图显示冰淇淋店铺分布"
    echo "• 可以按品牌筛选显示"
    echo "• 支持飞书数据自动同步"
    echo "• 数据直接从GitHub获取"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    
    # 等待用户中断
    wait $NPM_PID
else
    echo "❌ 服务器启动失败"
    kill $NPM_PID 2>/dev/null
fi

echo ""
echo -e "${BLUE}👋 应用已停止${NC}" 