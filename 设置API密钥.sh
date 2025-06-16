#!/bin/bash

echo "🔐 设置飞书API密钥"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 生成一个安全的API密钥
API_KEY="feishu-indonesia-map-2024-$(date +%s)-$(openssl rand -hex 8)"

echo "✅ 已生成安全的API密钥："
echo "   $API_KEY"
echo ""

# 更新飞书自动化模板.js
echo "📝 正在更新配置文件..."

sed -i '' "s/your-super-secret-token/$API_KEY/g" feishu-webhook-server/飞书自动化模板.js

echo "✅ 配置文件更新完成！"
echo ""
echo "🎯 当前配置摘要："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "App ID: cli_a8c55c2b3268900e"
echo "App Secret: kEOPt0k9hIMrVg82xqafgdbQZPYlCr8l"
echo "App Token: HEqVwhzBciH75KkD0ZclpFQugnJ"
echo "Table ID: tblr5cr35dwKZaj1"
echo "View ID: vewOt0hp6k"
echo "API Key: $API_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 配置完成！现在可以运行测试脚本："
echo "   ./飞书配置测试.sh" 