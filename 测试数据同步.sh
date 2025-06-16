#!/bin/bash

# 测试飞书数据同步到地图系统功能
# 验证webhook服务器是否能正确更新markers.csv文件

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_status() {
    echo -e "${BLUE}[信息]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

echo "🔧 测试飞书数据同步功能"
echo "=============================="

# 1. 检查当前目录
if [ ! -f "public/markers.csv" ]; then
    print_error "未找到 public/markers.csv 文件"
    print_error "请确保在项目根目录运行此脚本"
    exit 1
fi

# 2. 检查当前数据量
print_status "检查当前数据量..."
CURRENT_LINES=$(wc -l < public/markers.csv)
print_status "当前 markers.csv 文件行数: $CURRENT_LINES"

# 3. 启动webhook服务器（如果没有运行）
print_status "检查webhook服务器状态..."
if ! pgrep -f "node.*server.js" > /dev/null; then
    print_warning "Webhook服务器未运行，正在启动..."
    cd feishu-webhook-server
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        print_status "安装依赖..."
        npm install
    fi
    
    # 后台启动服务器
    nohup node server.js > ../webhook.log 2>&1 &
    SERVER_PID=$!
    cd ..
    
    print_status "等待服务器启动..."
    sleep 3
    
    # 检查是否启动成功
    if ps -p $SERVER_PID > /dev/null; then
        print_success "Webhook服务器已启动 (PID: $SERVER_PID)"
    else
        print_error "Webhook服务器启动失败"
        cat webhook.log
        exit 1
    fi
else
    print_success "Webhook服务器已在运行"
fi

# 4. 运行测试
print_status "运行数据同步测试..."
cd feishu-webhook-server

# 检查测试脚本依赖
if [ ! -f "node_modules/.bin/axios" ] && [ ! -f "../node_modules/.bin/axios" ]; then
    print_status "安装测试依赖..."
    npm install axios
fi

# 运行测试脚本
node test_markers_update.js

cd ..

# 5. 检查更新后的数据量
print_status "检查数据更新结果..."
NEW_LINES=$(wc -l < public/markers.csv)
ADDED_LINES=$((NEW_LINES - CURRENT_LINES))

print_status "更新后 markers.csv 文件行数: $NEW_LINES"
if [ $ADDED_LINES -gt 0 ]; then
    print_success "新增了 $ADDED_LINES 行数据"
    print_status "显示最新的数据..."
    tail -3 public/markers.csv
else
    print_warning "没有新增数据，可能是更新了现有记录"
fi

# 6. 测试地图应用自动刷新
print_status "地图应用会在30秒内自动检测到数据更新"
print_status "如果您的地图应用正在运行，请等待自动刷新或手动刷新浏览器"

echo ""
print_success "测试完成！"
echo "=========================================="
echo "📊 数据统计:"
echo "   原始数据行数: $CURRENT_LINES"
echo "   更新后行数: $NEW_LINES"
echo "   变化量: $ADDED_LINES"
echo ""
echo "📝 日志文件: webhook.log"
echo "📄 数据文件: public/markers.csv"
echo ""
echo "🗺️  在地图应用中查看更新的数据点" 