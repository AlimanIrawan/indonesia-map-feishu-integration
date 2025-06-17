#!/bin/bash

echo "🚀 首次推送到Git仓库"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 进入项目目录
cd "$(dirname "$0")"

echo -e "${BLUE}📂 当前目录: $(pwd)${NC}"

# 检查是否已经是Git仓库
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️ 已经是Git仓库，将添加新的远程仓库${NC}"
else
    echo -e "${GREEN}📦 初始化Git仓库...${NC}"
    git init
fi

# 创建或更新.gitignore文件
echo -e "${BLUE}📝 创建.gitignore文件...${NC}"
cat > .gitignore << 'EOF'
# 依赖文件
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 生产构建
build/
dist/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
logs/
*.log

# 临时文件
.DS_Store
Thumbs.db
*.tmp
*.temp

# IDE配置
.vscode/
.idea/
*.swp
*.swo

# 测试覆盖率
coverage/

# 缓存文件
.cache/
.eslintcache

# 操作系统文件
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# 备份文件
*.backup
*.bak
*.old

# 敏感信息
secrets/
config/secrets.json
EOF

echo -e "${GREEN}✅ .gitignore文件创建完成${NC}"

# 添加所有文件到暂存区
echo -e "${BLUE}📋 添加文件到Git...${NC}"
git add .

# 检查是否有文件需要提交
if git diff --cached --quiet; then
    echo -e "${YELLOW}📝 没有新文件需要提交${NC}"
else
    echo -e "${GREEN}💾 提交文件...${NC}"
    git commit -m "🎉 首次提交: GitHub Actions + 飞书集成地图应用

    功能特性:
    - 印尼地图应用显示冰淇淋店铺分布
    - 飞书多维表格自动化集成
    - GitHub Actions自动数据同步
    - 直接从GitHub读取CSV数据
    - 支持多品牌筛选和统计
    - 响应式设计，支持移动端
    
    技术栈:
    - React + TypeScript
    - Leaflet地图库
    - GitHub Actions工作流
    - 飞书自动化脚本
    
    部署方式:
    - 前端: Netlify/Vercel
    - 数据存储: GitHub仓库
    - 自动化: GitHub Actions
    - 完全免费解决方案"
fi

# 检查是否已配置远程仓库
if git remote get-url origin > /dev/null 2>&1; then
    echo -e "${YELLOW}📡 远程仓库已存在${NC}"
    git remote -v
else
    echo -e "${BLUE}🔗 配置远程仓库...${NC}"
    echo "请输入GitHub仓库地址 (例如: https://github.com/username/repo.git):"
    read -r REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✅ 远程仓库配置完成${NC}"
    else
        echo -e "${RED}❌ 未提供仓库地址，跳过远程配置${NC}"
        exit 1
    fi
fi

# 推送到远程仓库
echo -e "${BLUE}🚀 推送到远程仓库...${NC}"

# 检查是否存在main分支
if git show-ref --verify --quiet refs/heads/main; then
    BRANCH="main"
else
    BRANCH="master"
    git branch -M main
    BRANCH="main"
fi

# 推送代码
if git push -u origin $BRANCH; then
    echo ""
    echo -e "${GREEN}🎉 代码推送成功！${NC}"
    echo ""
    echo -e "${BLUE}📋 下一步操作：${NC}"
    echo "1. 访问GitHub仓库查看代码"
    echo "2. 确保仓库是公开的（GitHub Actions免费使用）"
    echo "3. 按照 'GitHub_Actions完整部署指南.txt' 配置飞书集成"
    echo "4. 创建GitHub Personal Access Token"
    echo "5. 在飞书中配置自动化脚本"
    echo ""
    echo -e "${YELLOW}🔗 重要链接：${NC}"
    echo "• GitHub仓库: $(git remote get-url origin)"
    echo "• GitHub Actions: $(git remote get-url origin | sed 's/\.git$//')/actions"
    echo "• 数据文件: $(git remote get-url origin | sed 's/\.git$//')/blob/main/public/markers.csv"
    echo ""
    echo -e "${GREEN}✨ 推送完成！${NC}"
else
    echo -e "${RED}❌ 推送失败${NC}"
    echo "可能的原因："
    echo "1. 网络连接问题"
    echo "2. 仓库地址错误"
    echo "3. 权限不足"
    echo "4. 远程仓库不存在"
    echo ""
    echo "请检查并重试"
fi 