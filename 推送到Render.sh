#!/bin/bash

echo "🚀 推送更新到Render部署"
echo "======================================="
echo ""

# 检查Git状态
if [ ! -d ".git" ]; then
    echo "📝 初始化Git仓库..."
    git init
    
    # 创建.gitignore文件
    echo "🛡️ 创建.gitignore文件..."
    cat > .gitignore << 'EOF'
# 日志文件
logs/
*.log

# 备份文件
backups/

# 环境变量文件
.env
.env.local
.env.production

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 系统文件
.DS_Store
Thumbs.db

# 编辑器文件
.vscode/
.idea/
*.swp
*.swo

# 临时文件
*.tmp
*.temp

# 测试覆盖率报告
coverage/

# 打包文件
dist/
build/

# 运行时文件
*.pid
*.lock
EOF
    
    echo "✅ .gitignore 文件已创建"
fi

echo "📊 检查文件状态..."
git status

echo ""
echo "📦 添加所有更改的文件..."
git add .

echo ""
echo "💬 提交更改..."
git commit -m "更新Webhook端点：支持飞书自动化直接推送

- 添加简化的/webhook端点
- 支持飞书自动化的record.fields数据格式  
- 添加数据清空功能/api/data/clear
- 完善日志和错误处理
- 更新配置指南和测试工具"

echo ""
echo "🔗 检查远程仓库..."
if ! git remote get-url origin &> /dev/null; then
    echo "❌ 未配置远程仓库！"
    echo "请在GitHub创建一个新仓库，然后运行以下命令："
    echo ""
    echo "git remote add origin https://github.com/您的用户名/仓库名.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    echo "然后将这个仓库连接到您的Render服务。"
    exit 1
else
    echo "✅ 远程仓库已配置"
    echo "🚀 推送到远程仓库..."
    
    # 设置主分支
    git branch -M main
    
    # 推送更改
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 代码推送成功！"
        echo "======================================="
        echo "✅ 代码已推送到GitHub"
        echo "✅ Render将自动部署更新"
        echo "⏳ 请等待1-3分钟让Render完成部署"
        echo ""
        echo "🔗 部署完成后可测试："
        echo "https://indonesia-map-feishu-integration.onrender.com/webhook"
        echo ""
        echo "📋 下一步："
        echo "1. 等待Render部署完成"  
        echo "2. 运行测试脚本验证"
        echo "3. 在飞书中配置自动化"
    else
        echo "❌ 推送失败，请检查网络连接和权限"
    fi
fi

echo ""
read -p "按回车键关闭窗口..." 