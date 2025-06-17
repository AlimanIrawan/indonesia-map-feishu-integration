#!/bin/bash

echo "🔍 测试 Render 服务状态"
echo "======================"

SERVICE_URL="https://indonesia-map-feishu-integration.onrender.com"

echo "🌐 服务地址: $SERVICE_URL"
echo "🕒 测试时间: $(date)"
echo ""

echo "📡 测试根路径..."
response=$(curl -s -w "%{http_code}" -o response.json "$SERVICE_URL")

echo "📊 HTTP状态码: $response"

if [ -f response.json ]; then
    echo "📄 响应内容:"
    cat response.json | python3 -m json.tool 2>/dev/null || cat response.json
    echo ""
    rm response.json
fi

if [ $response -eq 200 ]; then
    echo "✅ 根路径测试成功"
else
    echo "❌ 根路径测试失败"
fi

echo ""
echo "📡 测试 /markers 端点..."
markers_response=$(curl -s -w "%{http_code}" -o markers.json "$SERVICE_URL/markers")

echo "📊 HTTP状态码: $markers_response"

if [ -f markers.json ]; then
    echo "📄 响应内容:"
    cat markers.json | python3 -m json.tool 2>/dev/null || cat markers.json
    echo ""
    rm markers.json
fi

if [ $markers_response -eq 200 ]; then
    echo "✅ /markers 端点测试成功"
else
    echo "❌ /markers 端点测试失败"
fi

echo ""
echo "🔧 测试总结:"
if [ $response -eq 200 ] && [ $markers_response -eq 200 ]; then
    echo "✅ Render 服务运行正常，所有端点都响应正常"
    echo "🔄 GitHub Actions keep-alive 应该能正常工作"
else
    echo "❌ Render 服务存在问题"
    echo "🔍 建议检查 Render 部署状态"
fi

echo ""
echo "💡 注意："
echo "   - 如果服务刚启动，可能需要几分钟才能完全可用"
echo "   - Render 免费服务在无活动时会自动休眠"
echo "   - 第一次访问休眠服务时响应可能较慢" 