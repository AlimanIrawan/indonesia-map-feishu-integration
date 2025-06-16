#!/bin/bash

# 飞书到Render全量数据同步脚本
# 此脚本会从飞书表格获取所有数据并完全替换Render服务器上的数据

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 准备进行飞书到Render全量数据同步..."
echo "⚠️  警告：此操作会完全替换Render服务器上的所有数据！"
echo "📍 工作目录: $SCRIPT_DIR"
echo ""

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装npm"
    exit 1
fi

# 检查依赖
echo "📦 检查依赖包..."
if [ ! -d "feishu-webhook-server/node_modules" ]; then
    echo "🔧 安装飞书服务器依赖包..."
    cd feishu-webhook-server
    npm install
    cd ..
fi

# 检查飞书自动化文件
if [ ! -f "feishu-webhook-server/飞书自动化模板.js" ]; then
    echo "❌ 飞书自动化文件不存在: feishu-webhook-server/飞书自动化模板.js"
    exit 1
fi

# 显示当前配置
echo "📊 当前配置信息："
echo "   飞书自动化脚本: feishu-webhook-server/飞书自动化模板.js"
echo "   同步模式: 全量替换（replace）"
echo "   目标服务器: https://indonesia-map-feishu-integration.onrender.com"

# 用户确认
echo ""
echo "🤔 您确定要执行飞书全量同步吗？这将会："
echo "   1. 从飞书表格获取所有当前数据"
echo "   2. 备份Render服务器当前数据"
echo "   3. 用飞书数据完全替换服务器数据"
echo "   4. 如果飞书删除了数据，服务器也会删除"
echo "   5. 实现飞书与Render 100%数据一致"
echo ""
read -p "确认执行？(输入 yes 继续): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "🚫 操作已取消"
    exit 0
fi

# 执行同步
echo ""
echo "🚀 开始执行飞书全量数据同步..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd feishu-webhook-server
node "飞书自动化模板.js" replace
SYNC_RESULT=$?
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查执行结果
if [ $SYNC_RESULT -eq 0 ]; then
    echo "✅ 飞书全量数据同步完成！"
    echo ""
    echo "📋 后续步骤："
    echo "1. 检查地图应用是否显示正确的数据"
    echo "2. 验证删除的记录确实不再显示"
    echo "3. 确认飞书数据与地图完全一致"
    echo "4. 如有问题，服务器有自动备份可恢复"
    echo ""
    echo "🌐 地图应用地址: https://locationmarker.netlify.app"
    echo "📊 服务器状态: https://indonesia-map-feishu-integration.onrender.com/api/status"
else
    echo "❌ 飞书全量数据同步失败！"
    echo ""
    echo "🔍 可能的解决方案："
    echo "1. 检查飞书应用配置（App ID, App Secret）"
    echo "2. 确认多维表格ID和视图ID正确"
    echo "3. 验证Render服务器在线"
    echo "4. 检查网络连接是否正常"
    echo "5. 确认API token配置正确"
    echo ""
    echo "📋 配置文件位置: feishu-webhook-server/飞书自动化模板.js"
fi

echo ""
echo "📝 同步日志已保存到服务器日志文件"
echo "⏰ 完成时间: $(date '+%Y-%m-%d %H:%M:%S')" 