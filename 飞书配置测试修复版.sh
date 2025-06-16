#!/bin/bash

echo "🔧 飞书API配置修复测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查工作目录
WORK_DIR=$(pwd)
echo "📍 工作目录: $WORK_DIR"

echo ""
echo "🔍 分析400错误的可能原因："
echo "1. App Token或Table ID格式错误"
echo "2. View ID不存在或无权限"
echo "3. API权限不足"
echo "4. 请求参数格式错误"
echo ""

echo "📝 当前配置信息："
echo "App Token: HEqVwhzBciH75KkD0ZclpFQugnJ"
echo "Table ID: tblr5cr35dwKZaj1"
echo "View ID: 已暂时禁用"
echo ""

echo "🚀 开始修复版本测试..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 运行修复版本的测试
cd "$WORK_DIR"
node feishu-webhook-server/飞书自动化模板.js single

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $? -eq 0 ]; then
    echo "✅ 修复版本测试成功！"
    echo ""
    echo "📋 下一步操作："
    echo "1. 如果测试成功，运行全量同步："
    echo "   ./飞书强制全量同步.sh"
    echo "2. 检查地图应用数据更新"
else
    echo "❌ 修复版本测试仍然失败"
    echo ""
    echo "🔍 进一步诊断建议："
    echo "1. 检查飞书应用权限是否正确配置"
    echo "2. 确认App Token是否来自正确的多维表格"
    echo "3. 检查企业网络是否有API访问限制"
    echo "4. 联系飞书技术支持确认API参数格式"
fi

echo ""
echo "⏰ 测试完成时间: $(date '+%Y-%m-%d %H:%M:%S')" 