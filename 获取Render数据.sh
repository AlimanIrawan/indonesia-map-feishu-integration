#!/bin/bash

# 从Render服务器获取最新数据
# 确保本地数据与服务器数据同步

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "📡 从Render服务器获取最新数据"
echo "=================================="

# Render服务器地址
RENDER_URL="https://indonesia-map-feishu-integration.onrender.com"

# 1. 检查服务器状态
print_status "检查Render服务器状态..."
if curl -s --connect-timeout 10 "${RENDER_URL}/api/health" > /dev/null; then
    print_success "Render服务器运行正常"
else
    print_error "无法连接到Render服务器"
    print_warning "请检查网络连接或服务器状态"
    exit 1
fi

# 2. 获取服务器数据统计
print_status "获取服务器数据统计..."
SERVER_STATS=$(curl -s "${RENDER_URL}/api/status" | grep -o '"recordCount":[0-9]*' | cut -d':' -f2)

if [ ! -z "$SERVER_STATS" ]; then
    print_status "服务器数据记录数: $SERVER_STATS"
else
    print_warning "无法获取服务器统计信息"
fi

# 3. 备份当前本地数据
if [ -f "public/markers.csv" ]; then
    LOCAL_COUNT=$(wc -l < public/markers.csv)
    print_status "当前本地数据行数: $LOCAL_COUNT"
    
    BACKUP_FILE="public/markers_backup_$(date +%Y%m%d_%H%M%S).csv"
    cp public/markers.csv "$BACKUP_FILE"
    print_status "本地数据已备份到: $BACKUP_FILE"
fi

# 4. 尝试从多个可能的端点获取数据
print_status "尝试获取最新数据..."

# 尝试从API端点获取
if curl -s "${RENDER_URL}/api/data/csv" -o public/markers_new.csv 2>/dev/null && [ -s public/markers_new.csv ]; then
    print_success "从API端点成功获取数据"
    mv public/markers_new.csv public/markers.csv
elif curl -s "${RENDER_URL}/markers.csv" -o public/markers_new.csv 2>/dev/null && [ -s public/markers_new.csv ]; then
    print_success "从静态文件端点成功获取数据"
    mv public/markers_new.csv public/markers.csv
else
    print_warning "无法从服务器获取CSV数据"
    print_status "使用当前本地数据继续"
    rm -f public/markers_new.csv
fi

# 5. 验证数据
if [ -f "public/markers.csv" ]; then
    NEW_COUNT=$(wc -l < public/markers.csv)
    print_status "更新后本地数据行数: $NEW_COUNT"
    
    # 显示最新数据样本
    print_status "数据样本（最后5行）:"
    tail -5 public/markers.csv | while read line; do
        echo "   $line"
    done
    
    print_success "数据同步完成！"
else
    print_error "数据文件不存在"
    exit 1
fi

echo ""
print_success "数据获取完成！"
echo "=========================================="
echo "📊 数据统计:"
echo "   服务器记录数: ${SERVER_STATS:-未知}"
echo "   本地数据行数: $NEW_COUNT"
echo ""
echo "🗺️  现在可以在地图应用中查看完整数据" 