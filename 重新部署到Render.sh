#!/bin/bash

echo "=== 重新部署Indonesia地图飞书集成到Render ==="

# 检查是否在正确目录
if [ ! -f "feishu-webhook-server/server.js" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📁 当前项目目录: $(pwd)"

# 检查Git状态
echo ""
echo "📋 检查Git状态..."
git status

echo ""
echo "🔄 添加所有更改到Git..."
git add .

echo ""
echo "💾 提交更改..."
git commit -m "修复Render部署配置和服务器代码

- 添加render.yaml部署配置
- 确保package.json配置正确  
- 修复server.js可能的语法问题
- 优化启动脚本"

echo ""
echo "🚀 推送到远程仓库..."
git push origin main

echo ""
echo "✅ 代码已推送到GitHub!"
echo ""
echo "📌 下一步操作："
echo "1. 访问 https://dashboard.render.com"
echo "2. 找到您的 indonesia-map-feishu-integration 服务"
echo "3. 点击 'Manual Deploy' 按钮"
echo "4. 选择 'Deploy latest commit'"
echo ""
echo "🔧 如果还是失败，请检查Render的构建日志，查看具体错误信息。"
echo ""
echo "📞 需要帮助请提供Render的错误日志信息。" 