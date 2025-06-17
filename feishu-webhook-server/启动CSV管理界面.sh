#!/bin/bash

echo "🚀 启动CSV数据管理界面"
echo "========================================"
echo ""

# 检查Node.js是否已安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误：未找到package.json文件"
    echo "请确保在feishu-webhook-server目录中运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

echo "🌐 启动服务器..."
echo ""

# 启动服务器（在后台运行）
node server.js &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 检查服务器是否成功启动
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 服务器已成功启动"
    echo "🌐 本地服务器地址: http://localhost:3001"
    echo "📊 管理界面地址: http://localhost:3001/admin"
    echo "🔧 Webhook测试地址: http://localhost:3001/webhook"
    echo ""
    echo "正在打开管理界面..."
    
    # 等待1秒确保页面可访问
    sleep 1
    
    # 在默认浏览器中打开管理界面
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "http://localhost:3001/admin"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "http://localhost:3001/admin"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start "http://localhost:3001/admin"
    fi
    
    echo ""
    echo "💡 提示："
    echo "- 在管理界面中可以查看和编辑CSV数据"
    echo "- 修改数据前请务必下载备份"
    echo "- 数据修改后立即影响地图显示"
    echo "- 按 Ctrl+C 停止服务器"
    echo ""
    
    # 等待用户中断
    trap "echo ''; echo '🛑 正在停止服务器...'; kill $SERVER_PID; echo '✅ 服务器已停止'; exit 0" INT
    
    # 保持脚本运行
    while kill -0 $SERVER_PID 2> /dev/null; do
        sleep 1
    done
    
else
    echo "❌ 服务器启动失败"
    echo "请检查端口3001是否被占用"
    kill $SERVER_PID 2> /dev/null
    exit 1
fi 