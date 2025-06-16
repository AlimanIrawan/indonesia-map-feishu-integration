#!/bin/bash

# 印尼地图应用启动脚本
echo "🚀 启动印尼地图应用..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    echo "📦 激活虚拟环境..."
    source venv/bin/activate
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo ""
    echo "📋 部署说明："
    echo "1. 将 build/ 目录部署到 Netlify"
    echo "2. 确保 Render 服务器正在运行"
    echo "3. 地图应用将自动从 Render 服务器读取最新数据"
    echo ""
    echo "🔗 数据流向："
    echo "飞书 → Render Webhook → Render CSV → Netlify 地图应用"
    echo ""
    echo "📊 现在地图应用会："
    echo "- 优先从 Render 服务器读取最新数据"
    echo "- 每30秒自动检查数据更新"
    echo "- 如果 Render 服务器不可用，使用本地备份数据"
    
    # 在macOS上自动打开构建目录
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        echo "📂 打开构建目录..."
        open build/
    fi
else
    echo "❌ 构建失败！请检查错误信息。"
    exit 1
fi 