#!/bin/bash

echo "🚀 快速推送：修复Netlify数据源配置"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📂 当前目录: $(pwd)${NC}"

# 添加所有修改的文件
echo -e "${BLUE}📋 添加修改的文件...${NC}"
git add src/App.tsx
git add Netlify部署使用说明.txt
git add 飞书HTTP请求自动化配置.txt
git add 项目说明.txt

# 检查是否有文件需要提交
if git diff --cached --quiet; then
    echo -e "${YELLOW}📝 没有新的修改需要提交${NC}"
else
    echo -e "${GREEN}💾 提交修改...${NC}"
    git commit -m "🔧 修复Netlify数据源配置：全面切换到GitHub

    修复内容:
    - 修改App.tsx中所有数据源从Render改为GitHub
    - 更新区域名称加载：从GitHub读取
    - 更新数据检查：从GitHub检查更新
    - 创建飞书HTTP请求自动化配置指南
    - 更新Netlify部署使用说明
    - 删除不需要的本地启动脚本
    
    现在Netlify应用将正确从GitHub读取数据，
    实现完整的飞书→GitHub Actions→Netlify自动化流程"
fi

# 推送到远程仓库
echo -e "${BLUE}🚀 推送到GitHub...${NC}"

if git push; then
    echo ""
    echo -e "${GREEN}🎉 修复推送成功！${NC}"
    echo ""
    echo -e "${BLUE}✅ 现在Netlify将从GitHub读取数据${NC}"
    echo ""
    echo -e "${YELLOW}📋 下一步：${NC}"
    echo "1. 等待Netlify自动重新部署（1-2分钟）"
    echo "2. 访问您的Netlify应用测试数据加载"
    echo "3. 按照'飞书HTTP请求自动化配置.txt'配置飞书集成"
    echo "4. 测试完整的数据同步流程"
    echo ""
    echo -e "${GREEN}✨ 现在您的应用完全使用GitHub作为数据源！${NC}"
else
    echo -e "${RED}❌ 推送失败，请检查网络连接和权限${NC}"
fi 