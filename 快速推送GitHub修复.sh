#!/bin/bash

echo "🚀 修复ESLint警告并推送到GitHub..."

# 添加所有变更
git add .

# 提交变更
git commit -m "修复ESLint警告: 删除未使用的imports和变量"

# 推送到GitHub
git push origin main

echo "✅ 成功推送ESLint修复到GitHub!"
echo "📍 Netlify将自动检测此更改并重新部署" 