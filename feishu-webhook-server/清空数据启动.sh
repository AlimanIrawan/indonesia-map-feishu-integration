#!/bin/bash

# 清空Render数据启动脚本
echo "🗑️ 清空Render服务器数据启动器"
echo "======================================="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装Node.js，请先安装Node.js"
    exit 1
fi

# 检查当前目录
if [ ! -f "清空Render数据.js" ]; then
    echo "❌ 未找到清空脚本文件"
    echo "请确保在feishu-webhook-server目录中运行"
    exit 1
fi

echo "⚠️  重要提醒："
echo "此操作将清空Render服务器上的所有CSV数据！"
echo "本地数据也会被重置为只有表头的状态。"
echo ""
echo "🎯 操作内容："
echo "1. 清空Render服务器CSV数据"  
echo "2. 重置本地CSV文件"
echo "3. 验证清空结果"
echo "4. 准备接收新的Webhook数据"
echo ""

# 自动确认（适合脚本环境）
echo "🚀 开始执行清空操作..."
echo ""

# 运行清空脚本
node 清空Render数据.js

echo ""
echo "🎯 下一步操作："
echo "================================="
echo "1. 查看配置指南："
echo "   cat ../简化飞书Webhook配置指南.txt"
echo ""
echo "2. 在飞书中配置自动化："
echo "   URL: https://indonesia-map-feishu-integration.onrender.com/webhook"
echo ""
echo "3. 测试数据推送："
echo "   在飞书表格中添加测试记录"
echo ""
echo "4. 验证地图显示："
echo "   访问地图应用查看数据"
echo ""

read -p "按回车键关闭窗口..." 