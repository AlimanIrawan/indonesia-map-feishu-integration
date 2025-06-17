#!/bin/bash

echo "🧪 测试飞书GitHub API连接"
echo "================================"

# 提示用户输入Token
echo "请输入你的GitHub Personal Access Token (格式: ghp_xxxxx):"
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ 错误：Token不能为空"
    exit 1
fi

echo ""
echo "🔍 第一步：测试Token有效性..."

# 测试Token是否有效
RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: token $TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/AlimanIrawan/indonesia-map-feishu-integration)

HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Token有效，仓库访问正常"
    echo "📋 仓库信息:"
    echo "$BODY" | grep -E '"name"|"full_name"|"private"' | head -3
else
    echo "❌ Token测试失败"
    echo "HTTP状态码: $HTTP_CODE"
    echo "响应内容: $BODY"
    exit 1
fi

echo ""
echo "🚀 第二步：测试repository dispatch API..."

# 测试完整的API调用
DISPATCH_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{
    "event_type": "feishu-data-update",
    "client_payload": {
      "shop_code": "TEST001",
      "latitude": "-6.2",
      "longitude": "106.816666",
      "outlet_name": "测试门店",
      "brand": "测试品牌",
      "kecamatan": "测试区域",
      "potensi": "高潜力"
    }
  }' \
  https://api.github.com/repos/AlimanIrawan/indonesia-map-feishu-integration/dispatches)

DISPATCH_HTTP_CODE="${DISPATCH_RESPONSE: -3}"
DISPATCH_BODY="${DISPATCH_RESPONSE%???}"

if [ "$DISPATCH_HTTP_CODE" = "204" ]; then
    echo "✅ Repository Dispatch调用成功！"
    echo "📊 状态码: $DISPATCH_HTTP_CODE (No Content - 这是正确的)"
    echo ""
    echo "🎉 GitHub Actions应该已经被触发"
    echo "📍 查看Actions运行状态："
    echo "   https://github.com/AlimanIrawan/indonesia-map-feishu-integration/actions"
else
    echo "❌ Repository Dispatch调用失败"
    echo "HTTP状态码: $DISPATCH_HTTP_CODE"
    echo "响应内容: $DISPATCH_BODY"
fi

echo ""
echo "📋 飞书自动化配置要点："
echo "================================"
echo "请求URL: https://api.github.com/repos/AlimanIrawan/indonesia-map-feishu-integration/dispatches"
echo "请求方法: POST"
echo "请求头:"
echo "  Authorization: token $TOKEN"
echo "  Content-Type: application/json"
echo "  Accept: application/vnd.github.v3+json"
echo ""
echo "⚠️  重要：飞书自动化配置中"
echo "   - 成功状态码设置为: 204"
echo "   - 或者设置为: 任何2xx状态码"
echo "   - 不要检查响应内容格式"

echo ""
echo "🔄 如果测试成功，请："
echo "1. 复制上面的Token到飞书自动化配置"
echo "2. 设置成功状态码为204"
echo "3. 在飞书表格中添加测试数据"
echo "4. 观察自动化执行结果" 