#!/bin/bash

# 飞书集成测试工具启动脚本
# 双击运行即可开始测试飞书数据推送功能

# 设置工作目录
cd "$(dirname "$0")"

echo "🚀 启动飞书集成测试工具..."
echo "================================================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js，请先安装Node.js"
    echo "下载地址：https://nodejs.org/"
    read -p "按回车键退出..."
    exit 1
fi

# 检查是否在项目目录
if [ ! -d "feishu-webhook-server" ]; then
    echo "❌ 错误：未找到feishu-webhook-server目录"
    echo "请确保在正确的项目目录中运行此脚本"
    read -p "按回车键退出..."
    exit 1
fi

# 进入webhook服务器目录
cd feishu-webhook-server

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        read -p "按回车键退出..."
        exit 1
    fi
fi

# 检查测试工具是否存在
if [ ! -f "飞书集成测试工具.js" ]; then
    echo "❌ 错误：未找到测试工具文件"
    read -p "按回车键退出..."
    exit 1
fi

# 提示用户
echo "✅ 环境检查完成"
echo ""
echo "📋 使用说明："
echo "1. 确保飞书数据接收服务正在运行（端口3001）"
echo "2. 如果服务未启动，请先运行 '启动飞书数据服务.sh'"
echo "3. 在测试工具中选择相应的测试项目"
echo ""
echo "开始运行测试工具..."
echo "================================================"

# 运行测试工具
node 飞书集成测试工具.js

# 等待用户确认
echo ""
echo "测试完成"
read -p "按回车键退出..." 