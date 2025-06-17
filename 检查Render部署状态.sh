#!/bin/bash

echo "=== 检查Render部署状态 ==="
echo "时间: $(date)"
echo ""

echo "🔍 检查服务是否在线..."
SERVICE_URL="https://indonesia-map-feishu-integration.onrender.com"

echo "📡 测试健康检查接口..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n响应时间: %{time_total}s\n" "${SERVICE_URL}/health" || echo "❌ 服务无法访问"

echo ""
echo "📡 测试根路径..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n响应时间: %{time_total}s\n" "${SERVICE_URL}/" || echo "❌ 服务无法访问"

echo ""
echo "📋 最近的Git提交:"
git log --oneline -3

echo ""
echo "🔧 如果服务无法访问，请："
echo "1. 访问 https://dashboard.render.com"
echo "2. 检查 indonesia-map-feishu-integration 服务状态"
echo "3. 查看部署日志"
echo "4. 确认环境变量 GITHUB_TOKEN 已设置"
echo ""
echo "✅ 完成检查" 