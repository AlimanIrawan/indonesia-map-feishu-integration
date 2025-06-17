#!/bin/bash

echo "🚀 更新Render部署配置"
echo "================================"

echo "📝 当前更改："
echo "✅ 已更新 render.yaml 配置"
echo "✅ 服务名改为: feishu-github-proxy"
echo "✅ 启动命令改为: node feishu-proxy-server.js"
echo "✅ 添加健康检查: /health"

echo ""
echo "📦 提交更改到Git..."
git add .

git commit -m "更新Render配置使用新的中转服务器

- 修改render.yaml配置
- 使用feishu-proxy-server.js作为启动文件
- 添加健康检查路径
- 简化部署配置"

echo ""
echo "🚀 推送到GitHub（这会触发Render自动重新部署）..."
git push

echo ""
echo "✅ 更新完成！"
echo ""
echo "🔍 **接下来的步骤**："
echo "1. 等待Render自动重新部署（约2-3分钟）"
echo "2. 查看Render控制台确认部署状态"
echo "3. 测试新的服务器URL"
echo "4. 更新飞书配置中的URL"

echo ""
echo "📱 **Render控制台**："
echo "访问: https://dashboard.render.com"
echo "查看服务: feishu-github-proxy"

echo ""
echo "🔗 **新的服务端点**："
echo "健康检查: https://你的域名.onrender.com/health"
echo "中转接口: https://你的域名.onrender.com/feishu-to-github" 