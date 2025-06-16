#!/bin/bash

# 飞书API配置测试脚本
# 用于验证飞书API配置是否正确

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🧪 飞书API配置测试开始..."
echo "📍 工作目录: $SCRIPT_DIR"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 检查依赖
echo "📦 检查依赖包..."
if [ ! -d "feishu-webhook-server/node_modules" ]; then
    echo "🔧 安装依赖包..."
    cd feishu-webhook-server
    npm install
    cd ..
fi

# 检查配置文件
if [ ! -f "feishu-webhook-server/飞书自动化模板.js" ]; then
    echo "❌ 配置文件不存在: feishu-webhook-server/飞书自动化模板.js"
    exit 1
fi

echo "🔍 检查配置文件内容..."

# 检查是否还有默认配置需要修改
cd feishu-webhook-server

echo "📋 当前配置状态："
echo ""

# 检查appSecret
if grep -q "your-app-secret" "飞书自动化模板.js"; then
    echo "⚠️  appSecret: 需要配置 (当前为默认值)"
else
    echo "✅ appSecret: 已配置"
fi

# 检查appToken
if grep -q "your-app-token" "飞书自动化模板.js"; then
    echo "⚠️  appToken: 需要配置 (当前为默认值)" 
else
    echo "✅ appToken: 已配置"
fi

# 检查tableId
if grep -q "your-table-id" "飞书自动化模板.js"; then
    echo "⚠️  tableId: 需要配置 (当前为默认值)"
else
    echo "✅ tableId: 已配置"
fi

# 检查webhook token
if grep -q "your-super-secret-token" "飞书自动化模板.js"; then
    echo "⚠️  webhook.token: 需要配置 (当前为默认值)"
else
    echo "✅ webhook.token: 已配置"
fi

echo ""

# 如果所有配置都已完成，运行测试
if ! grep -q "your-app-secret\|your-app-token\|your-table-id\|your-super-secret-token" "飞书自动化模板.js"; then
    echo "🚀 配置检查通过，开始测试连接..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 运行单条测试（不发送数据，只测试连接）
    node "飞书自动化模板.js" single
    TEST_RESULT=$?
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo "✅ 飞书API配置测试成功！"
        echo ""
        echo "📋 可以继续的操作："
        echo "1. 运行全量同步：双击 飞书强制全量同步.sh"
        echo "2. 检查地图应用数据是否正确显示"
    else
        echo "❌ 飞书API配置测试失败！"
        echo ""
        echo "🔍 请检查上面的错误信息并修正配置"
    fi
else
    echo "🔧 配置未完成，请按照以下步骤配置："
    echo ""
    echo "1. 打开文件：feishu-webhook-server/飞书自动化模板.js"
    echo "2. 参考文件：飞书API配置指南.txt"
    echo "3. 配置完成后再次运行此测试脚本"
    echo ""
    echo "📋 需要配置的参数："
    if grep -q "your-app-secret" "飞书自动化模板.js"; then
        echo "   - feishu.appSecret (飞书应用密钥)"
    fi
    if grep -q "your-app-token" "飞书自动化模板.js"; then
        echo "   - bitable.appToken (多维表格Token)"
    fi
    if grep -q "your-table-id" "飞书自动化模板.js"; then
        echo "   - bitable.tableId (表格ID)"
    fi
    if grep -q "your-super-secret-token" "飞书自动化模板.js"; then
        echo "   - webhook.token (服务器API密钥)"
    fi
fi

cd ..

echo ""
echo "⏰ 测试完成时间: $(date '+%Y-%m-%d %H:%M:%S')" 