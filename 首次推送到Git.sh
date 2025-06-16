#!/bin/bash

# 印尼地图飞书集成项目 - Git仓库初始化和推送脚本
# 一键完成Git初始化、添加文件、提交和推送

echo "🚀 开始初始化Git仓库并推送到GitHub..."
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Git是否已安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git未安装，请先安装Git${NC}"
    echo "在macOS上可以运行: xcode-select --install"
    exit 1
fi

echo -e "${GREEN}✅ Git已安装${NC}"

# 检查是否已经是Git仓库
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  检测到现有Git仓库${NC}"
    echo -e "${BLUE}🔍 检查仓库状态...${NC}"
    
    # 检查是否有远程仓库
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✅ 远程仓库已配置${NC}"
        
        # 检查未提交的更改
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${YELLOW}📝 检测到未提交的更改，正在提交...${NC}"
            git add .
            git commit -m "Update project files - $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        echo -e "${BLUE}🚀 正在推送到远程仓库...${NC}"
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 代码推送成功！${NC}"
        else
            echo -e "${RED}❌ 推送失败，请检查网络连接和权限${NC}"
            exit 1
        fi
        
    else
        echo -e "${YELLOW}⚠️  远程仓库未配置${NC}"
        echo "请按照下面的步骤配置远程仓库..."
    fi
else
    echo -e "${BLUE}📂 正在初始化Git仓库...${NC}"
    git init
    echo -e "${GREEN}✅ Git仓库初始化完成${NC}"
fi

# 如果没有远程仓库，指导用户配置
if ! git remote -v | grep -q "origin"; then
    echo ""
    echo "=================================================="
    echo -e "${YELLOW}📋 GitHub仓库配置指南${NC}"
    echo "=================================================="
    echo ""
    
    echo "请按照以下步骤操作："
    echo ""
    
    echo "1️⃣ 打开GitHub网站："
    echo "   访问：https://github.com"
    echo "   登录您的GitHub账户（如果没有请先注册）"
    echo ""
    
    echo "2️⃣ 创建新仓库："
    echo "   • 点击右上角的「+」→「New repository」"
    echo "   • Repository name: indonesia-map-feishu-integration"
    echo "   • Description: 印尼地图飞书集成系统"
    echo "   • 选择「Private」（推荐）或「Public」"
    echo "   • ❌ 不要勾选「Initialize this repository with README」"
    echo "   • 点击「Create repository」"
    echo ""
    
    echo "3️⃣ 复制仓库地址："
    echo "   在新创建的仓库页面，复制HTTPS地址"
    echo "   格式类似：https://github.com/您的用户名/indonesia-map-feishu-integration.git"
    echo ""
    
    echo "4️⃣ 配置远程仓库："
    read -p "请粘贴您的GitHub仓库HTTPS地址: " repo_url
    
    if [ -z "$repo_url" ]; then
        echo -e "${RED}❌ 仓库地址不能为空${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔗 正在配置远程仓库...${NC}"
    git remote add origin "$repo_url"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 远程仓库配置成功${NC}"
    else
        echo -e "${RED}❌ 远程仓库配置失败，请检查地址是否正确${NC}"
        exit 1
    fi
fi

# 创建.gitignore文件
echo -e "${BLUE}📝 创建.gitignore文件...${NC}"
cat > .gitignore << 'EOF'
# 依赖包
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json

# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
logs/
*.log

# 备份文件
backups/
*.backup

# 临时文件
.tmp/
.cache/
temp/

# 操作系统生成的文件
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# 编辑器配置
.vscode/
.idea/
*.swp
*.swo

# 测试覆盖率
coverage/

# 构建输出
dist/
build/

# 敏感数据
*secret*
*private*
*key*
config.json
EOF

echo -e "${GREEN}✅ .gitignore文件创建完成${NC}"

# 添加所有文件到Git
echo -e "${BLUE}📦 添加文件到Git...${NC}"
git add .

# 检查是否有文件被添加
if [ -z "$(git status --porcelain --cached)" ]; then
    echo -e "${YELLOW}⚠️  没有文件需要提交${NC}"
else
    echo -e "${GREEN}✅ 文件添加完成${NC}"
fi

# 提交更改
echo -e "${BLUE}💾 提交更改...${NC}"
git commit -m "Initial commit: 印尼地图飞书集成系统

包含功能:
- 飞书多维表格数据接收
- Node.js webhook服务器
- 地图数据自动更新
- Render云平台部署配置
- 完整的测试和配置工具

适用于macOS环境，支持虚拟环境运行"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 更改提交成功${NC}"
else
    echo -e "${YELLOW}⚠️  没有新的更改需要提交${NC}"
fi

# 设置主分支
echo -e "${BLUE}🌿 设置主分支...${NC}"
git branch -M main

# 推送到远程仓库
echo -e "${BLUE}🚀 推送到GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 代码推送成功！${NC}"
    echo "=================================================="
    echo ""
    
    echo -e "${GREEN}✅ Git仓库已就绪${NC}"
    echo -e "${GREEN}✅ 代码已推送到GitHub${NC}"
    echo -e "${GREEN}✅ 现在可以继续Render部署了${NC}"
    echo ""
    
    echo -e "${BLUE}📋 下一步操作：${NC}"
    echo "1. 双击运行「部署到Render.sh」"
    echo "2. 按照脚本指引完成Render部署"
    echo "3. 获取服务器地址后配置飞书自动化"
    echo ""
    
    # 询问是否打开GitHub页面
    read -p "🌐 是否现在打开您的GitHub仓库页面查看？ (y/n): " open_github
    
    if [[ $open_github =~ ^[Yy]$ ]]; then
        if git remote -v | grep -q "github.com"; then
            repo_url=$(git remote get-url origin | sed 's/\.git$//')
            if command -v open &> /dev/null; then
                # macOS
                open "$repo_url"
            else
                echo "请手动访问：$repo_url"
            fi
        fi
    fi
    
else
    echo -e "${RED}❌ 推送失败${NC}"
    echo ""
    echo "可能的原因："
    echo "• 网络连接问题"
    echo "• GitHub认证问题"
    echo "• 仓库地址错误"
    echo ""
    echo "解决方法："
    echo "1. 检查网络连接"
    echo "2. 确认GitHub用户名和密码"
    echo "3. 如果启用了2FA，使用Personal Access Token"
    echo ""
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Git推送脚本执行完成！${NC}"
echo "=================================================="

exit 0 