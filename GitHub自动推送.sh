#!/bin/bash

# GitHub自动推送脚本
# 用于初次推送和后续更新

echo "======================================"
echo "🚀 GitHub自动推送脚本"
echo "======================================"

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    echo "📂 初始化Git仓库..."
    git init
    echo "✅ Git仓库初始化完成"
fi

# 检查是否已配置远程仓库
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE_URL" ]; then
    echo "🔗 添加GitHub远程仓库..."
    git remote add origin https://github.com/AlimanIrawan/indonesia-map-app.git
    echo "✅ 远程仓库添加完成"
else
    echo "✅ 远程仓库已存在: $REMOTE_URL"
fi

# 检查分支
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
    echo "📋 创建并切换到main分支..."
    git checkout -b main
elif [ "$CURRENT_BRANCH" != "main" ]; then
    echo "📋 切换到main分支..."
    git checkout main 2>/dev/null || git checkout -b main
fi

# 添加所有文件到暂存区
echo "📦 添加文件到暂存区..."
git add .

# 检查是否有变更
if git diff --cached --quiet; then
    echo "ℹ️ 没有需要提交的变更"
    exit 0
fi

# 提交变更
COMMIT_MESSAGE="自动推送: 更新数据 $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 提交变更: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "======================================"
    echo "✅ 成功推送到GitHub!"
    echo "🌐 仓库地址: https://github.com/AlimanIrawan/indonesia-map-app"
    echo "📊 数据文件: https://github.com/AlimanIrawan/indonesia-map-app/blob/main/public/markers.csv"
    echo "======================================"
else
    echo "❌ 推送失败，请检查网络连接和权限"
    exit 1
fi 