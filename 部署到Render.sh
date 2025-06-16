#!/bin/bash

# 印尼地图飞书集成服务 - Render部署脚本
# 一键部署到Render云平台

echo "🚀 开始部署飞书集成服务到Render平台..."
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要的工具
echo -e "${BLUE}📋 检查系统环境...${NC}"

# 检查git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git未安装，请先安装Git${NC}"
    exit 1
fi

# 检查node和npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js未安装，请先安装Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm未安装，请先安装npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 系统环境检查通过${NC}"

# 检查项目结构
echo -e "${BLUE}📂 检查项目结构...${NC}"

if [ ! -d "feishu-webhook-server" ]; then
    echo -e "${RED}❌ 找不到feishu-webhook-server目录${NC}"
    exit 1
fi

if [ ! -f "feishu-webhook-server/package.json" ]; then
    echo -e "${RED}❌ 找不到package.json文件${NC}"
    exit 1
fi

if [ ! -f "render.yaml" ]; then
    echo -e "${RED}❌ 找不到render.yaml配置文件${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 项目结构检查通过${NC}"

# 安装依赖
echo -e "${BLUE}📦 检查依赖包...${NC}"
cd feishu-webhook-server

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  依赖包未安装，正在安装...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 依赖包安装成功${NC}"
    else
        echo -e "${RED}❌ 依赖包安装失败${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 依赖包已安装${NC}"
fi

cd ..

# 检查Git仓库状态
echo -e "${BLUE}🔍 检查Git仓库状态...${NC}"

if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  尚未初始化Git仓库${NC}"
    echo -e "${BLUE}🔧 正在初始化Git仓库...${NC}"
    
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
    
    echo -e "${GREEN}✅ Git仓库初始化完成${NC}"
    
    echo -e "${YELLOW}📢 重要提醒：${NC}"
    echo "1. 请登录GitHub创建一个新的仓库"
    echo "2. 复制仓库的HTTPS地址"
    echo "3. 然后运行以下命令："
    echo ""
    echo -e "${BLUE}git remote add origin YOUR_GITHUB_REPO_URL${NC}"
    echo -e "${BLUE}git branch -M main${NC}"
    echo -e "${BLUE}git push -u origin main${NC}"
    echo ""
    
else
    echo -e "${GREEN}✅ Git仓库已存在${NC}"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  检测到未提交的更改${NC}"
        echo -e "${BLUE}🔧 正在提交更改...${NC}"
        
        git add .
        git commit -m "Update for Render deployment - $(date '+%Y-%m-%d %H:%M:%S')"
        
        echo -e "${GREEN}✅ 更改已提交${NC}"
    fi
    
    # 检查远程仓库
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✅ 远程仓库已配置${NC}"
        
        echo -e "${BLUE}🚀 正在推送到远程仓库...${NC}"
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 代码推送成功${NC}"
        else
            echo -e "${RED}❌ 代码推送失败，请检查网络连接和权限${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  尚未配置远程仓库${NC}"
        echo -e "${YELLOW}📢 请先配置远程仓库：${NC}"
        echo -e "${BLUE}git remote add origin YOUR_GITHUB_REPO_URL${NC}"
        exit 1
    fi
fi

# 显示Render部署指南
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 准备工作完成！现在可以部署到Render了${NC}"
echo "=================================================="
echo ""

echo -e "${BLUE}📋 接下来请按照以下步骤操作：${NC}"
echo ""

echo "1️⃣ 注册/登录Render账户："
echo "   访问：https://render.com"
echo "   点击「Get Started for Free」注册账户"
echo ""

echo "2️⃣ 创建Web Service："
echo "   • 点击「New +」→ 选择「Web Service」"
echo "   • 选择「Build and deploy from a Git repository」"
echo "   • 连接您的GitHub账户并选择这个仓库"
echo ""

echo "3️⃣ 配置部署设置："
echo "   • Name: indonesia-map-feishu-service"
echo "   • Region: Singapore (距离印尼最近)"
echo "   • Branch: main"
echo "   • Root Directory: feishu-webhook-server"
echo "   • Runtime: Node"
echo "   • Build Command: npm install"
echo "   • Start Command: node server.js"
echo ""

echo "4️⃣ 配置环境变量："
echo "   在「Environment Variables」部分添加："
echo "   • PORT = 3001"
echo "   • API_TOKEN = your-super-secret-token-12345"
echo "   • NODE_ENV = production"
echo ""

echo "5️⃣ 选择免费套餐："
echo "   • Instance Type: Free"
echo "   • 勾选「Auto-Deploy」"
echo ""

echo "6️⃣ 开始部署："
echo "   • 点击「Create Web Service」"
echo "   • 等待3-5分钟完成构建和部署"
echo ""

echo "7️⃣ 获取服务地址："
echo "   部署成功后，您会得到类似这样的地址："
echo "   https://indonesia-map-feishu-service.onrender.com"
echo ""

echo "8️⃣ 测试部署结果："
echo "   • 在浏览器中访问您的服务地址"
echo "   • 运行测试工具验证功能"
echo ""

echo -e "${YELLOW}💡 重要提醒：${NC}"
echo "• Render免费套餐15分钟无活动后会休眠"
echo "• 建议设置UptimeRobot监控保持服务活跃"
echo "• GitHub Actions会自动每10分钟ping服务防止休眠"
echo ""

echo -e "${GREEN}📚 相关文档：${NC}"
echo "• Render部署指南.txt - 详细的部署说明"
echo "• 飞书快速配置手册.txt - 飞书配置指南"
echo "• 飞书集成完整解决方案说明.txt - 完整系统说明"
echo ""

echo -e "${BLUE}🔧 部署完成后的配置：${NC}"
echo "1. 更新飞书配置中的服务器地址"
echo "2. 运行测试工具验证连接"
echo "3. 设置UptimeRobot监控（可选）"
echo ""

echo "=================================================="
echo -e "${GREEN}✅ 部署脚本执行完成！${NC}"
echo -e "${YELLOW}📝 请按照上述步骤在Render网站上完成部署${NC}"
echo "=================================================="

# 询问是否打开Render网站
echo ""
read -p "🌐 是否现在打开Render网站？ (y/n): " open_render

if [[ $open_render =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        # macOS
        open "https://render.com"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "https://render.com"
    else
        echo "请手动访问：https://render.com"
    fi
fi

exit 0 