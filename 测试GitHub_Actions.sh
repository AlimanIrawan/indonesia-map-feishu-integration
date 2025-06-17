#!/bin/bash

echo "=== 测试GitHub Actions飞书数据更新工作流 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否提供了GitHub Token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ 错误：请设置GITHUB_TOKEN环境变量${NC}"
    echo "使用方法："
    echo "export GITHUB_TOKEN=ghp_your_token_here"
    echo "./测试GitHub_Actions.sh"
    exit 1
fi

echo -e "${BLUE}📋 测试信息：${NC}"
echo "仓库: AlimanIrawan/indonesia-map-app"
echo "工作流: update-feishu-data.yml"
echo "事件类型: feishu-data-update"

echo ""
echo -e "${YELLOW}🧪 准备发送测试数据...${NC}"

# 生成测试数据
TEST_SHOP_CODE="TEST$(date +%s)"
TEST_LATITUDE="-6.$(((RANDOM % 900000) + 100000))"
TEST_LONGITUDE="106.$(((RANDOM % 900000) + 800000))"
TEST_OUTLET_NAME="测试店铺_$(date +%H%M%S)"
TEST_BRAND="测试品牌"
TEST_KECAMATAN="测试区域"

echo -e "${BLUE}📝 测试数据：${NC}"
echo "店铺代码: $TEST_SHOP_CODE"
echo "纬度: $TEST_LATITUDE"
echo "经度: $TEST_LONGITUDE"
echo "店铺名称: $TEST_OUTLET_NAME"
echo "品牌: $TEST_BRAND"
echo "区域: $TEST_KECAMATAN"

echo ""
echo -e "${YELLOW}🚀 发送GitHub API请求...${NC}"

# 发送API请求
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "User-Agent: Test-Script" \
  https://api.github.com/repos/AlimanIrawan/indonesia-map-app/dispatches \
  -d "{
    \"event_type\": \"feishu-data-update\",
    \"client_payload\": {
      \"shop_code\": \"$TEST_SHOP_CODE\",
      \"latitude\": \"$TEST_LATITUDE\",
      \"longitude\": \"$TEST_LONGITUDE\",
      \"outlet_name\": \"$TEST_OUTLET_NAME\",
      \"brand\": \"$TEST_BRAND\",
      \"kecamatan\": \"$TEST_KECAMATAN\",
      \"potensi\": \"测试\"
    }
  }")

# 提取HTTP状态码
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo -e "${BLUE}📡 API响应：${NC}"
echo "HTTP状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✅ GitHub Actions触发成功！${NC}"
    echo ""
    echo -e "${YELLOW}📋 下一步操作：${NC}"
    echo "1. 访问：https://github.com/AlimanIrawan/indonesia-map-app/actions"
    echo "2. 查看'更新飞书数据到地图CSV'工作流的执行状态"
    echo "3. 检查是否有新的commit生成"
    echo "4. 验证public/markers.csv文件是否更新"
    echo ""
    echo -e "${BLUE}🔍 监控命令：${NC}"
    echo "git log --oneline -5  # 查看最近5次提交"
    echo "tail -5 public/markers.csv  # 查看CSV文件最后5行"
    
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ 认证失败：GitHub Token无效或权限不足${NC}"
    echo "请检查："
    echo "1. Token是否正确"
    echo "2. Token是否有repo权限"
    echo "3. Token是否已过期"
    
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ 仓库未找到：请检查仓库名称是否正确${NC}"
    
else
    echo -e "${RED}❌ 请求失败${NC}"
    echo "响应内容: $RESPONSE_BODY"
fi

echo ""
echo -e "${BLUE}🔗 相关链接：${NC}"
echo "• GitHub Actions: https://github.com/AlimanIrawan/indonesia-map-app/actions"
echo "• 仓库地址: https://github.com/AlimanIrawan/indonesia-map-app"
echo "• 数据文件: https://github.com/AlimanIrawan/indonesia-map-app/blob/main/public/markers.csv"

echo ""
echo -e "${GREEN}✨ 测试完成！${NC}" 