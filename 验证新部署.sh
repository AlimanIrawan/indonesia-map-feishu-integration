#!/bin/bash

echo "=== 验证Render新部署 ==="
echo "时间: $(date)"
echo ""

SERVICE_URL="https://indonesia-map-feishu-integration.onrender.com"

echo "🔍 检查服务器信息..."
echo "📡 测试根路径..."
RESPONSE=$(curl -s "$SERVICE_URL/")
echo "响应: $RESPONSE"

echo ""
echo "🔍 检查是否包含新的端点..."
if echo "$RESPONSE" | grep -q "feishu-to-github"; then
    echo "✅ 发现新端点 /feishu-to-github - 部署成功！"
    
    echo ""
    echo "🧪 测试新的中转接口..."
    TEST_RESPONSE=$(curl -s -X POST "$SERVICE_URL/feishu-to-github" \
        -H "Content-Type: application/json" \
        -d '{
            "event_type": "feishu_update",
            "client_payload": {
                "shop_code": "test123",
                "latitude": "-6.2",
                "longitude": "106.8",
                "outlet_name": "测试店铺"
            }
        }')
    
    echo "测试响应: $TEST_RESPONSE"
    
    if echo "$TEST_RESPONSE" | grep -q "success"; then
        echo "✅ 中转接口工作正常！"
        echo ""
        echo "🎉 新部署验证成功！可以更新飞书配置了："
        echo "URL: $SERVICE_URL/feishu-to-github"
    else
        echo "⚠️ 中转接口可能有问题，但服务器已更新"
    fi
    
elif echo "$RESPONSE" | grep -q "api/feishu/webhook"; then
    echo "❌ 仍然是旧版本服务器"
    echo "包含的端点: /api/feishu/webhook"
    echo "需要继续等待或尝试其他解决方案"
else
    echo "❓ 无法确定服务器版本"
    echo "完整响应: $RESPONSE"
fi

echo ""
echo "✅ 检查完成" 