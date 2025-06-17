#!/bin/bash

# 修复飞书请求头问题 - 基于官方文档解决方案
# 适配 macOS 系统

echo "🎯 飞书官方解决方案 - 修复请求头问题"
echo "=================================="
echo ""

# 检查系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 此脚本专为 macOS 设计"
    exit 1
fi

echo "📋 根据飞书官方文档，问题原因："
echo "   - HTTP请求自动带上了content-type等请求头默认值"
echo "   - 导致飞书无法识别响应格式"
echo ""

echo "🔍 解决方案：删除请求头默认值"
echo ""

echo "📝 请按以下步骤操作："
echo ""

echo "=== 第一步：打开飞书自动化配置 ==="
echo "1. 打开飞书多维表格"
echo "2. 进入自动化设置"
echo "3. 找到'发送HTTP请求'配置"
echo ""

echo "=== 第二步：检查当前请求头 ==="
echo "当前可能存在的问题请求头："
echo "❌ Accept: application/vnd.github.v3+json"
echo "❌ User-Agent: Feishu-Automation"
echo "❌ 其他系统自动添加的请求头"
echo ""

echo "=== 第三步：删除所有请求头 ==="
echo "1. 在飞书自动化中，删除所有现有请求头"
echo "2. 包括系统可能自动添加的默认请求头"
echo ""

echo "=== 第四步：重新添加必要请求头 ==="
echo "只添加以下两个请求头："
echo ""
echo "✅ Authorization: token ghp_你的新Token"
echo "✅ Content-Type: application/json"
echo ""

echo "=== 第五步：确认配置 ==="
echo ""
echo "请求方法: POST"
echo ""
echo "请求URL:"
echo "https://api.github.com/repos/AlimanIrawan/indonesia-map-feishu-integration/dispatches"
echo ""
echo "请求体模板:"
cat << 'EOF'
{
  "event_type": "feishu-data-update",
  "client_payload": {
    "shop_code": "{{记录.shop_code}}",
    "latitude": "{{记录.latitude}}",
    "longitude": "{{记录.longitude}}",
    "outlet_name": "{{记录.outlet_name}}",
    "brand": "{{记录.brand}}",
    "kecamatan": "{{记录.kecamatan}}",
    "potensi": "{{记录.potensi}}"
  }
}
EOF
echo ""

echo "=== 第六步：测试配置 ==="
echo "1. 保存自动化配置"
echo "2. 在飞书表格中添加测试记录"
echo "3. 观察自动化执行结果"
echo ""

echo "✅ 成功标志："
echo "   - 飞书自动化显示'运行成功'"
echo "   - 没有'HTTP请求出参返回格式不正确'错误"
echo "   - GitHub Actions被成功触发"
echo ""

echo "🚨 重要提醒："
echo "   - 必须删除所有非必要的请求头"
echo "   - 特别是系统自动添加的默认值"
echo "   - 只保留Authorization和Content-Type"
echo ""

echo "🔧 故障排除："
echo "如果仍然报错，尝试："
echo "1. 完全删除所有请求头，只保留Authorization"
echo "2. 检查Token格式是否正确"
echo "3. 验证JSON格式是否正确"
echo ""

read -p "按回车键继续查看详细配置示例..."

echo ""
echo "=== 详细配置示例 ==="
echo ""
echo "🎯 最简化配置（推荐）："
echo ""
echo "请求头部分："
echo "┌─────────────────────────────────────────────┐"
echo "│ Authorization: token ghp_你的Token          │"
echo "│ Content-Type: application/json              │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "⚠️ 注意：不要添加任何其他请求头！"
echo ""

echo "🔄 如果问题仍然存在："
echo "1. 尝试只保留Authorization请求头"
echo "2. 甚至可以尝试完全不设置请求头"
echo "3. 检查飞书自动化的详细执行日志"
echo ""

echo "📞 技术支持："
echo "如果按照官方文档操作后仍有问题，"
echo "可以联系飞书技术支持获取进一步帮助。"
echo ""

echo "🎉 配置完成后，你的飞书自动化应该能正常工作了！"
echo ""

# 询问是否需要查看当前GitHub仓库状态
read -p "是否需要检查GitHub仓库状态？(y/n): " check_github

if [[ $check_github == "y" || $check_github == "Y" ]]; then
    echo ""
    echo "🔍 检查GitHub仓库状态..."
    
    if command -v git &> /dev/null; then
        if [ -d ".git" ]; then
            echo "📊 当前仓库状态："
            git status --short
            echo ""
            echo "📝 最近的提交："
            git log --oneline -5
        else
            echo "❌ 当前目录不是Git仓库"
        fi
    else
        echo "❌ Git未安装"
    fi
fi

echo ""
echo "✨ 修复完成！根据飞书官方文档，删除请求头默认值应该能解决问题。" 