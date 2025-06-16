#!/bin/bash

# 自动Git推送脚本
echo "📚 开始Git操作..."

# 检查当前目录是否是Git仓库
if [ ! -d ".git" ]; then
    echo "🆕 初始化Git仓库..."
    git init
    
    echo "📝 请输入远程仓库URL (例如: https://github.com/username/repo.git):"
    read remote_url
    
    if [ -n "$remote_url" ]; then
        echo "🔗 添加远程仓库..."
        git remote add origin "$remote_url"
    else
        echo "⚠️  未提供远程仓库URL，稍后可手动添加"
    fi
fi

# 创建或更新 .gitignore
echo "📄 创建/更新 .gitignore..."
cat > .gitignore << 'EOF'
# 依赖包
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 构建输出
dist/
build/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
*.log
logs/

# 系统文件
.DS_Store
Thumbs.db

# IDE/编辑器
.vscode/
.idea/
*.swp
*.swo

# 临时文件
*.tmp
*.temp

# Python虚拟环境（如果使用）
venv/
env/
__pycache__/
*.pyc

# 敏感数据
*.key
*.pem
secrets/

# 测试覆盖率
coverage/
.nyc_output

# Parcel缓存
.cache/
.parcel-cache/
EOF

# 添加所有文件
echo "📦 添加文件到Git..."
git add .

# 检查是否有变更
if git diff --staged --quiet; then
    echo "ℹ️  没有变更需要提交"
    exit 0
fi

# 提交变更
echo "💬 请输入提交信息 (留空使用默认信息):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="更新印尼地图应用 - 修复数据同步问题 $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "📝 提交变更..."
git commit -m "$commit_message"

# 检查是否有远程仓库
if git remote | grep -q "origin"; then
    echo "🚀 推送到远程仓库..."
    
    # 检查是否是首次推送
    if git ls-remote --heads origin | grep -q "main\|master"; then
        # 远程仓库已有分支，直接推送
        git push origin main 2>/dev/null || git push origin master 2>/dev/null
    else
        # 首次推送，设置上游分支
        git branch -M main
        git push -u origin main
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ 推送成功！"
        echo ""
        echo "🎯 接下来的步骤："
        echo "1. 在 Netlify 中连接此 Git 仓库"
        echo "2. 设置自动部署：当代码更新时自动重新部署"
        echo "3. 地图应用将从 Render 服务器读取最新数据"
        echo ""
        echo "🔗 完整数据流："
        echo "飞书 → Render Webhook → Render CSV → Netlify 地图应用"
    else
        echo "❌ 推送失败！请检查远程仓库URL和权限"
    fi
else
    echo "⚠️  未配置远程仓库"
    echo "请手动添加远程仓库："
    echo "git remote add origin <你的仓库URL>"
    echo "git push -u origin main"
fi

echo ""
echo "📋 Git操作完成！" 